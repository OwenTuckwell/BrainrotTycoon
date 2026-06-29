import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// Monetisation: in-app purchases.
//
// Currently SIMULATED so the game runs in Expo Go with no native build. To go
// live with real purchases:
//   1. `npx expo install react-native-iap`  (or RevenueCat's react-native-purchases)
//   2. Create the products below in App Store Connect / Play Console with
//      matching product IDs
//   3. Build a dev client — IAP does NOT work in Expo Go
//   4. Set SIMULATED = false and fill in the real bodies.
//
// Note: expo-in-app-purchases was deprecated/removed — prefer react-native-iap.
// ---------------------------------------------------------------------------

const SIMULATED = true;

// TODO(iap): these IDs must match the products configured in the stores.
export const PRODUCTS = {
  starterPack: { id: "starter_pack", price: "£0.99", label: "Starter Pack — permanent 2x" },
  removeAds: { id: "remove_ads", price: "£1.99", label: "Remove Ads" },
};

export async function initIap() {
  if (SIMULATED) return;
  // const { initConnection } = require("react-native-iap");
  // await initConnection();
}

/**
 * Attempt to purchase a product. Resolves `true` if the purchase completed and
 * the entitlement should be granted, `false` if cancelled or failed. Never
 * rejects — callers can simply `if (await purchaseProduct(p)) grant()`.
 */
export function purchaseProduct(product) {
  if (SIMULATED) {
    return new Promise((resolve) => {
      Alert.alert(product.label, `Simulated purchase: ${product.price}`, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Buy (simulated)", onPress: () => resolve(true) },
      ]);
    });
  }

  // Real implementation outline (uncomment once the SDK is installed):
  //
  // const { requestPurchase, finishTransaction } = require("react-native-iap");
  // return requestPurchase({ sku: product.id })
  //   .then(async (purchase) => {
  //     await finishTransaction({ purchase, isConsumable: false });
  //     return true;
  //   })
  //   .catch(() => false);
  return Promise.resolve(false);
}
