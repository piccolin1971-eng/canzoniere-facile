import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useSettings } from "@/src/SettingsContext";

type Props = {
  size?: number;
  color?: string;
};

export function goHome(router: ReturnType<typeof useRouter>) {
  router.dismissTo("/");
}

export function HomeHeaderButton({ size = 22, color }: Props) {
  const router = useRouter();
  const { colors } = useSettings();
  const tint = color ?? colors.headerTint;

  return (
    <Pressable
      onPress={() => goHome(router)}
      hitSlop={10}
      style={styles.btn}
      accessibilityLabel="Home"
      accessibilityRole="button"
    >
      <Ionicons name="home-outline" size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
