import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { cycleLineType, lineTypeLabel } from "@/src/songEdits";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSongEdits } from "@/src/SongEditsContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import { SongLine } from "@/src/types";

export default function ModificaCantoScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const router = useRouter();
  const { colors } = useSettings();
  const { getResolvedSong, saveEdit, resetEdit, isEdited } = useSongEdits();
  const { getBaseSong, isCustomSong, updateUserSong } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const base = getBaseSong(id);
  const current = getResolvedSong(id);
  const custom = isCustomSong(id);

  const [title, setTitle] = useState(current?.title ?? "");
  const [subtitle, setSubtitle] = useState(current?.subtitle ?? "");
  const [lines, setLines] = useState<SongLine[]>(
    () => current?.lines.map((line) => ({ ...line })) ?? [],
  );

  if (!base || !current) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Canto non trovato</Text>
      </View>
    );
  }

  const updateLine = (index: number, patch: Partial<SongLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = (type: SongLine["type"]) => {
    setLines((prev) => [...prev, { type, text: "" }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Titolo mancante", "Inserisci un titolo per il canto.");
      return;
    }
    const cleanedLines = lines
      .map((line) => ({ ...line, text: line.text.trimEnd() }))
      .filter((line) => line.text.length > 0);
    if (cleanedLines.length === 0) {
      Alert.alert("Testo mancante", "Aggiungi almeno una riga di testo o accordi.");
      return;
    }
    if (custom) {
      await updateUserSong(id, {
        title: trimmedTitle,
        subtitle: subtitle.trim() || undefined,
        lines: cleanedLines,
      });
    } else {
      await saveEdit(id, {
        title: trimmedTitle,
        subtitle: subtitle.trim() || undefined,
        lines: cleanedLines,
      });
    }
    router.back();
  };

  const onReset = () => {
    Alert.alert(
      "Ripristina originale",
      "Vuoi annullare tutte le modifiche locali di questo canto?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Ripristina",
          style: "destructive",
          onPress: async () => {
            await resetEdit(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Le modifiche restano sul tablet e non cambiano il catalogo originale dell&apos;app.
        </Text>

        <Text style={styles.label}>Titolo</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Titolo del canto"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Sottotitolo (opzionale)</Text>
        <TextInput
          style={styles.input}
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Autore, tonalità…"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Righe</Text>
        {lines.map((line, index) => (
          <View key={`line-${index}`} style={styles.lineRow}>
            <Pressable
              style={[
                styles.typeChip,
                line.type === "chords" && styles.typeChipChord,
                line.type === "lyrics" && styles.typeChipLyric,
              ]}
              onPress={() => updateLine(index, { type: cycleLineType(line.type) })}
            >
              <Text style={styles.typeChipText}>{lineTypeLabel(line.type)}</Text>
            </Pressable>
            <TextInput
              style={[
                styles.lineInput,
                line.type === "chords" && styles.lineInputChord,
                line.type === "note" && styles.lineInputNote,
              ]}
              value={line.text}
              onChangeText={(text) => updateLine(index, { text })}
              multiline
              placeholder={
                line.type === "chords"
                  ? "Riga accordi"
                  : line.type === "lyrics"
                    ? "Riga testo"
                    : "Nota (intro, fine…)"
              }
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              onPress={() => removeLine(index)}
              style={styles.removeBtn}
              accessibilityLabel="Rimuovi riga"
            >
              <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}

        <View style={styles.addRow}>
          <Pressable style={styles.addBtn} onPress={() => addLine("chords")}>
            <Text style={styles.addBtnText}>+ Accordi</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => addLine("lyrics")}>
            <Text style={styles.addBtnText}>+ Testo</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => addLine("note")}>
            <Text style={styles.addBtnText}>+ Nota</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {(!custom && isEdited(id)) && (
          <Pressable style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>Ripristina originale</Text>
          </Pressable>
        )}
        <View style={styles.footerActions}>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Annulla</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveBtnText}>Salva</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
    muted: { color: colors.textMuted, fontSize: 16 },
    hint: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    label: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 15,
      marginBottom: 6,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    lineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 10,
    },
    typeChip: {
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.bgElevated,
      minWidth: 72,
    },
    typeChipChord: { backgroundColor: colors.chord + "33" },
    typeChipLyric: { backgroundColor: colors.bgElevated },
    typeChipText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
    },
    lineInput: {
      flex: 1,
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
    },
    lineInputChord: { color: colors.chord },
    lineInputNote: { color: colors.chordAlt, fontStyle: "italic" },
    removeBtn: { marginTop: 10, padding: 6 },
    addRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
    addBtn: {
      backgroundColor: colors.bgElevated,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    addBtnText: { color: colors.text, fontWeight: "700" },
    footer: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      backgroundColor: colors.bgCard,
      padding: spacing.md,
      gap: spacing.sm,
    },
    footerActions: { flexDirection: "row", gap: spacing.sm },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: { color: colors.text, fontWeight: "700" },
    saveBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    saveBtnText: { color: "#FFF", fontWeight: "800" },
    resetBtn: { alignItems: "center", paddingVertical: 8 },
    resetBtnText: { color: colors.accent, fontWeight: "700" },
  });
}
