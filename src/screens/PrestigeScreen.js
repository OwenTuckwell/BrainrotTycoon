import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useGameStore } from "../store/gameStore";
import { fmt, bn } from "../utils/bigNum";
import BigNumber from "bignumber.js";
import { COLORS } from "../theme";

export default function PrestigeScreen() {
  const { prestigeCount, prestigeMultiplier, totalEarned } = useGameStore();

  const thresholds = Array.from({ length: 10 }, (_, i) => {
    const count = prestigeCount + i;
    const threshold = new BigNumber(1e12).times(new BigNumber(50).pow(count));
    const multiplier = (1 + (count + 1) * 0.5).toFixed(1);
    const reached = bn(totalEarned).gte(threshold);
    return { count, threshold, multiplier, reached };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>👑 Sigma Prestige</Text>
      <Text style={styles.sub}>
        Reset your game for a permanent multiplier. The higher you go, the more you earn next time.
      </Text>

      <View style={styles.currentBox}>
        <Text style={styles.currentLabel}>Current Prestige Level</Text>
        <Text style={styles.currentValue}>{prestigeCount}</Text>
        <Text style={styles.currentMul}>x{prestigeMultiplier} all earnings</Text>
      </View>

      <Text style={styles.sectionTitle}>Upcoming Prestiges</Text>
      {thresholds.map(({ count, threshold, multiplier, reached }) => (
        <View key={count} style={[styles.tierRow, reached && styles.tierReady]}>
          <View>
            <Text style={styles.tierName}>Prestige {count + 1}</Text>
            <Text style={styles.tierReq}>Requires {fmt(threshold.toFixed(0))} lifetime BP</Text>
          </View>
          <View style={styles.tierRight}>
            <Text style={styles.tierMul}>x{multiplier}</Text>
            {reached && <Text style={styles.readyTag}>READY</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 26, fontWeight: "900", color: COLORS.gold, marginBottom: 6 },
  sub: { color: COLORS.muted, fontSize: 13, marginBottom: 20, lineHeight: 18 },
  currentBox: {
    backgroundColor: "#2a1a4e",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#8b00ff",
  },
  currentLabel: { color: COLORS.muted, fontSize: 13 },
  currentValue: { fontSize: 48, fontWeight: "900", color: COLORS.gold },
  currentMul: { color: "#8b00ff", fontWeight: "700", fontSize: 15 },
  sectionTitle: { color: COLORS.text, fontWeight: "800", fontSize: 16, marginBottom: 10 },
  tierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierReady: { borderColor: COLORS.gold },
  tierName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  tierReq: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  tierRight: { alignItems: "flex-end" },
  tierMul: { color: "#8b00ff", fontWeight: "900", fontSize: 18 },
  readyTag: { color: COLORS.gold, fontWeight: "800", fontSize: 11, marginTop: 2 },
});
