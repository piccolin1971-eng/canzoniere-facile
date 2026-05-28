import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActiveSetlistBanner } from "@/components/ActiveSetlistBanner";
import { SongCard } from "@/components/SongCard";
import { useLibrary } from "@/src/LibraryContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function PreferitiScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { favorites } = useLibrary();
  const { getResolvedSong } = useSongEdits();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const songs = favorites.map((id) => getResolvedSong(id)).filter(Boolean);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <ActiveSetlistBanner />

      <Text style={styles.hint}>
        Tocca la stella per togliere un preferito. Usa il pulsante + per aggiungerlo alla scaletta
        attiva.
      </Text>

      {songs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            Nessun preferito. Apri un canto e tocca la stella accanto al titolo.
          </Text>
        </View>
      ) : (
        songs.map((song) =>
          song ? (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => router.push(`/canto/${song.id}`)}
            />
          ) : null,
        )
      )}
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
      marginBottom: spacing.md,
    },
    empty: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.md },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: spacing.lg,
    },
  });
}
