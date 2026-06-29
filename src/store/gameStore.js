import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BigNumber from "bignumber.js";
import { CHARACTERS } from "../data/characters";
import { add, sub, mul, costForNext, gte, bn } from "../utils/bigNum";

const SAVE_KEY = "brainrot_save_v1";
const TICK_MS = 100; // update every 100ms
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000; // earnings while away cap at 8h
const MIN_OFFLINE_SEC = 60; // don't bug the player for a quick app switch

function initialOwnedState() {
  const owned = {};
  CHARACTERS.forEach((c) => { owned[c.id] = 0; });
  return owned;
}

function calcBps(owned, prestigeMultiplier, boostMultiplier, purchaseMultiplier = 1) {
  let total = new BigNumber(0);
  CHARACTERS.forEach((c) => {
    const count = owned[c.id] || 0;
    if (count > 0) {
      total = total.plus(new BigNumber(c.baseBps).times(count));
    }
  });
  return total
    .times(prestigeMultiplier)
    .times(boostMultiplier)
    .times(purchaseMultiplier)
    .toFixed(2);
}

// Earnings accrued while the player was away. Boost is excluded (it expires),
// time is capped, and short gaps are ignored. Returns null if nothing to grant.
function computeOffline(owned, prestigeMultiplier, purchaseMultiplier, elapsedMsRaw) {
  const elapsedMs = Math.min(Math.max(0, elapsedMsRaw), OFFLINE_CAP_MS);
  const secs = Math.floor(elapsedMs / 1000);
  if (secs < MIN_OFFLINE_SEC) return null;
  const offlineBps = calcBps(owned, prestigeMultiplier, 1, purchaseMultiplier);
  const earned = new BigNumber(offlineBps).times(secs).toFixed(0);
  if (!new BigNumber(earned).gt(0)) return null;
  return { earned, secs };
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
  purchaseMultiplier: 1,     // permanent paid multiplier (Starter Pack = 2x); survives prestige
  pendingOffline: null,      // BP earned while away, awaiting "welcome back" collect
  offlineSeconds: 0,         // how long the player was away (capped)
  backgroundedAt: 0,         // timestamp ms when app went to background

  // --- actions ---

  setUsername: (name) => set({ username: name }),

  removeAds: () => { set({ hasRemovedAds: true }); get().save(); },

  // Starter Pack IAP: permanent 2x on all earnings. Idempotent — re-buying
  // (or a restore) won't stack past 2x.
  buyStarterPack: () => {
    set({ purchaseMultiplier: 2 });
    const state = get();
    set({ bps: calcBps(state.owned, state.prestigeMultiplier, state.boostMultiplier, 2) });
    get().save();
  },

  tick: () => {
    const state = get();
    const now = Date.now();

    let boostMul = state.boostMultiplier;
    let boostActive = state.boostActive;
    if (boostActive && now > state.boostUntil) {
      boostActive = false;
      boostMul = 1;
    }

    const bps = calcBps(state.owned, state.prestigeMultiplier, boostMul, state.purchaseMultiplier);
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
      .times(state.purchaseMultiplier)
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
    const bps = calcBps(newOwned, state.prestigeMultiplier, state.boostMultiplier, state.purchaseMultiplier);

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

  // Dismiss the welcome-back modal (offline BP was already credited on load).
  collectOffline: () => set({ pendingOffline: null, offlineSeconds: 0 }),

  // Watch-ad reward: grant the offline haul a second time, for 2x total.
  doubleOffline: () => {
    const state = get();
    if (!state.pendingOffline) return;
    set({
      points: add(state.points, state.pendingOffline),
      totalEarned: add(state.totalEarned, state.pendingOffline),
      pendingOffline: null,
      offlineSeconds: 0,
    });
    get().save();
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

  // App sent to background: stop the loop, persist, and stamp the time away.
  handleBackground: () => {
    get().stopTicking();
    get().save();
    set({ backgroundedAt: Date.now() });
  },

  // App resumed: credit time spent in the background, then resume ticking.
  handleForeground: () => {
    const state = get();
    if (state.backgroundedAt) {
      const offline = computeOffline(
        state.owned,
        state.prestigeMultiplier,
        state.purchaseMultiplier,
        Date.now() - state.backgroundedAt
      );
      if (offline) {
        set({
          points: add(state.points, offline.earned),
          totalEarned: add(state.totalEarned, offline.earned),
          pendingOffline: offline.earned,
          offlineSeconds: offline.secs,
        });
      }
      set({ backgroundedAt: 0 });
    }
    get().startTicking();
  },

  save: async () => {
    const state = get();
    const saveData = {
      points: state.points,
      totalEarned: state.totalEarned,
      owned: state.owned,
      prestigeCount: state.prestigeCount,
      prestigeMultiplier: state.prestigeMultiplier,
      purchaseMultiplier: state.purchaseMultiplier,
      username: state.username,
      hasRemovedAds: state.hasRemovedAds,
      lastSaved: Date.now(),
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      const owned = data.owned || initialOwnedState();
      const prestigeMultiplier = data.prestigeMultiplier || 1;
      const purchaseMultiplier = data.purchaseMultiplier || 1;

      // Earn while away since the last save.
      const offline = data.lastSaved
        ? computeOffline(owned, prestigeMultiplier, purchaseMultiplier, Date.now() - data.lastSaved)
        : null;
      const pendingOffline = offline ? offline.earned : null;
      const offlineSeconds = offline ? offline.secs : 0;

      const basePoints = data.points || "0";
      const baseTotal = data.totalEarned || "0";

      set({
        points: pendingOffline ? add(basePoints, pendingOffline) : basePoints,
        totalEarned: pendingOffline ? add(baseTotal, pendingOffline) : baseTotal,
        owned,
        prestigeCount: data.prestigeCount || 0,
        prestigeMultiplier,
        purchaseMultiplier,
        username: data.username || "",
        hasRemovedAds: data.hasRemovedAds || false,
        pendingOffline,
        offlineSeconds,
      });
    } catch (e) {
      console.warn("Failed to load save:", e);
    }
  },
}));
