import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// Monetisation: rewarded ads.
//
// Currently SIMULATED so the game runs in Expo Go with no native build. To go
// live with real ads:
//   1. `npx expo install react-native-google-mobile-ads`
//   2. Add the config plugin + your AdMob app IDs to app.json
//   3. Build a dev client — ads do NOT work in Expo Go (`npx expo run:android`)
//   4. Set SIMULATED = false and fill in the real bodies below.
//
// Note: expo-ads-admob was removed in SDK 46 — do not use it. The current
// path is react-native-google-mobile-ads.
// ---------------------------------------------------------------------------

const SIMULATED = true;

// TODO(ads): replace with your AdMob unit IDs. These are Google's public test
// IDs — safe to develop against, but never ship them to production.
export const AD_UNITS = {
  rewarded: "ca-app-pub-3940256099942544/5224354917",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
};

export async function initAds() {
  if (SIMULATED) return;
  // const mobileAds = require("react-native-google-mobile-ads").default;
  // await mobileAds().initialize();
}

/**
 * Show a rewarded ad. Resolves `true` if the player earned the reward
 * (watched to completion) and the caller should grant it, `false` otherwise
 * (cancelled, failed to load, or no fill). Never rejects — callers can simply
 * `if (await showRewardedAd()) grantReward()`.
 */
export function showRewardedAd() {
  if (SIMULATED) {
    return new Promise((resolve) => {
      Alert.alert("📺 Rewarded Ad", "Imagine a 30-second ad played here!", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Skip (simulated)", onPress: () => resolve(true) },
      ]);
    });
  }

  // Real implementation outline (uncomment once the SDK is installed):
  //
  // const {
  //   RewardedAd, RewardedAdEventType, AdEventType,
  // } = require("react-native-google-mobile-ads");
  //
  // return new Promise((resolve) => {
  //   const ad = RewardedAd.createForAdRequest(AD_UNITS.rewarded);
  //   let earned = false;
  //   const subs = [
  //     ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show()),
  //     ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { earned = true; }),
  //     ad.addAdEventListener(AdEventType.CLOSED, () => { subs.forEach((s) => s()); resolve(earned); }),
  //     ad.addAdEventListener(AdEventType.ERROR, () => { subs.forEach((s) => s()); resolve(false); }),
  //   ];
  //   ad.load();
  // });
  return Promise.resolve(false);
}
