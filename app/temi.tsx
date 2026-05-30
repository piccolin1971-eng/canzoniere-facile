import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSettings } from "@/src/SettingsContext";
import { THEME_DEFINITIONS } from "@/src/themeRules";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function TemiScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { getSongsByTheme } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {THEME_DEFINITIONS.map((theme) => {
        const count = getSongsByTheme(theme.id).length;
        return (
          <Pressable
            key={theme.id}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/tema/${encodeURIComponent(theme.id)}`)}
          >
            <Text style={[styles.chipText, { color: theme.color }]}>
              {theme.label}
              <Text style={styles.count}> ({count})</Text>
            </Text>
          </Pressable>
        );
      })}
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
    count: { fontWeight: "600", color: colors.textMuted, fontSize: 18 },
  });
}
