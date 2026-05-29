import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useLibrary } from "@/src/LibraryContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

type Props = {
  songId: string;
  size?: number;
  iconGap?: number;
  showFavorite?: boolean;
  showSetlistAction?: boolean;
};

export function SongMarkers({
  songId,
  size = 22,
  iconGap = 10,
  showFavorite = true,
  showSetlistAction = true,
}: Props) {
  const { colors } = useSettings();
  const router = useRouter();
  const {
    isFavorite,
    toggleFavorite,
    isInSetlist,
    activeSetlistId,
    addToSetlist,
    removeFromSetlist,
    getActiveSetlist,
    setlists,
    setActiveSetlistId,
  } = useLibrary();
  const styles = useMemo(() => makeStyles(colors, iconGap), [colors, iconGap]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fav = isFavorite(songId);
  const active = getActiveSetlist();
  const inActive = activeSetlistId ? isInSetlist(activeSetlistId, songId) : false;

  const onSetlistPress = () => {
    if (activeSetlistId && active) {
      if (inActive) removeFromSetlist(activeSetlistId, songId);
      else addToSetlist(activeSetlistId, songId);
      return;
    }
    setPickerOpen(true);
  };

  const onPickSetlist = async (setlistId: string) => {
    const sl = setlists.find((s) => s.id === setlistId);
    if (!sl) return;
    if (isInSetlist(setlistId, songId)) {
      await removeFromSetlist(setlistId, songId);
    } else {
      await addToSetlist(setlistId, songId);
    }
    await setActiveSetlistId(setlistId);
    setPickerOpen(false);
  };

  return (
    <>
      <View style={styles.row}>
        {showFavorite && (
          <Pressable
            onPress={() => toggleFavorite(songId)}
            hitSlop={8}
            accessibilityLabel={fav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Ionicons
              name={fav ? "star" : "star-outline"}
              size={size}
              color={fav ? "#FFC107" : colors.textMuted}
            />
          </Pressable>
        )}
        {showSetlistAction && (
          <Pressable
            onPress={onSetlistPress}
            onLongPress={() => setPickerOpen(true)}
            hitSlop={8}
            accessibilityLabel={
              inActive && active
                ? `Rimuovi da ${active.name}`
                : active
                  ? `Aggiungi a ${active.name}`
                  : "Aggiungi a scaletta"
            }
          >
            <Ionicons
              name={inActive ? "checkmark-circle" : "list-circle-outline"}
              size={size}
              color={inActive ? colors.success : colors.primary}
            />
          </Pressable>
        )}
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Aggiungi a scaletta</Text>
            {setlists.map((sl) => {
              const inside = isInSetlist(sl.id, songId);
              return (
                <Pressable key={sl.id} style={styles.sheetRow} onPress={() => onPickSetlist(sl.id)}>
                  <Text style={styles.sheetRowText}>{sl.name}</Text>
                  <Ionicons
                    name={inside ? "checkmark-circle" : "add-circle-outline"}
                    size={22}
                    color={inside ? colors.success : colors.textMuted}
                  />
                </Pressable>
              );
            })}
            <Pressable style={styles.sheetLink} onPress={() => { setPickerOpen(false); router.push("/scalette"); }}>
              <Text style={styles.sheetLinkText}>Gestisci scalette</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(colors: AppColors, iconGap: number) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: iconGap },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: spacing.md,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetRowText: { color: colors.text, fontSize: 16, fontWeight: "600", flex: 1 },
    sheetLink: { alignItems: "center", paddingTop: spacing.md },
    sheetLinkText: { color: colors.primary, fontWeight: "700" },
  });
}
