import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SongCard } from "@/components/SongCard";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function AlfabetoScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { songsAlphabetical } = useSongCatalog();
  const songs = songsAlphabetical();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <FlatList
      data={songs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <SongCard song={item} onPress={() => router.push(`/canto/${item.id}`)} />
      )}
    />
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    list: { padding: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  });
}
