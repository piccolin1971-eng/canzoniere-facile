import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { SongContent } from "@/components/SongContent";
import { SongMarkers } from "@/components/SongMarkers";
import { StackHeaderRight } from "@/components/StackHeaderRight";
import { getSection } from "@/src/sections";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useLibrary } from "@/src/LibraryContext";
import { FONT_MAX, FONT_MIN, useSettings } from "@/src/SettingsContext";
import { formatTransposeLabel } from "@/src/transpose";
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
  const { getResolvedSong, isEdited, resetEdit } = useSongEdits();
  const { getSavedTranspose, saveTranspose, resetTranspose, purgeSong } = useLibrary();
  const { songsAlphabetical, deleteSong } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const song = getResolvedSong(id ?? "");
  const savedTranspose = song ? getSavedTranspose(song.id) : 0;
  const [previewTranspose, setPreviewTranspose] = useState(savedTranspose);
  const allSorted = useMemo(() => songsAlphabetical(), [songsAlphabetical]);
  const section = song ? getSection(song.sectionId) : undefined;
  const idx = allSorted.findIndex((s) => s.id === id);
  const prev = idx > 0 ? allSorted[idx - 1] : null;
  const next = idx >= 0 && idx < allSorted.length - 1 ? allSorted[idx + 1] : null;
  const recentMarked = useRef<string | null>(null);

  useEffect(() => {
    if (song) setPreviewTranspose(getSavedTranspose(song.id));
  }, [song?.id]);

  const onDeleteSong = () => {
    if (!song) return;
    Alert.alert(
      "Elimina canto",
      `Rimuovere "${song.title}" dal canzoniere? Non comparirà più nelle liste.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteSong(song.id);
            await purgeSong(song.id);
            await resetEdit(song.id);
            router.back();
          },
        },
      ],
    );
  };

  useLayoutEffect(() => {
    if (!song) return;
    navigation.setOptions({
      title: song.title,
      headerRight: () => (
        <StackHeaderRight>
          <Pressable
            onPress={onDeleteSong}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            accessibilityLabel="Elimina canto"
          >
            <Ionicons name="trash-outline" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/canto/modifica/${song.id}`)}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            accessibilityLabel="Modifica canto"
          >
            <Ionicons name="create-outline" size={24} color={colors.headerTint} />
          </Pressable>
        </StackHeaderRight>
      ),
    });
  }, [navigation, song?.id, song?.title, colors.headerTint, colors.accent, router]);

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
            <View style={styles.metaLeft}>
              <View style={[styles.badge, { backgroundColor: (section?.color ?? colors.primary) + "33" }]}>
                <Text style={[styles.badgeText, { color: section?.color ?? colors.chord }]}>
                  {song.code}
                </Text>
              </View>
              {isEdited(song.id) ? (
                <Text style={styles.editedTag}>modificato</Text>
              ) : null}
              {song.isCustom ? (
                <Text style={styles.customTag}>mio</Text>
              ) : null}
            </View>
            <FontHeaderButtons
              styles={styles}
              fontSize={fontSize}
              onDecrease={() => setFontSize(fontSize - 2)}
              onIncrease={() => setFontSize(fontSize + 2)}
            />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.songTitle}>{song.title}</Text>
            <SongMarkers songId={song.id} showSetlistAction />
          </View>
          <Text style={styles.section}>{section?.name}</Text>
          {song.subtitle ? <Text style={styles.subtitle}>{song.subtitle}</Text> : null}
        </View>

        <View style={styles.transposeBar}>
          <Text style={styles.transposeLabel}>Tonalità</Text>
          <Pressable
            style={styles.transposeBtn}
            onPress={() => setPreviewTranspose((v) => Math.max(-11, v - 1))}
          >
            <Ionicons name="remove" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.transposeValue}>{formatTransposeLabel(previewTranspose)}</Text>
          <Pressable
            style={styles.transposeBtn}
            onPress={() => setPreviewTranspose((v) => Math.min(11, v + 1))}
          >
            <Ionicons name="add" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            style={[
              styles.transposeSave,
              previewTranspose === savedTranspose && styles.transposeSaveDisabled,
            ]}
            disabled={previewTranspose === savedTranspose}
            onPress={() => song && saveTranspose(song.id, previewTranspose)}
          >
            <Text style={styles.transposeSaveText}>Salva</Text>
          </Pressable>
          {(previewTranspose !== 0 || savedTranspose !== 0) && (
            <Pressable
              style={styles.transposeReset}
              onPress={async () => {
                setPreviewTranspose(0);
                if (song) await resetTranspose(song.id);
              }}
            >
              <Text style={styles.transposeResetText}>Ripristina</Text>
            </Pressable>
          )}
        </View>
        <SongContent song={song} fontSize={fontSize} transposeSemis={previewTranspose} />
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
    metaLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
    editedTag: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      fontStyle: "italic",
    },
    customTag: {
      color: "#CE93D8",
      fontSize: 12,
      fontWeight: "700",
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      marginBottom: 8,
    },
    badgeText: { fontWeight: "800", fontSize: 16 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginTop: 4,
    },
    songTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    section: { color: colors.textMuted, fontSize: 14 },
    subtitle: { color: colors.chordAlt, fontSize: 14, marginTop: 4, fontStyle: "italic" },
    transposeBar: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    transposeLabel: { color: colors.textMuted, fontWeight: "700", marginRight: 4 },
    transposeBtn: {
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      padding: 8,
    },
    transposeValue: {
      color: colors.chord,
      fontWeight: "800",
      fontSize: 16,
      minWidth: 72,
      textAlign: "center",
    },
    transposeSave: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 4,
    },
    transposeSaveDisabled: { opacity: 0.45 },
    transposeSaveText: { color: "#FFF", fontWeight: "800" },
    transposeReset: { paddingHorizontal: 8, paddingVertical: 8 },
    transposeResetText: { color: colors.accent, fontWeight: "700" },
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
