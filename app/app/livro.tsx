import { AnimatedScreen } from "@/components/animated-screen";
import Button from "@/components/button";
import { LoadingScreen } from "@/components/loading-screen";
import { ErrorState } from "@/components/error-state";
import { livrosService } from "@/services/livros.service";
import { favoritosService } from "@/services/favoritos.service";
import { useLocalSearchParams } from "expo-router";
import { Heart } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Livro } from "@/types";

export default function LivroPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [livro, setLivro] = useState<Livro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorito, setIsFavorito] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadLivro();
      checkFavorito();
    }
  }, [id]);

  const loadLivro = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await livrosService.getById(Number(id));
      setLivro(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar livro");
    } finally {
      setLoading(false);
    }
  };

  const checkFavorito = async () => {
    try {
      const result = await favoritosService.isFavorito(Number(id));
      setIsFavorito(result.isFavorito);
    } catch (err) {
      console.error("Erro ao verificar favorito:", err);
    }
  };

  const handleToggleFavorito = async () => {
    if (!livro) return;

    try {
      setFavoriteLoading(true);
      if (isFavorito) {
        await favoritosService.remover(livro.id);
        setIsFavorito(false);
        Alert.alert("Sucesso", "Livro removido dos favoritos");
      } else {
        await favoritosService.adicionar(livro.id);
        setIsFavorito(true);
        Alert.alert("Sucesso", "Livro adicionado aos favoritos");
      }
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao atualizar favorito");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !livro) {
    return (
      <ErrorState
        message={error || "Livro não encontrado"}
        onRetry={() => loadLivro()}
      />
    );
  }

  return (
    <AnimatedScreen
      animation={"fade"}
      duration={300}
      resetOnFocus={true}
      style={styles.container}
    >
      <Image 
        source={
          livro.capa_url
            ? { uri: livro.capa_url }
            : require("@/assets/images/logo.png")
        }
        style={styles.image} 
      />

      <Text style={styles.title}>{livro.titulo}</Text>

      <Text style={styles.author}>{livro.autor}</Text>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: livro.status === "disponivel" ? "#4CAF50" : "#FF5252" },
          ]}
        >
          <Text style={styles.statusText}>
            {livro.status === "disponivel" ? "Disponível" : "Indisponível"}
          </Text>
        </View>
      </View>

      <Text style={styles.synopsis}>{livro.sinopse || "Sem sinopse disponível"}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            { backgroundColor: isFavorito ? "#FF5252" : "#E0E0E0" },
          ]}
          onPress={handleToggleFavorito}
          disabled={favoriteLoading}
        >
          <Heart
            color={isFavorito ? "#FFF" : "#666"}
            size={24}
            fill={isFavorito ? "#FFF" : "none"}
          />
        </TouchableOpacity>

        {livro.status === "disponivel" && (
          <Button
            variant="primary"
            size="medium"
            title="Pegar Emprestado"
            onPress={() => Alert.alert("Info", "Use o carrinho RFID para pegar este livro emprestado")}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 20,
  },
  image: {
    width: 140,
    height: 210,
    borderRadius: 10,
    marginTop: 50,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Manrope-Bold",
    fontSize: 24,
    textAlign: "center",
  },
  author: {
    fontFamily: "Manrope-Regular",
    fontSize: 16,
    color: "#666",
  },
  statusContainer: {
    marginVertical: 5,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: "Manrope-Bold",
    fontSize: 12,
    color: "#FFF",
  },
  synopsis: {
    fontFamily: "Manrope-Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "justify",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 10,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
