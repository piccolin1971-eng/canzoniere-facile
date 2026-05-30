import { Platform, StyleSheet, Text, View } from "react-native";
import { memo, useMemo } from "react";
import { useSettings } from "@/src/SettingsContext";
import { resolveBodyFont } from "@/src/fontFamily";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";
import type { Song, SongLine, LineType } from "@/src/types";
import { transposeChordLine } from "@/src/transpose";
import { fixItalianApostropheAccents } from "@/src/textNormalize";

type Props = {
  song: Song;
  fontSize: number;
  transposeSemis?: number;
};

type DisplayBlock = { type: LineType; text: string };

/** Unisce righe consecutive dello stesso tipo: stesso aspetto, meno view native. */
function buildDisplayBlocks(lines: SongLine[], transposeSemis: number): DisplayBlock[] {
  const blocks: DisplayBlock[] = [];
  for (const line of lines) {
    let text =
      line.type === "chords" && transposeSemis
        ? transposeChordLine(line.text, transposeSemis)
        : line.text;
    if (line.type === "lyrics" || line.type === "note") {
      text = fixItalianApostropheAccents(text);
    }
    const last = blocks[blocks.length - 1];
    if (last && last.type === line.type) {
      last.text = `${last.text}\n${text}`;
    } else {
      blocks.push({ type: line.type, text });
    }
  }
  return blocks;
}

function SongContentInner({ song, fontSize, transposeSemis = 0 }: Props) {
  const { colors, fontFamilyId, isBold } = useSettings();
  const bodyFont = resolveBodyFont(fontFamilyId, isBold);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chordSize = Math.round(fontSize * 0.72);
  const lyricSize = fontSize;
  const noteSize = Math.round(fontSize * 0.65);
  const textFontStyle = {
    fontFamily: bodyFont.fontFamily,
    fontWeight: bodyFont.fontWeight,
  } as const;

  const blocks = useMemo(
    () => buildDisplayBlocks(song.lines, transposeSemis),
    [song.lines, transposeSemis],
  );

  return (
    <View style={styles.wrap}>
      {blocks.map((block, i) => {
        if (block.type === "chords") {
          return (
            <Text
              key={i}
              style={[styles.chords, { fontSize: chordSize, lineHeight: chordSize * 1.35 }]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === "note") {
          return (
            <Text
              key={i}
              style={[
                styles.note,
                textFontStyle,
                { fontSize: noteSize, lineHeight: noteSize * 1.4 },
              ]}
            >
              {block.text}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            style={[
              styles.lyrics,
              textFontStyle,
              { fontSize: lyricSize, lineHeight: lyricSize * 1.55 },
            ]}
          >
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

export const SongContent = memo(SongContentInner);

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
