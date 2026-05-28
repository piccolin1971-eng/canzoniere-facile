import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SongContent } from "@/components/SongContent";
import { getSection } from "@/src/sections";
import { getSong, SONGS } from "@/src/songs";
import { FONT_MAX, FONT_MIN, useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

function FontHeaderButtons({
  styles,
  fontSize,
  onDecrease,
  onIncrease,
}: {
  styles: ReturnType<typeof makeStyles>;
  fontSize: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.fontRow}>
      <Pressable
        onPress={onDecrease}
        disabled={fontSize <= FONT_MIN}
        style={[styles.fontBtn, fontSize <= FONT_MIN && styles.fontBtnDisabled]}
      >
        <Text style={styles.fontBtnText}>A-</Text>
      </Pressable>
      <Pressable
        onPress={onIncrease}
        disabled={fontSize >= FONT_MAX}
        style={[styles.fontBtn, fontSize >= FONT_MAX && styles.fontBtnDisabled]}
      >
        <Text style={styles.fontBtnText}>A+</Text>
      </Pressable>
    </View>
  );
}

export default function CantoScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();
  const { fontSize, setFontSize, pushRecent, colors } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const song = getSong(id ?? "");
  const section = song ? getSection(song.sectionId) : undefined;
  const idx = SONGS.findIndex((s) => s.id === id);
  const prev = idx > 0 ? SONGS[idx - 1] : null;
  const next = idx >= 0 && idx < SONGS.length - 1 ? SONGS[idx + 1] : null;
  const recentMarked = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!song) return;
    navigation.setOptions({ title: song.title });
  }, [navigation, song?.title]);

  useEffect(() => {
    if (song && recentMarked.current !== song.id) {
      recentMarked.current = song.id;
      pushRecent(song.id);
    }
  }, [song?.id, pushRecent]);

  if (!song) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Canto non trovato</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator
      >
        <View style={styles.meta}>
          <View style={styles.metaTop}>
            <View style={[styles.badge, { backgroundColor: (section?.color ?? colors.primary) + "33" }]}>
              <Text style={[styles.badgeText, { color: section?.color ?? colors.chord }]}>
                {song.code}
              </Text>
            </View>
            <FontHeaderButtons
              styles={styles}
              fontSize={fontSize}
              onDecrease={() => setFontSize(fontSize - 2)}
              onIncrease={() => setFontSize(fontSize + 2)}
            />
          </View>
          <Text style={styles.section}>{section?.name}</Text>
          {song.subtitle ? <Text style={styles.subtitle}>{song.subtitle}</Text> : null}
        </View>
        <SongContent song={song} fontSize={fontSize} />
      </ScrollView>
      <View style={styles.nav}>
        <Pressable
          style={[styles.navBtn, !prev && styles.navDisabled]}
          disabled={!prev}
          onPress={() => prev && router.replace(`/canto/${prev.id}`)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.navText} numberOfLines={1}>
            {prev?.title ?? "—"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, styles.navNext, !next && styles.navDisabled]}
          disabled={!next}
          onPress={() => next && router.replace(`/canto/${next.id}`)}
        >
          <Text style={[styles.navText, styles.navTextRight]} numberOfLines={1}>
            {next?.title ?? "—"}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollView: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
    muted: { color: colors.textMuted, fontSize: 16 },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    meta: { marginBottom: spacing.sm },
    metaTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      marginBottom: 8,
    },
    badgeText: { fontWeight: "800", fontSize: 16 },
    section: { color: colors.textMuted, fontSize: 14 },
    subtitle: { color: colors.chordAlt, fontSize: 14, marginTop: 4, fontStyle: "italic" },
    fontRow: { flexDirection: "row" },
    fontBtn: {
      backgroundColor: colors.bgElevated,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginLeft: 8,
    },
    fontBtnDisabled: { opacity: 0.4 },
    fontBtnText: { color: colors.text, fontWeight: "800", fontSize: 16 },
    nav: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgCard,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    navBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.sm,
    },
    navNext: { justifyContent: "flex-end" },
    navDisabled: { opacity: 0.35 },
    navText: { color: colors.text, fontSize: 13, flex: 1, marginHorizontal: 6 },
    navTextRight: { textAlign: "right" },
  });
}
