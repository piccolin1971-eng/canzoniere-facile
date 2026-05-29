import "react-native-gesture-handler";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { Lora_400Regular, Lora_700Bold } from "@expo-google-fonts/lora";
import {
  PlaypenSans_400Regular,
  PlaypenSans_700Bold,
} from "@expo-google-fonts/playpen-sans";
import {
  SourGummy_400Regular,
  SourGummy_700Bold,
} from "@expo-google-fonts/sour-gummy";
import { SettingsProvider } from "@/src/SettingsContext";
import { SongCatalogProvider } from "@/src/SongCatalogContext";
import { SongEditsProvider } from "@/src/SongEditsContext";
import { LibraryProvider } from "@/src/LibraryContext";
import { ThemeStack } from "@/components/ThemeStack";

export default function RootLayout() {
  const [loaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    Lora_400Regular,
    Lora_700Bold,
    PlaypenSans_400Regular,
    PlaypenSans_700Bold,
    SourGummy_400Regular,
    SourGummy_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#7CB342" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <SongCatalogProvider>
          <SongEditsProvider>
            <LibraryProvider>
              <ThemeStack />
            </LibraryProvider>
          </SongEditsProvider>
        </SongCatalogProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
