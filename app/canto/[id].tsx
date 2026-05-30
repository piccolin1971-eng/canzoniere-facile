import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SongContent } from "@/components/SongContent";
import { SongMarkers } from "@/components/SongMarkers";
import { StackHeaderRight } from "@/components/StackHeaderRight";
import { getSection } from "@/src/sections";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useLibrary } from "@/src/LibraryContext";
import {
  AUTO_SCROLL_SPEED_MAX,
  AUTO_SCROLL_SPEED_MIN,
  FONT_MAX,
  FONT_MIN,
  useSettings,
} from "@/src/SettingsContext";
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
  const {
    fontSize,
    setFontSize,
    pushRecent,
    colors,
    autoScrollEnabled,
    autoScrollDelaySec,
    autoScrollPxPerSec,
  } = useSettings();
  const { getResolvedSong, isEdited, resetEdit } = useSongEdits();
  const { getSavedTranspose, saveTranspose, resetTranspose, purgeSong } = useLibrary();
  const { getAlphabeticalNeighbors, deleteSong } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const song = getResolvedSong(id ?? "");
  const savedTranspose = song ? getSavedTranspose(song.id) : 0;
  const [previewTranspose, setPreviewTranspose] = useState(savedTranspose);
  const [sessionAutoOn, setSessionAutoOn] = useState(autoScrollEnabled);
  const [sessionSpeed, setSessionSpeed] = useState(autoScrollPxPerSec);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const contentHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrolledRef = useRef(false);
  const { prev, next } = useMemo(
    () => getAlphabeticalNeighbors(id ?? ""),
    [getAlphabeticalNeighbors, id],
  );
  const recentMarked = useRef<string | null>(null);

  useEffect(() => {
    if (song) setPreviewTranspose(getSavedTranspose(song.id));
  }, [song?.id]);

  // All'apertura di un canto (o cambio canto): default da impostazioni globali
  useEffect(() => {
    if (!song) return;
    setSessionAutoOn(autoScrollEnabled);
    setSessionSpeed(autoScrollPxPerSec);
    userScrolledRef.current = false;
    scrollYRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [song?.id, autoScrollEnabled, autoScrollPxPerSec]);

  const clearAutoScrollTimer = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearAutoScrollTimer();
    if (!sessionAutoOn || userScrolledRef.current) return;

    const pps = Math.max(1, sessionSpeed);
    const intervalMs = 50;
    const stepPx = pps * (intervalMs / 1000);

    const startDelay = setTimeout(() => {
      autoScrollTimerRef.current = setInterval(() => {
        const maxY = Math.max(0, contentHeightRef.current - containerHeightRef.current);
        const next = Math.min(maxY, scrollYRef.current + stepPx);
        if (next >= maxY) {
          clearAutoScrollTimer();
          return;
        }
        scrollYRef.current = next;
        scrollRef.current?.scrollTo({ y: next, animated: false });
      }, intervalMs);
    }, autoScrollDelaySec * 1000);

    return () => {
      clearTimeout(startDelay);
      clearAutoScrollTimer();
    };
  }, [sessionAutoOn, sessionSpeed, autoScrollDelaySec, song?.id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  };

  const onScrollBeginDrag = () => {
    userScrolledRef.current = true;
    clearAutoScrollTimer();
  };

  const onToggleSessionAuto = (v: boolean) => {
    userScrolledRef.current = false;
    setSessionAutoOn(v);
    if (v) {
      scrollYRef.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const bumpSessionSpeed = (delta: number) => {
    userScrolledRef.current = false;
    setSessionSpeed((s) =>
      Math.max(AUTO_SCROLL_SPEED_MIN, Math.min(AUTO_SCROLL_SPEED_MAX, s + delta)),
    );
  };

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

  const section = song ? getSection(song.sectionId) : undefined;
  const sectionAccent = section?.color ?? colors.primary;

  useLayoutEffect(() => {
    if (!song) return;
    navigation.setOptions({
      title: song.title,
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <View style={[styles.headerBadge, { backgroundColor: sectionAccent + "33" }]}>
            <Text style={[styles.headerBadgeText, { color: section?.color ?? colors.chord }]}>
              {song.code}
            </Text>
          </View>
          <Text
            style={[styles.headerTitle, { color: colors.headerTint }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
        </View>
      ),
      headerRight: () => (
        <StackHeaderRight
          iconGap={16}
          beforeGap={24}
          before={
            <FontHeaderButtons
              styles={styles}
              fontSize={fontSize}
              onDecrease={() => setFontSize(fontSize - 2)}
              onIncrease={() => setFontSize(fontSize + 2)}
            />
          }
        >
          <Pressable
            onPress={() => router.push("/impostazioni")}
            style={styles.headerIconBtn}
            accessibilityLabel="Impostazioni"
          >
            <Ionicons name="settings-outline" size={22} color={colors.headerTint} />
          </Pressable>
          <Pressable
            onPress={onDeleteSong}
            style={styles.headerIconBtn}
            accessibilityLabel="Elimina canto"
          >
            <Ionicons name="trash-outline" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/canto/modifica/${song.id}`)}
            style={styles.headerIconBtn}
            accessibilityLabel="Modifica canto"
          >
            <Ionicons name="create-outline" size={24} color={colors.headerTint} />
          </Pressable>
        </StackHeaderRight>
      ),
    });
  }, [
    navigation,
    song?.id,
    song?.title,
    song?.code,
    sectionAccent,
    section?.color,
    colors.chord,
    colors.headerTint,
    colors.accent,
    router,
    fontSize,
    setFontSize,
    styles,
  ]);

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
      <View style={styles.fixedToolbar}>
        {(song.subtitle || isEdited(song.id) || song.isCustom) && (
          <View style={styles.metaRow}>
            {song.subtitle ? (
              <Text style={styles.authorLine} numberOfLines={2}>
                {song.subtitle}
              </Text>
            ) : null}
            {isEdited(song.id) || song.isCustom ? (
              <View style={styles.tagRow}>
                {isEdited(song.id) ? <Text style={styles.editedTag}>modificato</Text> : null}
                {song.isCustom ? <Text style={styles.customTag}>mio</Text> : null}
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.toolbarRow}>
          <View style={styles.transposeInline}>
            <Text style={styles.transposeLabel}>Tonalità</Text>
            <Pressable
              style={styles.transposeBtn}
              onPress={() => setPreviewTranspose((v) => Math.max(-11, v - 1))}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.transposeValue}>{formatTransposeLabel(previewTranspose)}</Text>
            <Pressable
              style={styles.transposeBtn}
              onPress={() => setPreviewTranspose((v) => Math.min(11, v + 1))}
            >
              <Ionicons name="add" size={18} color={colors.text} />
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
                <Text style={styles.transposeResetText}>↺</Text>
              </Pressable>
            )}
          </View>
          <SongMarkers songId={song.id} showSetlistAction size={28} iconGap={14} />
        </View>

        <View style={styles.autoScrollRow}>
          <Text style={styles.autoScrollLabel}>Auto-scroll</Text>
          <Switch
            value={sessionAutoOn}
            onValueChange={onToggleSessionAuto}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            style={styles.autoScrollSwitch}
          />
          <Slider
            style={styles.autoScrollSlider}
            minimumValue={AUTO_SCROLL_SPEED_MIN}
            maximumValue={AUTO_SCROLL_SPEED_MAX}
            step={1}
            value={sessionSpeed}
            onValueChange={(v) => {
              userScrolledRef.current = false;
              setSessionSpeed(Math.round(v));
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Pressable
            style={styles.speedStepBtn}
            onPress={() => bumpSessionSpeed(-1)}
            disabled={sessionSpeed <= AUTO_SCROLL_SPEED_MIN}
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.speedValue}>{sessionSpeed}</Text>
          <Pressable
            style={styles.speedStepBtn}
            onPress={() => bumpSessionSpeed(1)}
            disabled={sessionSpeed >= AUTO_SCROLL_SPEED_MAX}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        scrollEventThrottle={16}
        onContentSizeChange={(_, h) => {
          contentHeightRef.current = h;
        }}
        onLayout={(e) => {
          containerHeightRef.current = e.nativeEvent.layout.height;
        }}
      >
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
    fixedToolbar: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
      maxWidth: 420,
    },
    headerBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      flexShrink: 0,
    },
    headerBadgeText: { fontWeight: "800", fontSize: 13 },
    headerTitle: {
      fontWeight: "700",
      fontSize: 24,
      flexShrink: 1,
    },
    headerIconBtn: {
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginBottom: spacing.sm,
    },
    toolbarRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
      flexWrap: "wrap",
    },
    transposeInline: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 4,
      flex: 1,
      minWidth: 0,
    },
    authorLine: {
      color: colors.chordAlt,
      fontSize: 13,
      fontWeight: "600",
      fontStyle: "italic",
    },
    tagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
    },
    editedTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "700",
      fontStyle: "italic",
    },
    customTag: {
      color: "#CE93D8",
      fontSize: 11,
      fontWeight: "700",
    },
    transposeLabel: { color: colors.textMuted, fontWeight: "700", fontSize: 12, marginRight: 2 },
    transposeBtn: {
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      padding: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transposeValue: {
      color: colors.chord,
      fontWeight: "800",
      fontSize: 14,
      minWidth: 52,
      textAlign: "center",
    },
    transposeSave: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    transposeSaveDisabled: { opacity: 0.45 },
    transposeSaveText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
    transposeReset: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transposeResetText: { color: colors.accent, fontWeight: "800", fontSize: 16 },
    autoScrollRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
    },
    autoScrollLabel: {
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 13,
      flexShrink: 0,
    },
    autoScrollSwitch: {
      transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
    },
    autoScrollSlider: { flex: 1, height: 32, minWidth: 80 },
    speedStepBtn: {
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      padding: 6,
    },
    speedValue: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 14,
      minWidth: 22,
      textAlign: "center",
    },
    fontRow: { flexDirection: "row", gap: 16, flexShrink: 0 },
    fontBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.chord,
      minWidth: 38,
      minHeight: 38,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    fontBtnDisabled: { opacity: 0.35 },
    fontBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 20 },
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
