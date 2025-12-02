import { useSegments } from "expo-router";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger
} from "expo-router/ui";
import {
  Heart,
  House,
  Book,
  ShoppingBasket,
  User
} from "lucide-react-native";
import {
  StyleSheet,
  Text,
  View
} from "react-native";

export default function Layout() {
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];

  const getTabColor = (tabName: string) =>
    currentTab === tabName ? "#69B565" : "#8E8E93";

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          height: 90,
          borderTopWidth: 0,
        }}
      >
        <TabTrigger
        name="home"
        href="/default/home"
        style={styles.trigger}
        >
          <View style={styles.triggerContent}>
            <House color={getTabColor("home")} style={styles.icon} />
            <Text style={[styles.font, { color: getTabColor("home") }]}>
              Home
            </Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="favorito"
          href="/default/favorito"
          style={styles.trigger}
        >
          <View style={styles.triggerContent}>
            <Heart color={getTabColor("favorito")} style={styles.icon} />
            <Text style={[styles.font, { color: getTabColor("favorito") }]}>
              Favorito
            </Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="meus-livros"
          href="/default/meus-livros"
          style={styles.trigger}
        >
          <View style={styles.triggerContent}>
            <Book color={getTabColor("meus-livros")} style={styles.icon} />
            <Text style={[styles.font, { color: getTabColor("meus-livros") }]}>
              Estante
            </Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="carrinho"
          href="/default/carrinho"
          style={styles.trigger}
        >
          <View style={styles.triggerContent}>
            <ShoppingBasket color={getTabColor("carrinho")} style={styles.icon} />
            <Text style={[styles.font, { color: getTabColor("carrinho") }]}>
              Carrinho
            </Text>
          </View>
        </TabTrigger>

        <TabTrigger
          name="profile"
          href="/default/profile"
          style={styles.trigger}
        >
          <View style={styles.triggerContent}>
            <User color={getTabColor("profile")} style={styles.icon} />
            <Text style={[styles.font, { color: getTabColor("profile") }]}>
              Usuário
            </Text>
          </View>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  triggerContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  font: {
    fontFamily: "Manrope-Regular",
  },
  icon: {
    width: 24,
    height: 24,
  },
});
