import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
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
import { SongCard } from "@/components/SongCard";
import { parsePastedSong, parseSongJson } from "@/src/parsePastedSong";
import { cycleLineType, lineTypeLabel } from "@/src/songEdits";
import { SECTIONS } from "@/src/sections";
import { useSongCatalog } from "@/src/SongCatalogContext";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import type { SongLine } from "@/src/types";

export default function AggiungiCantoScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { addUserSong, userSongs, deleteSong } = useSongCatalog();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sectionId, setSectionId] = useState("Z");
  const [pasteText, setPasteText] = useState("");
  const [lines, setLines] = useState<SongLine[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const onAnalyze = () => {
    const parsed = parsePastedSong(pasteText, title);
    if (!title.trim()) setTitle(parsed.title);
    setLines(parsed.lines.map((l) => ({ ...l })));
    setAnalyzed(true);
    if (!parsed.lines.length) {
      Alert.alert("Nessuna riga", "Incolla almeno una riga di testo o accordi.");
    }
  };

  const onImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/json", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const raw = await FileSystem.readAsStringAsync(asset.uri);
      const name = asset.name?.toLowerCase() ?? "";
      let parsed = null;
      if (name.endsWith(".json")) parsed = parseSongJson(raw);
      if (!parsed) parsed = parsePastedSong(raw, title);
      if (!title.trim()) setTitle(parsed.title);
      setPasteText(raw);
      setLines(parsed.lines.map((l) => ({ ...l })));
      setAnalyzed(true);
    } catch (e) {
      Alert.alert("Errore file", "Impossibile leggere il file selezionato.");
    }
  };

  const updateLine = (index: number, patch: Partial<SongLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const onSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Titolo mancante", "Inserisci un titolo.");
      return;
    }
    const cleaned = lines
      .map((l) => ({ ...l, text: l.text.trimEnd() }))
      .filter((l) => l.text.length > 0);
    if (!cleaned.length) {
      Alert.alert("Contenuto mancante", "Analizza il testo incollato o aggiungi righe.");
      return;
    }
    const song = await addUserSong({
      title: trimmedTitle,
      subtitle: subtitle.trim() || undefined,
      sectionId,
      lines: cleaned,
    });
    router.replace(`/canto/${song.id}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {userSongs.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Canti salvati</Text>
            <Text style={styles.hint}>
              Canti creati o importati da te. Restano solo su questo tablet.
            </Text>
            {userSongs.map((song) => (
              <View key={song.id} style={styles.savedRow}>
                <View style={styles.savedCard}>
                  <SongCard
                    song={song}
                    onPress={() => router.push(`/canto/${song.id}`)}
                    showSetlistAction={false}
                  />
                </View>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert("Elimina canto", `Rimuovere "${song.title}"?`, [
                      { text: "Annulla", style: "cancel" },
                      {
                        text: "Elimina",
                        style: "destructive",
                        onPress: () => deleteSong(song.id),
                      },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={22} color={colors.accent} />
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={[styles.sectionHeading, userSongs.length > 0 && { marginTop: spacing.lg }]}>
          ① Copia e incolla
        </Text>
        <Text style={styles.hint}>
          Da Word, mail o PDF (testo selezionabile): copia sul tablet e incolla sotto, poi
          «Analizza testo».
        </Text>

        <Text style={styles.label}>Incolla qui</Text>
        <TextInput
          style={styles.pasteArea}
          value={pasteText}
          onChangeText={(t) => {
            setPasteText(t);
            setAnalyzed(false);
          }}
          multiline
          textAlignVertical="top"
          placeholder={"GLORIA\n\nLA  RE  MI\nGloria a Dio nell'alto dei cieli"}
          placeholderTextColor={colors.textMuted}
        />
        <Pressable style={styles.analyzeBtnFull} onPress={onAnalyze}>
          <Ionicons name="sparkles-outline" size={20} color="#FFF" />
          <Text style={styles.analyzeBtnText}>Analizza testo incollato</Text>
        </Pressable>

        <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>② Oppure importa file</Text>
        <Text style={styles.hint}>
          File .txt o .json salvati in Download, WhatsApp, Drive… (es. inviati dal PC).
        </Text>
        <Pressable style={styles.importBtnFull} onPress={onImportFile}>
          <Ionicons name="document-outline" size={22} color={colors.text} />
          <Text style={styles.importBtnText}>Scegli file (.txt, .json)</Text>
        </Pressable>

        <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>Dettagli canto</Text>
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

        <Text style={styles.label}>Sezione</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionRow}>
          {SECTIONS.map((sec) => (
            <Pressable
              key={sec.id}
              style={[styles.sectionChip, sectionId === sec.id && styles.sectionChipActive]}
              onPress={() => setSectionId(sec.id)}
            >
              <Text
                style={[
                  styles.sectionChipText,
                  sectionId === sec.id && styles.sectionChipTextActive,
                ]}
              >
                {sec.emoji} {sec.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {analyzed && lines.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Anteprima righe</Text>
            {lines.map((line, index) => (
              <View key={`line-${index}`} style={styles.lineRow}>
                <Pressable
                  style={styles.typeChip}
                  onPress={() => updateLine(index, { type: cycleLineType(line.type) })}
                >
                  <Text style={styles.typeChipText}>{lineTypeLabel(line.type)}</Text>
                </Pressable>
                <TextInput
                  style={styles.lineInput}
                  value={line.text}
                  onChangeText={(text) => updateLine(index, { text })}
                  multiline
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Annulla</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>Salva canto</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    sectionHeading: { color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 6 },
    hint: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
    label: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 6, marginTop: spacing.sm },
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
    sectionRow: { marginBottom: spacing.sm },
    sectionChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
      backgroundColor: colors.bgCard,
    },
    sectionChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
    sectionChipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
    sectionChipTextActive: { color: colors.text, fontWeight: "800" },
    analyzeBtnFull: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      marginTop: spacing.sm,
    },
    importBtnFull: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    importBtnText: { color: colors.text, fontWeight: "700", fontSize: 16 },
    analyzeBtnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
    pasteArea: {
      minHeight: 160,
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize: 15,
      padding: 12,
    },
    lineRow: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
    typeChip: {
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.bgElevated,
      minWidth: 72,
    },
    typeChipText: { color: colors.text, fontSize: 11, fontWeight: "800", textAlign: "center" },
    lineInput: {
      flex: 1,
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize: 15,
      padding: 10,
      minHeight: 44,
    },
    footer: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgCard,
    },
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
      flex: 2,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 10,
      backgroundColor: colors.success,
    },
    saveBtnText: { color: "#FFF", fontWeight: "800" },
    savedRow: { flexDirection: "row", alignItems: "center" },
    savedCard: { flex: 1 },
    deleteBtn: { padding: spacing.sm, marginBottom: spacing.sm },
  });
}
