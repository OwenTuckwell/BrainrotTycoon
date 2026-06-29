import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import GameScreen from "./src/screens/GameScreen";
import ShopScreen from "./src/screens/ShopScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import PrestigeScreen from "./src/screens/PrestigeScreen";
import { useGameStore } from "./src/store/gameStore";
import { COLORS } from "./src/theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Tap: "🧠",
  Shop: "🛒",
  Leaderboard: "🏆",
  Prestige: "👑",
};

export default function App() {
  const { load, startTicking, stopTicking, save } = useGameStore();

  useEffect(() => {
    load().then(() => startTicking());

    const saveInterval = setInterval(() => save(), 30000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        startTicking();
      } else {
        stopTicking();
        save();
      }
    });

    return () => {
      stopTicking();
      clearInterval(saveInterval);
      sub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            background: COLORS.bg,
            card: COLORS.card,
            text: COLORS.text,
            border: COLORS.border,
            notification: COLORS.accent,
            primary: COLORS.accent,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: () => (
              <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>
            ),
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
            },
            headerStyle: { backgroundColor: COLORS.card },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: "900" },
          })}
        >
          <Tab.Screen name="Tap" component={GameScreen} options={{ title: "🧠 Brainrot Tycoon" }} />
          <Tab.Screen name="Shop" component={ShopScreen} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Tab.Screen name="Prestige" component={PrestigeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
