import { ReactNode } from "react";

import { StyleSheet, View } from "react-native";

import { HomeHeaderButton } from "./HomeHeaderButton";



type Props = {

  before?: ReactNode;

  children?: ReactNode;

  iconGap?: number;

  beforeGap?: number;

};



export function StackHeaderRight({

  before,

  children,

  iconGap = 16,

  beforeGap = 12,

}: Props) {

  return (

    <View style={[styles.row, { gap: beforeGap }]}>

      {before}

      <View style={[styles.iconGroup, { gap: iconGap }]}>

        {children}

        <HomeHeaderButton />

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  row: {

    flexDirection: "row",

    alignItems: "center",

    paddingRight: 4,

  },

  iconGroup: {

    flexDirection: "row",

    alignItems: "center",

  },

});

