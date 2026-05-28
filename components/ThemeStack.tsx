import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HomeHeaderButton } from "@/components/HomeHeaderButton";
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
          headerRight: () => <HomeHeaderButton />,
          headerRightContainerStyle: { paddingRight: 12 },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sezioni" options={{ title: "Per sezione" }} />
        <Stack.Screen name="sezione/[id]" options={{ title: "" }} />
        <Stack.Screen name="alfabeto" options={{ title: "A – Z" }} />
        <Stack.Screen name="temi" options={{ title: "Per tematica" }} />
        <Stack.Screen name="tema/[slug]" options={{ title: "" }} />
        <Stack.Screen name="cerca" options={{ title: "Cerca" }} />
        <Stack.Screen name="preferiti" options={{ title: "Preferiti" }} />
        <Stack.Screen name="aggiungi-canto" options={{ title: "Aggiungi canto" }} />
        <Stack.Screen name="scalette" options={{ headerShown: false }} />
        <Stack.Screen name="canto/[id]" options={{ title: "" }} />
        <Stack.Screen name="canto/modifica/[id]" options={{ title: "Modifica canto" }} />
        <Stack.Screen name="impostazioni" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
