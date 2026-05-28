import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLibrary } from "@/src/LibraryContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function ScaletteIndexScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { setlists, activeSetlistId, setActiveSetlistId } = useLibrary();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.hint}>
        Scegli una scaletta per la messa. Quella attiva (evidenziata) riceve i canti aggiunti dai
        preferiti o dal pulsante + sul canto.
      </Text>

      {setlists.map((sl) => {
        const isActive = sl.id === activeSetlistId;
        return (
          <Pressable
            key={sl.id}
            style={({ pressed }) => [styles.card, isActive && styles.cardActive, pressed && styles.cardPressed]}
            onPress={() => {
              void setActiveSetlistId(sl.id);
              router.push(`/scalette/${sl.id}` as Href);
            }}
          >
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{sl.name}</Text>
              <Text style={styles.cardMeta}>
                {sl.songIds.length} {sl.songIds.length === 1 ? "canto" : "canti"}
              </Text>
            </View>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Attiva</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    hint: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    cardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "12",
    },
    cardPressed: { opacity: 0.88 },
    cardBody: { flex: 1 },
    cardTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
    cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    activeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    activeBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  });
}
