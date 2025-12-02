import { AnimatedScreen } from "@/components/animated-screen";
import LogoBibliotech from "@/components/logo";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BookCard } from "@/components/card";
import { emprestimosService } from "@/services/emprestimos.service";
import { useFocusEffect } from "expo-router";
import type { Emprestimo } from "@/types";
import { LoadingScreen } from "@/components/loading-screen";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

export default function MeusLivros() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadEmprestimos = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const data = await emprestimosService.getAtivos();
      setEmprestimos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar empréstimos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEmprestimos();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadEmprestimos(true);
  };

  const handleRenovar = async (emprestimoId: number) => {
    Alert.alert(
      "Renovar Empréstimo",
      "Deseja renovar este empréstimo por mais 7 dias?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renovar",
          onPress: async () => {
            try {
              setActioningId(emprestimoId);
              await emprestimosService.renovar(emprestimoId);
              Alert.alert("Sucesso", "Empréstimo renovado com sucesso!");
              await loadEmprestimos();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao renovar empréstimo");
            } finally {
              setActioningId(null);
            }
          },
        },
      ]
    );
  };

  const handleDevolver = async (emprestimoId: number) => {
    Alert.alert(
      "Devolver Livro",
      "Confirma a devolução deste livro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "destructive",
          onPress: async () => {
            try {
              setActioningId(emprestimoId);
              await emprestimosService.devolver(emprestimoId);
              Alert.alert("Sucesso", "Livro devolvido com sucesso!");
              setEmprestimos((prev) => prev.filter((e) => e.id !== emprestimoId));
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao devolver livro");
            } finally {
              setActioningId(null);
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
    return <ErrorState message={error} onRetry={() => loadEmprestimos()} />;
  }

  return (
    <AnimatedScreen animation={"slideUp"} duration={300} resetOnFocus={true} >
      <View
        style={{
          flex: 1,
          alignItems: "center",
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
            Meus Livros
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
          {emprestimos.length === 0 ? (
            <EmptyState
              message="Nenhum empréstimo ativo"
              description="Pegue livros emprestados para vê-los aqui"
            />
          ) : (
            emprestimos.map((emprestimo) => (
              <View key={emprestimo.id} style={{ position: "relative", width: "100%" }}>
                <BookCard
                  title={emprestimo.livro.titulo}
                  author={emprestimo.livro.autor}
                  description={`Vence em: ${new Date(emprestimo.data_devolucao_prevista).toLocaleDateString('pt-BR')} | Renovações: ${emprestimo.renovacoes}/3`}
                  status={1}
                  imageSource={require("@/assets/images/logo.png")}
                  icon1={"recycle"}
                  icon2={"restore"}
                  onIcon1Press={() => handleRenovar(emprestimo.id)}
                  onIcon2Press={() => handleDevolver(emprestimo.id)}
                />
                {actioningId === emprestimo.id && (
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
      </View>
    </AnimatedScreen>
  );
}
