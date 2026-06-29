import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BigNumber from "bignumber.js";
import { CHARACTERS } from "../data/characters";
import { add, sub, mul, costForNext, gte, bn } from "../utils/bigNum";

const SAVE_KEY = "brainrot_save_v1";
const TICK_MS = 100; // update every 100ms

function initialOwnedState() {
  const owned = {};
  CHARACTERS.forEach((c) => { owned[c.id] = 0; });
  return owned;
}

function calcBps(owned, prestigeMultiplier, boostMultiplier) {
  let total = new BigNumber(0);
  CHARACTERS.forEach((c) => {
    const count = owned[c.id] || 0;
    if (count > 0) {
      total = total.plus(new BigNumber(c.baseBps).times(count));
    }
  });
  return total.times(prestigeMultiplier).times(boostMultiplier).toFixed(2);
}

export const useGameStore = create((set, get) => ({
  // --- state ---
  points: "0",
  totalEarned: "0",          // lifetime, used for leaderboard
  bps: "0",                  // points per second
  owned: initialOwnedState(),
  prestigeCount: 0,
  prestigeMultiplier: 1,
  boostActive: false,
  boostUntil: 0,             // timestamp ms
  boostMultiplier: 1,
  tickInterval: null,
  username: "",
  hasRemovedAds: false,

  // --- actions ---

  setUsername: (name) => set({ username: name }),

  removeAds: () => set({ hasRemovedAds: true }),

  tick: () => {
    const state = get();
    const now = Date.now();

    let boostMul = state.boostMultiplier;
    let boostActive = state.boostActive;
    if (boostActive && now > state.boostUntil) {
      boostActive = false;
      boostMul = 1;
    }

    const bps = calcBps(state.owned, state.prestigeMultiplier, boostMul);
    const gained = new BigNumber(bps).div(1000 / TICK_MS).toFixed(0);
    const newPoints = add(state.points, gained);
    const newTotal = add(state.totalEarned, gained);

    set({
      points: newPoints,
      totalEarned: newTotal,
      bps,
      boostActive,
      boostMultiplier: boostMul,
    });
  },

  tapScreen: () => {
    const state = get();
    // tap value = 1 + (total bps * 0.01), boosted by prestige
    const tapValue = new BigNumber(1)
      .plus(new BigNumber(state.bps).times(0.01))
      .times(state.prestigeMultiplier)
      .times(state.boostMultiplier)
      .toFixed(0);

    const newPoints = add(state.points, tapValue);
    const newTotal = add(state.totalEarned, tapValue);
    set({ points: newPoints, totalEarned: newTotal });
  },

  buyCharacter: (characterId) => {
    const state = get();
    const char = CHARACTERS.find((c) => c.id === characterId);
    if (!char) return false;

    const currentOwned = state.owned[characterId] || 0;
    const cost = costForNext(char.baseCost, char.costMultiplier, currentOwned);

    if (!gte(state.points, cost)) return false;

    const newOwned = { ...state.owned, [characterId]: currentOwned + 1 };
    const newPoints = sub(state.points, cost);
    const bps = calcBps(newOwned, state.prestigeMultiplier, state.boostMultiplier);

    set({ owned: newOwned, points: newPoints, bps });
    get().save();
    return true;
  },

  activateBoost: (durationMs = 120000, multiplier = 2) => {
    set({
      boostActive: true,
      boostUntil: Date.now() + durationMs,
      boostMultiplier: multiplier,
    });
  },

  canPrestige: () => {
    const state = get();
    // First prestige at 1T. Each subsequent prestige needs 50x more lifetime BP.
    // After 10 prestiges: 1T * 50^10 ≈ 10^28 — the grind never disappears.
    const threshold = new BigNumber(1e12).times(
      new BigNumber(50).pow(state.prestigeCount)
    );
    return bn(state.totalEarned).gte(threshold);
  },

  prestige: () => {
    const state = get();
    if (!get().canPrestige()) return;

    const newPrestigeCount = state.prestigeCount + 1;
    // Additive +50% per prestige (not doubling). After 10: x6. After 20: x11.
    // Game stays challenging — ads and paid boosts remain useful forever.
    const newMultiplier = 1 + newPrestigeCount * 0.5;

    set({
      points: "0",
      totalEarned: "0",
      owned: initialOwnedState(),
      bps: "0",
      prestigeCount: newPrestigeCount,
      prestigeMultiplier: newMultiplier,
      boostActive: false,
      boostMultiplier: 1,
    });
    get().save();
  },

  startTicking: () => {
    const existing = get().tickInterval;
    if (existing) clearInterval(existing);
    const interval = setInterval(() => get().tick(), TICK_MS);
    set({ tickInterval: interval });
  },

  stopTicking: () => {
    const interval = get().tickInterval;
    if (interval) clearInterval(interval);
    set({ tickInterval: null });
  },

  save: async () => {
    const state = get();
    const saveData = {
      points: state.points,
      totalEarned: state.totalEarned,
      owned: state.owned,
      prestigeCount: state.prestigeCount,
      prestigeMultiplier: state.prestigeMultiplier,
      username: state.username,
      hasRemovedAds: state.hasRemovedAds,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      set({
        points: data.points || "0",
        totalEarned: data.totalEarned || "0",
        owned: data.owned || initialOwnedState(),
        prestigeCount: data.prestigeCount || 0,
        prestigeMultiplier: data.prestigeMultiplier || 1,
        username: data.username || "",
        hasRemovedAds: data.hasRemovedAds || false,
      });
    } catch (e) {
      console.warn("Failed to load save:", e);
    }
  },
}));
