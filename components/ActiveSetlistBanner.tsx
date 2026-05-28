import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLibrary } from "@/src/LibraryContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

type Props = {
  onChangePress?: () => void;
};

export function ActiveSetlistBanner({ onChangePress }: Props) {
  const { colors } = useSettings();
  const { getActiveSetlist, activeSetlistId } = useLibrary();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const active = getActiveSetlist();

  if (!active) {
    return (
      <Pressable
        style={styles.bannerMuted}
        onPress={() => (onChangePress ? onChangePress() : router.push("/scalette"))}
      >
        <Text style={styles.bannerTextMuted}>Nessuna scaletta attiva — scegli una scaletta</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.banner}
      onPress={() => (onChangePress ? onChangePress() : router.push(`/scalette/${activeSetlistId}`))}
    >
      <Text style={styles.label}>Scaletta attiva</Text>
      <Text style={styles.name}>{active.name}</Text>
      <Text style={styles.count}>{active.songIds.length} canti</Text>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.primary + "22",
      borderColor: colors.primary + "55",
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    bannerMuted: {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    label: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    name: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
    count: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    bannerTextMuted: { color: colors.textMuted, fontSize: 14 },
  });
}
