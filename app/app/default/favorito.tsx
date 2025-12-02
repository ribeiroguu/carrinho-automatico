import { AnimatedScreen } from "@/components/animated-screen";
import { BookCard } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingScreen } from "@/components/loading-screen";
import LogoBibliotech from "@/components/logo";
import { favoritosService } from "@/services/favoritos.service";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import type { Livro } from "@/types";

export default function Favorito() {
  const [favoritos, setFavoritos] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadFavoritos = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const data = await favoritosService.listar();
      setFavoritos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar favoritos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavoritos();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavoritos(true);
  };

  const handleRemoveFavorito = async (livroId: number) => {
    Alert.alert(
      "Remover Favorito",
      "Deseja remover este livro dos favoritos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingId(livroId);
              await favoritosService.remover(livroId);
              setFavoritos((prev) => prev.filter((f) => f.id !== livroId));
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao remover favorito");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadFavoritos()} />;
  }

  return (
    <AnimatedScreen
      animation="slideUp"
      duration={300}
      resetOnFocus={true}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          gap: 10,
          width: "100%",
          alignItems: "center",
          marginBottom: 10,
          marginTop: 50,
        }}
      >
        <LogoBibliotech variant="medium" color={"#000"} />

        <Text
          style={{
            fontFamily: "Manrope-Bold",
            fontSize: 24,
          }}
        >
          Meus Favoritos
        </Text>
      </View>

      <ScrollView
        style={{
          width: "100%",
        }}
        contentContainerStyle={{
          alignItems: "center",
          gap: 10,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {favoritos.length === 0 ? (
          <EmptyState
            message="Nenhum favorito ainda"
            description="Adicione livros aos favoritos para vê-los aqui"
          />
        ) : (
          favoritos.map((livro) => (
            <View key={livro.id} style={{ position: "relative", width: "100%" }}>
              <BookCard
                title={livro.titulo}
                author={livro.autor}
                description={livro.sinopse}
                status={livro.disponivel ? 1 : 0}
                imageSource={require("@/assets/images/logo.png")}
                icon1={"heartOff"}
                onIcon1Press={() => handleRemoveFavorito(livro.id)}
              />
              {removingId === livro.id && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255,255,255,0.8)",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 10,
                  }}
                >
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}
