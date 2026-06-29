import React from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { CHARACTERS } from "../data/characters";
import { fmt, costForNext, gte } from "../utils/bigNum";
import { COLORS } from "../theme";

function CharacterCard({ character }) {
  const { points, owned, buyCharacter } = useGameStore();
  const count = owned[character.id] || 0;
  const cost = costForNext(character.baseCost, character.costMultiplier, count);
  const canAfford = gte(points, cost);
  const locked = count === 0 && !canAfford;

  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>{locked ? "🔒" : character.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.charName, locked && styles.lockedText]}>
            {locked ? "???" : character.name}
          </Text>
          <Text style={styles.charDesc}>
            {locked ? "Keep earning to unlock..." : character.description}
          </Text>
          {count > 0 && (
            <Text style={styles.bpsLabel}>
              +{fmt(character.baseBps)} BP/s each · {count} owned
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
        onPress={() => buyCharacter(character.id)}
        disabled={!canAfford}
      >
        <Text style={styles.buyBtnText}>{fmt(cost)}</Text>
        <Text style={styles.buyBtnSub}>BP</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛒 Character Shop</Text>
      <FlatList
        data={CHARACTERS}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => <CharacterCard character={item} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.accent,
    padding: 16,
    paddingBottom: 4,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLocked: { opacity: 0.55 },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  emoji: { fontSize: 36, marginRight: 12 },
  cardInfo: { flex: 1 },
  charName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  lockedText: { color: COLORS.muted },
  charDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  bpsLabel: { fontSize: 11, color: COLORS.accent, marginTop: 4 },
  buyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 70,
  },
  buyBtnDisabled: { backgroundColor: COLORS.border },
  buyBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  buyBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
});
