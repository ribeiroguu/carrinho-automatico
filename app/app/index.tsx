import Button from "@/components/button";
import LogoBibliotech from "@/components/logo";
import { useFonts } from "expo-font";
import { Link } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const handlePress = () => {
    console.log("Botão pressionado!");
  };

  let [fontsLoaded] = useFonts({
    "SortsMill Goudy": require("../assets/fonts/SortsMillGoudy-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider
      style={{
        backgroundColor: "#003F09",
        flex: 1,
        justifyContent: "center",
      }}
    >

      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <LogoBibliotech variant="large" />
        </View>

        <View style={{ marginBottom: 40 }}>
          <Link href="/auth/login" asChild>
            <Button
              title="Começar a usar"
              onPress={() => {}}
              variant="secondary"
              size="large"
            />
          </Link>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
