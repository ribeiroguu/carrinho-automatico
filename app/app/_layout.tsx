import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "SortsMill Goudy": require("@/assets/fonts/SortsMillGoudy-Regular.ttf"),
    "Manrope-Regular": require("@/assets/fonts/Manrope/Manrope-Regular.ttf"),
    "Manrope-Bold": require("@/assets/fonts/Manrope/Manrope-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: "Meu App",
      }}
    >

      {/* <Stack.Screen name="index" options={{ title: "Início | Meu App" }} />
      <Stack.Screen name="perfil" options={{ title: "Perfil | Meu App" }} />
      <Stack.Screen name="config" options={{ title: "Configurações | Meu App" }} /> */}
    </Stack>
  );
}
