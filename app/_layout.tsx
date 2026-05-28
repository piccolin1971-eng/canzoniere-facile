import { SettingsProvider } from "@/src/SettingsContext";
import { ThemeStack } from "@/components/ThemeStack";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ThemeStack />
    </SettingsProvider>
  );
}
