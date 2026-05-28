import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeTile } from "@/components/HomeTile";
import { SongCard } from "@/components/SongCard";
import { getSong, SONGS } from "@/src/songs";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { recentIds, colors } = useSettings();
  const recentSongs = recentIds.map((id) => getSong(id)).filter(Boolean);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🎸</Text>
          <Text style={styles.heroTitle}>Canzoniere Facile</Text>
          <Text style={styles.heroSub}>
            Azione Cattolica Ticinese · {SONGS.length} canti
          </Text>
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
          {SONGS.slice(0, 4).map((song) => (
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
    heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
    heroTitle: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    heroSub: { color: colors.textMuted, fontSize: 15, marginTop: 6 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: spacing.sm,
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
