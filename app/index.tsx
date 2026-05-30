import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeTile } from "@/components/HomeTile";
import { SongCard } from "@/components/SongCard";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { recentIds, colors } = useSettings();
  const { getResolvedSong } = useSongEdits();
  const { totalCount, songsAlphabeticalList } = useSongCatalog();
  const recentSongs = recentIds.map((id) => getResolvedSong(id)).filter(Boolean);
  const featuredSongs = useMemo(() => songsAlphabeticalList.slice(0, 4), [songsAlphabeticalList]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <MaterialCommunityIcons
              name="guitar-acoustic"
              size={44}
              color={colors.primary}
              style={styles.heroGuitar}
            />
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Canzoniere Facile</Text>
              <Text style={styles.heroSub}>{totalCount} canti</Text>
            </View>
            <MaterialCommunityIcons
              name="guitar-electric"
              size={44}
              color={colors.accent}
              style={styles.heroGuitar}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <HomeTile
            title="Cerca"
            subtitle="Titolo o codice"
            icon="search"
            color={colors.accent}
            onPress={() => router.push("/cerca")}
          />
          <HomeTile
            title="Sezioni"
            subtitle="Atto penitenziale, Gloria…"
            icon="albums"
            color={colors.primary}
            onPress={() => router.push("/sezioni")}
          />
          <HomeTile
            title="A – Z"
            subtitle="Ordine alfabetico"
            icon="text"
            color={colors.chordAlt}
            onPress={() => router.push("/alfabeto")}
          />
          <HomeTile
            title="Tematiche"
            subtitle="Kyrie, Gloria, Penitenza"
            icon="pricetags"
            color="#FF8A65"
            onPress={() => router.push("/temi")}
          />
          <HomeTile
            title="Preferiti"
            subtitle="Canti a portata di mano"
            icon="star"
            color="#FFC107"
            onPress={() => router.push("/preferiti")}
          />
          <HomeTile
            title="Scalette"
            subtitle="Domenica, feriale…"
            icon="list"
            color={colors.primary}
            onPress={() => router.push("/scalette")}
          />
          <HomeTile
            title="Aggiungi canto"
            subtitle="Incolla o importa file"
            icon="add-circle-outline"
            color={colors.success}
            onPress={() => router.push("/aggiungi-canto")}
          />
          <HomeTile
            title="Impostazioni"
            subtitle="Tema, colori, testo"
            icon="settings-outline"
            color={colors.success}
            onPress={() => router.push("/impostazioni")}
          />
        </View>

        {recentSongs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recenti</Text>
            {recentSongs.map((song) =>
              song ? (
                <SongCard
                  key={song.id}
                  song={song}
                  onPress={() => router.push(`/canto/${song.id}`)}
                />
              ) : null,
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In evidenza</Text>
          {featuredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => router.push(`/canto/${song.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    hero: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      width: "100%",
    },
    heroGuitar: { flexShrink: 0 },
    heroTextCol: { flex: 1, alignItems: "center", minWidth: 0 },
    heroTitle: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: -0.5,
      textAlign: "center",
    },
    heroSub: { color: colors.textMuted, fontSize: 15, marginTop: 6, textAlign: "center" },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: spacing.sm,
      columnGap: spacing.sm,
      marginBottom: spacing.lg,
    },
    section: { marginTop: spacing.sm },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: spacing.md,
    },
  });
}
