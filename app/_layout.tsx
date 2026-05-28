import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SettingsProvider } from "@/src/SettingsContext";
import { SongCatalogProvider } from "@/src/SongCatalogContext";
import { SongEditsProvider } from "@/src/SongEditsContext";
import { LibraryProvider } from "@/src/LibraryContext";
import { ThemeStack } from "@/components/ThemeStack";

export default function RootLayout() {
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
