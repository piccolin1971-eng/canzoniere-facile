import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SongCard } from "@/components/SongCard";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function TemaScreen() {
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const { getSongsByTheme } = useSongCatalog();
  const label = decodeURIComponent(slug ?? "");
  const songs = getSongsByTheme(label);
  const title = label.charAt(0).toUpperCase() + label.slice(1);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

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
