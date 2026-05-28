import { Stack } from "expo-router";
import { HomeHeaderButton } from "@/components/HomeHeaderButton";
import { useSettings } from "@/src/SettingsContext";

export default function ScaletteLayout() {
  const { colors } = useSettings();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { flex: 1, backgroundColor: colors.bg },
        animation: "slide_from_right",
        headerRight: () => <HomeHeaderButton />,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Scalette" }} />
      <Stack.Screen name="[id]" options={{ title: "Scaletta" }} />
    </Stack>
  );
}
