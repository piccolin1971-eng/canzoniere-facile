import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { HomeHeaderButton } from "./HomeHeaderButton";

type Props = {
  children?: ReactNode;
};

export function StackHeaderRight({ children }: Props) {
  return (
    <View style={styles.row}>
      {children}
      <HomeHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
});
