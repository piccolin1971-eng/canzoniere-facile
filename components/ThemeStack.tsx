import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSettings } from "@/src/SettingsContext";

export function ThemeStack() {
  const { colors, theme } = useSettings();

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.headerTint,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sezioni" options={{ title: "Per sezione" }} />
        <Stack.Screen name="sezione/[id]" options={{ title: "" }} />
        <Stack.Screen name="alfabeto" options={{ title: "A – Z" }} />
        <Stack.Screen name="temi" options={{ title: "Per tematica" }} />
        <Stack.Screen name="tema/[slug]" options={{ title: "" }} />
        <Stack.Screen name="cerca" options={{ title: "Cerca" }} />
        <Stack.Screen name="canto/[id]" options={{ title: "" }} />
        <Stack.Screen name="impostazioni" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
