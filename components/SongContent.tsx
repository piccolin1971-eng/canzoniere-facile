import { Platform, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import type { Song, SongLine } from "@/src/types";
import { transposeChordLine } from "@/src/transpose";

type Props = {
  song: Song;
  fontSize: number;
  transposeSemis?: number;
};

export function SongContent({ song, fontSize, transposeSemis = 0 }: Props) {
  const { colors } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chordSize = Math.round(fontSize * 0.72);
  const lyricSize = fontSize;
  const noteSize = Math.round(fontSize * 0.65);

  return (
    <View style={styles.wrap}>
      {song.lines.map((line, i) => {
        const displayLine: SongLine =
          line.type === "chords" && transposeSemis
            ? { ...line, text: transposeChordLine(line.text, transposeSemis) }
            : line;
        if (displayLine.type === "chords") {
          return (
            <Text
              key={i}
              style={[styles.chords, { fontSize: chordSize, lineHeight: chordSize * 1.35 }]}
            >
              {displayLine.text}
            </Text>
          );
        }
        if (displayLine.type === "note") {
          return (
            <Text
              key={i}
              style={[styles.note, { fontSize: noteSize, lineHeight: noteSize * 1.4 }]}
            >
              {displayLine.text}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            style={[styles.lyrics, { fontSize: lyricSize, lineHeight: lyricSize * 1.55 }]}
          >
            {displayLine.text}
          </Text>
        );
      })}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { paddingBottom: spacing.xl },
    chords: {
      color: colors.chord,
      fontWeight: "700",
      ...(Platform.OS === "ios" ? { fontFamily: "Menlo" } : {}),
      letterSpacing: 0.5,
      marginTop: spacing.sm,
    },
    lyrics: {
      color: colors.text,
      fontWeight: "500",
      marginBottom: spacing.xs,
    },
    note: {
      color: colors.chordAlt,
      fontStyle: "italic",
      marginVertical: spacing.xs,
    },
  });
}
