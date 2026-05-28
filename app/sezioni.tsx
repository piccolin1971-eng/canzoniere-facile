import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SECTIONS } from "@/src/sections";
import { songsBySection, SONGS } from "@/src/songs";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function SezioniScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const active = SECTIONS.filter((s) => songsBySection(s.id).length > 0);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {active.map((sec) => {
        const count = songsBySection(sec.id).length;
        return (
          <Pressable
            key={sec.id}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/sezione/${sec.id}`)}
          >
            <Text style={styles.emoji}>{sec.emoji}</Text>
            <View style={styles.body}>
              <Text style={styles.name}>{sec.name}</Text>
              <Text style={styles.meta}>
                Sezione {sec.id} · {count} canti
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: sec.color }]} />
          </Pressable>
        );
      })}
      <Text style={styles.hint}>
        Altre sezioni ({SONGS.length} canti importati) arriveranno con l'import completo del PDF.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    scroll: { padding: spacing.md },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    emoji: { fontSize: 32 },
    body: { flex: 1 },
    name: { color: colors.text, fontSize: 18, fontWeight: "700" },
    meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    hint: { color: colors.textMuted, fontSize: 13, marginTop: spacing.lg, lineHeight: 20 },
  });
}
