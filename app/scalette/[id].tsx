import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { SongMarkers } from "@/components/SongMarkers";
import { useLibrary } from "@/src/LibraryContext";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import type { Song } from "@/src/types";

export default function ScalettaDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const {
    setlists,
    setActiveSetlistId,
    renameSetlist,
    removeFromSetlist,
    moveInSetlist,
    reorderSetlist,
    activeSetlistId,
  } = useLibrary();
  const { getResolvedSong } = useSongEdits();
  const { getBaseSong } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const setlist = setlists.find((s) => s.id === id);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(setlist?.name ?? "");

  useLayoutEffect(() => {
    if (!setlist) return;
    navigation.setOptions({ title: setlist.name });
  }, [navigation, setlist?.name]);

  useEffect(() => {
    if (setlist && activeSetlistId !== setlist.id) {
      void setActiveSetlistId(setlist.id);
    }
  }, [setlist?.id, activeSetlistId, setActiveSetlistId]);

  const songs = useMemo(() => {
    if (!setlist) return [];
    return setlist.songIds
      .map((sid) => getResolvedSong(sid) ?? getBaseSong(sid))
      .filter((song): song is Song => Boolean(song));
  }, [setlist, getResolvedSong, getBaseSong]);

  const saveName = useCallback(async () => {
    if (!setlist) return;
    await renameSetlist(setlist.id, nameDraft);
    setEditingName(false);
    navigation.setOptions({ title: nameDraft.trim() || setlist.name });
  }, [setlist, nameDraft, renameSetlist, navigation]);

  const listHeader = useMemo(
    () => (
      <View>
        {activeSetlistId === setlist?.id && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>Scaletta attiva</Text>
          </View>
        )}

        <View style={styles.nameRow}>
          {editingName ? (
            <>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.nameSave} onPress={saveName}>
                <Text style={styles.nameSaveText}>OK</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.nameTitle}>{setlist?.name}</Text>
              <Pressable
                onPress={() => {
                  if (!setlist) return;
                  setNameDraft(setlist.name);
                  setEditingName(true);
                }}
              >
                <Ionicons name="pencil" size={20} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </View>

        <Pressable style={styles.addFromFav} onPress={() => router.push("/preferiti")}>
          <Ionicons name="star" size={20} color="#FFC107" />
          <Text style={styles.addFromFavText}>Aggiungi dai preferiti</Text>
        </Pressable>

        {songs.length > 0 && (
          <Text style={styles.reorderHint}>
            Tieni premuto ≡ e trascina, oppure usa le frecce
          </Text>
        )}
      </View>
    ),
    [
      activeSetlistId,
      setlist,
      editingName,
      nameDraft,
      songs.length,
      styles,
      colors.textMuted,
      saveName,
      router,
    ],
  );

  const renderSongRow = useCallback(
    ({ item: song, drag, isActive, getIndex }: RenderItemParams<Song>) => {
      if (!setlist) return null;
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <View style={[styles.row, isActive && styles.rowDragging]}>
            <Pressable
              onLongPress={drag}
              delayLongPress={120}
              hitSlop={8}
              style={styles.dragHandle}
              accessibilityLabel="Trascina per riordinare"
            >
              <Ionicons name="reorder-three" size={26} color={colors.textMuted} />
            </Pressable>
            <View style={styles.orderBtns}>
              <Pressable
                disabled={index === 0}
                onPress={() => moveInSetlist(setlist.id, song.id, "up")}
                style={index === 0 && styles.orderDisabled}
              >
                <Ionicons name="chevron-up" size={22} color={colors.text} />
              </Pressable>
              <Pressable
                disabled={index === songs.length - 1}
                onPress={() => moveInSetlist(setlist.id, song.id, "down")}
                style={index === songs.length - 1 && styles.orderDisabled}
              >
                <Ionicons name="chevron-down" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Pressable style={styles.rowBody} onPress={() => router.push(`/canto/${song.id}`)}>
              <Text style={styles.rowIndex}>{index + 1}.</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {song.title}
                </Text>
                {song.subtitle ? (
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {song.subtitle}
                  </Text>
                ) : null}
              </View>
              <SongMarkers songId={song.id} size={18} showSetlistAction={false} />
            </Pressable>
            <Pressable
              onPress={() => removeFromSetlist(setlist.id, song.id)}
              hitSlop={8}
            >
              <Ionicons name="close-circle-outline" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
        </ScaleDecorator>
      );
    },
    [styles, colors, setlist, songs.length, moveInSetlist, removeFromSetlist, router],
  );

  if (!setlist) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Scaletta non trovata</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DraggableFlatList
        data={songs}
        keyExtractor={(song) => song.id}
        onDragEnd={({ data }) => {
          void reorderSetlist(
            setlist.id,
            data.map((song) => song.id),
          );
        }}
        renderItem={renderSongRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nessun canto. Aggiungi dai preferiti o apri un canto e usa + scaletta.
          </Text>
        }
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.scroll}
        style={styles.list}
      />
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    listContainer: { flex: 1 },
    list: { flex: 1 },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { color: colors.textMuted, fontSize: 16 },
    activeBanner: {
      backgroundColor: colors.primary + "22",
      borderRadius: 8,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    activeBannerText: { color: colors.primary, fontWeight: "700", textAlign: "center" },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    nameTitle: { flex: 1, color: colors.text, fontSize: 22, fontWeight: "900" },
    nameInput: {
      flex: 1,
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    nameSave: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },
    nameSaveText: { color: "#FFF", fontWeight: "800" },
    addFromFav: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.bgCard,
      borderRadius: 10,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addFromFavText: { color: colors.text, fontWeight: "700" },
    reorderHint: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    empty: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    rowDragging: {
      opacity: 0.92,
      borderColor: colors.primary,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    dragHandle: { paddingHorizontal: 2, justifyContent: "center" },
    orderBtns: { alignItems: "center", width: 36 },
    orderDisabled: { opacity: 0.25 },
    rowBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    rowIndex: { color: colors.textMuted, fontWeight: "700", width: 24 },
    rowText: { flex: 1 },
    rowTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  });
}
