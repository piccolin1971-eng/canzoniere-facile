import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeHeaderButton } from "@/components/HomeHeaderButton";
import {
  FONT_MAX,
  FONT_MIN,
  PARCHMENT_TONE_MAX,
  PARCHMENT_TONE_MIN,
  useSettings,
} from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

const LYRIC_SWATCHES = ["#000000", "#111111", "#2C2C2C", "#1A237E", "#4A148C", "#1B5E20", "#FFFFFF", "#F4F4F8"];
const CHORD_SWATCHES = ["#FFB74D", "#FF6B4A", "#E65100", "#BF360C", "#4DD0E1", "#00838F", "#7C4DFF", "#00E676"];

function ColorSwatches({
  colors,
  swatches,
  selected,
  onSelect,
  onReset,
}: {
  colors: AppColors;
  swatches: string[];
  selected: string | null;
  onSelect: (c: string) => void;
  onReset: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
      {swatches.map((c) => (
        <Pressable
          key={c}
          onPress={() => onSelect(c)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c,
            borderWidth: selected === c ? 3 : 1,
            borderColor: selected === c ? colors.primary : colors.border,
          }}
        />
      ))}
      <Pressable
        onPress={onReset}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bgElevated,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>Predefinito</Text>
      </Pressable>
    </View>
  );
}

export default function ImpostazioniScreen() {
  const router = useRouter();
  const {
    theme,
    setTheme,
    parchmentTone,
    setParchmentTone,
    customLyricColor,
    setCustomLyricColor,
    customChordColor,
    setCustomChordColor,
    fontSize,
    setFontSize,
    colors,
  } = useSettings();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.headerTint} />
          <Text style={styles.backText}>Indietro</Text>
        </Pressable>
        <Text style={styles.title}>Impostazioni</Text>
        <HomeHeaderButton size={24} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tema</Text>
          <View style={styles.themeRow}>
            <Pressable
              style={[styles.themeCard, theme === "light" && styles.themeCardActive]}
              onPress={() => setTheme("light")}
            >
              <Ionicons name="sunny" size={28} color={theme === "light" ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeCardText, theme === "light" && { color: colors.primary }]}>Chiaro</Text>
            </Pressable>
            <Pressable
              style={[styles.themeCard, theme === "parchment" && styles.themeCardActive]}
              onPress={() => setTheme("parchment")}
            >
              <Ionicons
                name="document-text"
                size={28}
                color={theme === "parchment" ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.themeCardText, theme === "parchment" && { color: colors.primary }]}>
                Pergamena
              </Text>
            </Pressable>
            <Pressable
              style={[styles.themeCard, theme === "dark" && styles.themeCardActive]}
              onPress={() => setTheme("dark")}
            >
              <Ionicons name="moon" size={28} color={theme === "dark" ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeCardText, theme === "dark" && { color: colors.primary }]}>Scuro</Text>
            </Pressable>
          </View>

          {theme === "parchment" && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionTitle}>Tono pergamena</Text>
              <Text style={styles.sectionDesc}>
                Regola la tonalità dello sfondo seppia ({parchmentTone}). Il range mantiene il testo leggibile.
              </Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>{PARCHMENT_TONE_MIN}</Text>
                <Slider
                  style={{ flex: 1, height: 40 }}
                  minimumValue={PARCHMENT_TONE_MIN}
                  maximumValue={PARCHMENT_TONE_MAX}
                  step={1}
                  value={parchmentTone}
                  onValueChange={(v) => setParchmentTone(Math.round(v))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <Text style={styles.sliderLabel}>{PARCHMENT_TONE_MAX}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colore testo</Text>
          <Text style={styles.sectionDesc}>Colore delle parole del canto. Tocca Predefinito per il colore del tema.</Text>
          <Text style={[styles.previewLyric, { color: colors.text }]}>
            Padre nostro che sei nei cieli
          </Text>
          <ColorSwatches
            colors={colors}
            swatches={LYRIC_SWATCHES}
            selected={customLyricColor}
            onSelect={setCustomLyricColor}
            onReset={() => setCustomLyricColor(null)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colore accordi</Text>
          <Text style={styles.sectionDesc}>Colore delle righe con accordi sopra il testo.</Text>
          <Text style={[styles.previewChord, { color: colors.chord }]}>Am    F     C     G</Text>
          <ColorSwatches
            colors={colors}
            swatches={CHORD_SWATCHES}
            selected={customChordColor}
            onSelect={setCustomChordColor}
            onReset={() => setCustomChordColor(null)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimensione testo</Text>
          <Text style={styles.sectionDesc}>Regola la grandezza del testo nei canti ({fontSize} pt).</Text>
          <View style={styles.fontRow}>
            <Pressable
              onPress={() => setFontSize(fontSize - 2)}
              disabled={fontSize <= FONT_MIN}
              style={[styles.fontBtn, fontSize <= FONT_MIN && styles.fontBtnDisabled]}
            >
              <Text style={styles.fontBtnText}>A-</Text>
            </Pressable>
            <Text style={styles.fontSizeValue}>{fontSize}</Text>
            <Pressable
              onPress={() => setFontSize(fontSize + 2)}
              disabled={fontSize >= FONT_MAX}
              style={[styles.fontBtn, fontSize >= FONT_MAX && styles.fontBtnDisabled]}
            >
              <Text style={styles.fontBtnText}>A+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 6, width: 100 },
    backText: { color: colors.text, fontSize: 16, fontWeight: "600" },
    title: { color: colors.text, fontSize: 20, fontWeight: "800" },
    scroll: { padding: spacing.md, paddingBottom: spacing.xl },
    section: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
    sectionDesc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    themeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    themeCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
      gap: 6,
    },
    themeCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
    themeCardText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
    sliderRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
    sliderLabel: { color: colors.textMuted, width: 36, textAlign: "center", fontWeight: "700" },
    previewLyric: { fontSize: 18, fontWeight: "600", marginTop: spacing.sm },
    previewChord: { fontSize: 16, fontWeight: "700", marginTop: spacing.sm, fontFamily: "Menlo" },
    fontRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.md },
    fontBtn: {
      backgroundColor: colors.bgElevated,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontBtnDisabled: { opacity: 0.4 },
    fontBtnText: { color: colors.text, fontWeight: "800", fontSize: 18 },
    fontSizeValue: { color: colors.text, fontSize: 20, fontWeight: "800", minWidth: 40, textAlign: "center" },
  });
}
