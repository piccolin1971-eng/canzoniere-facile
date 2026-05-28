import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSettings } from "@/src/SettingsContext";
import type { AppColors } from "@/src/themeColors";
import { spacing } from "@/src/theme";

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

export function HomeTile({ title, subtitle, icon, color, onPress }: Props) {
  const { colors } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { borderColor: color + "44" }, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: "46%",
      backgroundColor: colors.bgCard,
      borderRadius: 20,
      padding: spacing.md,
      borderWidth: 1.5,
      marginBottom: spacing.sm,
    },
    pressed: { opacity: 0.9 },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { color: colors.text, fontSize: 17, fontWeight: "800" },
    subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  });
}
