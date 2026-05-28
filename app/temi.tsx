import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { getThemes } from "@/src/songs";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

const THEME_COLORS: Record<string, string> = {
  Kyrie: "#7C4DFF",
  Gloria: "#00BFA5",
  Alleluia: "#FF7043",
  "Agnello di Dio": "#EF5350",
  Maria: "#5C6BC0",
  Santo: "#FFA726",
  Penitenza: "#FF6B4A",
  Natale: "#29B6F6",
  Pasqua: "#8D6E63",
  Liturgia: "#42A5F5",
};

export default function TemiScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const themes = getThemes();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {themes.map((theme) => (
        <Pressable
          key={theme}
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
          onPress={() => router.push(`/tema/${encodeURIComponent(theme.toLowerCase())}`)}
        >
          <Text style={[styles.chipText, { color: THEME_COLORS[theme] ?? colors.chord }]}>
            {theme}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    scroll: { padding: spacing.md, gap: spacing.sm },
    chip: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: { fontSize: 20, fontWeight: "800" },
  });
}
