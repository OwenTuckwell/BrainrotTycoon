import React, { useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, Alert, Modal,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { fmt, bn } from "../utils/bigNum";
import { showRewardedAd } from "../ads";
import { COLORS } from "../theme";

function fmtDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

export default function GameScreen() {
  const {
    points, bps, tapScreen, prestigeCount, prestigeMultiplier,
    canPrestige, prestige, boostActive, boostUntil, activateBoost, hasRemovedAds,
    pendingOffline, offlineSeconds, collectOffline, doubleOffline,
  } = useGameStore();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handleTap() {
    tapScreen();
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  function handlePrestige() {
    Alert.alert(
      "Go Full Sigma? 👑",
      `Reset everything but earn a permanent ${(1 + (prestigeCount + 1) * 0.5).toFixed(1)}x multiplier on all earnings!`,
      [
        { text: "No way", style: "cancel" },
        { text: "SIGMA MODE", onPress: prestige, style: "destructive" },
      ]
    );
  }

  async function handleDoubleOffline() {
    if (await showRewardedAd()) doubleOffline();
  }

  async function handleWatchAd() {
    if (await showRewardedAd()) activateBoost(120000, 2);
  }

  const boostSecsLeft = boostActive ? Math.max(0, Math.ceil((boostUntil - Date.now()) / 1000)) : 0;
  const prestigeReady = canPrestige();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome-back / offline earnings */}
      <Modal
        visible={!!pendingOffline}
        transparent
        animationType="fade"
        onRequestClose={collectOffline}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>😴</Text>
            <Text style={styles.modalTitle}>Welcome Back, Sigma!</Text>
            <Text style={styles.modalSub}>
              You were away for {fmtDuration(offlineSeconds)} and your brainrot kept cooking:
            </Text>
            <Text style={styles.modalAmount}>+{fmt(pendingOffline || "0")} BP</Text>
            {!hasRemovedAds && (
              <TouchableOpacity style={styles.modalDoubleBtn} onPress={handleDoubleOffline}>
                <Text style={styles.modalDoubleText}>📺 Watch Ad → Double It (2x)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalCollectBtn} onPress={collectOffline}>
              <Text style={styles.modalCollectText}>Collect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header stats */}
      <View style={styles.statsBox}>
        <Text style={styles.pointsText}>{fmt(points)} BP</Text>
        <Text style={styles.bpsText}>{fmt(bps)} BP/sec</Text>
        {prestigeCount > 0 && (
          <Text style={styles.prestigeTag}>
            👑 x{prestigeMultiplier} Sigma Multiplier
          </Text>
        )}
      </View>

      {/* Boost banner */}
      {boostActive && (
        <View style={styles.boostBanner}>
          <Text style={styles.boostText}>🔥 2x BOOST — {boostSecsLeft}s left!</Text>
        </View>
      )}

      {/* Main tap button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={styles.tapButton} onPress={handleTap} activeOpacity={0.85}>
          <Text style={styles.tapEmoji}>🧠</Text>
          <Text style={styles.tapLabel}>TAP FOR BRAINROT</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Watch ad for boost */}
      {!boostActive && (
        <TouchableOpacity style={styles.adButton} onPress={handleWatchAd}>
          <Text style={styles.adButtonText}>📺 Watch Ad → 2x for 2 mins</Text>
        </TouchableOpacity>
      )}

      {/* Paid boost */}
      <TouchableOpacity
        style={styles.paidButton}
        onPress={() => Alert.alert("💰 Starter Pack", "£0.99 for permanent 2x boost!\n(IAP coming soon)")}
      >
        <Text style={styles.paidButtonText}>⚡ Starter Pack — £0.99</Text>
      </TouchableOpacity>

      {/* Prestige */}
      {prestigeReady && (
        <TouchableOpacity style={styles.prestigeButton} onPress={handlePrestige}>
          <Text style={styles.prestigeButtonText}>
            👑 GO FULL SIGMA (x{(1 + (prestigeCount + 1) * 0.5).toFixed(1)} forever)
          </Text>
        </TouchableOpacity>
      )}

      {/* Remove ads */}
      {!hasRemovedAds && (
        <TouchableOpacity
          style={styles.removeAdsButton}
          onPress={() => Alert.alert("🚫 Remove Ads", "£1.99 to remove all ads!\n(IAP coming soon)")}
        >
          <Text style={styles.removeAdsText}>🚫 Remove Ads — £1.99</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { alignItems: "center", padding: 20, paddingBottom: 40 },
  statsBox: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pointsText: { fontSize: 36, fontWeight: "900", color: COLORS.accent, letterSpacing: 1 },
  bpsText: { fontSize: 16, color: COLORS.muted, marginTop: 4 },
  prestigeTag: { fontSize: 13, color: COLORS.gold, marginTop: 6 },
  boostBanner: {
    backgroundColor: "#ff4500",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  boostText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  tapButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  tapEmoji: { fontSize: 72 },
  tapLabel: { color: "#fff", fontWeight: "900", fontSize: 13, marginTop: 8, letterSpacing: 1 },
  adButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  adButtonText: { color: COLORS.accent, fontWeight: "700", fontSize: 14 },
  paidButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  paidButtonText: { color: "#000", fontWeight: "900", fontSize: 14 },
  prestigeButton: {
    backgroundColor: "#8b00ff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  prestigeButtonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  removeAdsButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.muted,
    marginTop: 10,
  },
  removeAdsText: { color: COLORS.muted, fontWeight: "600", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  modalEmoji: { fontSize: 48 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginTop: 8 },
  modalSub: { fontSize: 13, color: COLORS.muted, textAlign: "center", marginTop: 8, lineHeight: 18 },
  modalAmount: { fontSize: 30, fontWeight: "900", color: COLORS.gold, marginVertical: 16 },
  modalDoubleBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalDoubleText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  modalCollectBtn: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCollectText: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
});
