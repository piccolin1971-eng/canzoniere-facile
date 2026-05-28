import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getSection } from "@/src/sections";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import type { Song } from "@/src/types";
import { SongMarkers } from "./SongMarkers";

type Props = {
  song: Song;
  onPress: () => void;
  showMarkers?: boolean;
  showSetlistAction?: boolean;
};

export function SongCard({
  song,
  onPress,
  showMarkers = true,
  showSetlistAction = true,
}: Props) {
  const { colors } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const section = getSection(song.sectionId);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.badge, { backgroundColor: (section?.color ?? colors.primary) + "33" }]}>
        <Text style={[styles.badgeText, { color: section?.color ?? colors.chord }]}>
          {song.code}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {song.title}
          </Text>
          {showMarkers && (
            <SongMarkers songId={song.id} size={20} showSetlistAction={showSetlistAction} />
          )}
        </View>
        {song.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {song.subtitle}
          </Text>
        ) : null}
        <Text style={styles.section}>{section?.name ?? song.sectionId}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    badge: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { fontSize: 15, fontWeight: "800" },
    body: { flex: 1 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    title: { color: colors.text, fontSize: 18, fontWeight: "700", flex: 1 },
    subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    section: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  });
}
