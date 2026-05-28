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
        <Ionicons name={icon} size={31} color={color} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    tile: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: "46%",
      backgroundColor: colors.bgCard,
      borderRadius: 18,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      gap: spacing.md,
    },
    pressed: { opacity: 0.9 },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    textCol: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 20, fontWeight: "800" },
    subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 3, lineHeight: 21 },
  });
}
