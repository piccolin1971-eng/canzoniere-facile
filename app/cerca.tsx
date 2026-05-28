import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SongCard } from "@/components/SongCard";
import { searchSongs } from "@/src/songs";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

export default function CercaScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSongs(query), [query]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder="Titolo, codice (es. A1, Gloria)…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoFocus
        clearButtonMode="while-editing"
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 24 }}>
            Nessun canto trovato
          </Text>
        }
        renderItem={({ item }) => (
          <SongCard song={item} onPress={() => router.push(`/canto/${item.id}`)} />
        )}
      />
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    input: {
      margin: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 17,
      borderWidth: 1,
      borderColor: colors.border,
    },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  });
}
