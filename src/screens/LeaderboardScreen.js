import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { fetchLeaderboard, submitScore } from "../utils/leaderboard";
import { fmt } from "../utils/bigNum";
import { COLORS } from "../theme";

export default function LeaderboardScreen() {
  const { totalEarned, username, setUsername } = useGameStore();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState(username);

  useEffect(() => {
    loadBoard();
  }, []);

  async function loadBoard() {
    setLoading(true);
    const data = await fetchLeaderboard();
    setEntries(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!nameInput.trim()) {
      Alert.alert("Enter a username first!");
      return;
    }
    setUsername(nameInput.trim());
    await submitScore(nameInput.trim(), totalEarned);
    await loadBoard();
    Alert.alert("✅ Score submitted!");
  }

  function renderRow({ item, index }) {
    const medals = ["🥇", "🥈", "🥉"];
    const rank = medals[index] || `#${index + 1}`;
    return (
      <View style={styles.row}>
        <Text style={styles.rank}>{rank}</Text>
        <Text style={styles.rowName}>{item.username || "Anonymous"}</Text>
        <Text style={styles.rowScore}>{fmt(item.score)} BP</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏆 Leaderboard</Text>

      {/* Submit your score */}
      <View style={styles.submitBox}>
        <Text style={styles.submitLabel}>Your lifetime BP: {fmt(totalEarned)}</Text>
        <View style={styles.submitRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter username..."
            placeholderTextColor={COLORS.muted}
            value={nameInput}
            onChangeText={setNameInput}
            maxLength={20}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No scores yet — be the first!</Text>
          }
          onRefresh={loadBoard}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.gold,
    padding: 16,
    paddingBottom: 8,
  },
  submitBox: {
    backgroundColor: COLORS.card,
    margin: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitLabel: { color: COLORS.muted, fontSize: 13, marginBottom: 10 },
  submitRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rank: { fontSize: 18, width: 40 },
  rowName: { flex: 1, color: COLORS.text, fontWeight: "700", fontSize: 14 },
  rowScore: { color: COLORS.accent, fontWeight: "800", fontSize: 14 },
  empty: { textAlign: "center", color: COLORS.muted, marginTop: 40, fontSize: 15 },
});
