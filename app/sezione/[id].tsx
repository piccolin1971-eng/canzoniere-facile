import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SongCard } from "@/components/SongCard";
import { getSection } from "@/src/sections";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function SezioneScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const { songsBySection } = useSongCatalog();
  const section = getSection(id ?? "");
  const songs = songsBySection(id ?? "");
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: section?.name ?? "Sezione" });
  }, [navigation, section?.name]);

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
