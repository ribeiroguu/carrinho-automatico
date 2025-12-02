import { AnimatedScreen } from "@/components/animated-screen";
import { BookCard } from "@/components/card";
import Button from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import LogoBibliotech from "@/components/logo";
import { useCartStore } from "@/stores/cartStore";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View
} from "react-native";

export default function Carrinho() {
  const {
    sessao,
    livros,
    isLoading,
    isPolling,
    iniciarSessao,
    removerLivro,
    finalizar,
    limparSessao,
    startPolling,
    stopPolling,
  } = useCartStore();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      // Start polling when screen is focused and session exists
      if (sessao) {
        startPolling();
      }

      return () => {
        // Stop polling when screen loses focus
        stopPolling();
      };
    }, [sessao, startPolling, stopPolling])
  );

  const handleIniciarSessao = async () => {
    try {
      await iniciarSessao();
      const currentSessao = useCartStore.getState().sessao;
      Alert.alert(
        "Sessão Iniciada",
        `Código da sessão: ${currentSessao?.codigo_sessao}\n\nAponte os livros no leitor RFID para adicioná-los ao carrinho.`,
        [{ text: "OK" }]
      );
      startPolling();
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao iniciar sessão");
    }
  };

  const handleRemoverLivro = async (livroId: string) => {
    Alert.alert(
      "Remover Livro",
      "Deseja remover este livro do carrinho?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingId(livroId);
              await removerLivro(livroId);
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao remover livro");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCardPress = (livroRfid: string) => {
    router.push({
      pathname: "/livro",
      params: { id: livroRfid },
    });
  };

  const handleFinalizar = async () => {
    if (livros.length === 0) {
      Alert.alert("Atenção", "Adicione livros ao carrinho antes de finalizar");
      return;
    }

    Alert.alert(
      "Finalizar Empréstimo",
      `Confirma o empréstimo de ${livros.length} livro(s)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await finalizar();
              Alert.alert("Sucesso", "Empréstimo realizado com sucesso!");
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao finalizar empréstimo");
            }
          },
        },
      ]
    );
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar Sessão",
      "Deseja cancelar a sessão atual?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: () => {
            stopPolling();
            limparSessao();
          },
        },
      ]
    );
  };

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
          Meu Carrinho
        </Text>

        {sessao && (
          <View style={{ alignItems: "center", gap: 5 }}>
            <Text style={{ fontFamily: "Manrope-Bold", fontSize: 32, color: "#007AFF" }}>
              {sessao.codigo_sessao}
            </Text>
            <Text style={{ fontFamily: "Manrope-Regular", fontSize: 12, color: "#666" }}>
              Código da sessão {isPolling && "• Atualizando..."}
            </Text>
          </View>
        )}
      </View>

      {!sessao ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <EmptyState
            message="Nenhuma sessão ativa"
            description="Inicie uma sessão para começar a adicionar livros"
          />
          <Button
            variant="primary"
            size="large"
            title={isLoading ? "Iniciando..." : "Iniciar Sessão"}
            onPress={handleIniciarSessao}
            disabled={isLoading}
          />
        </View>
      ) : (
        <>
          <ScrollView
            style={{
              width: "100%",
              flex: 1,
            }}
            contentContainerStyle={{
              alignItems: "center",
              gap: 10,
              paddingBottom: 20,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          >
            {livros.length === 0 ? (
              <EmptyState
                message="Carrinho vazio"
                description="Aproxime os livros do leitor RFID para adicioná-los"
              />
            ) : (
              livros.map((livro) => (
                <View key={livro.rfid_tag} style={{ position: "relative", width: "100%" }}>
                  <BookCard
                    title={livro.titulo}
                    author={livro.autor}
                    description={livro.sinopse || "Sem descrição"}
                    status={livro.status === "disponivel" ? 1 : 0}
                    imageSource={
                      livro.capa_url
                        ? { uri: livro.capa_url }
                        : require("@/assets/images/logo.png")
                    }
                    icon1={"trash"}
                    onIcon1Press={() => handleRemoverLivro(livro.rfid_tag)}
                    onPress={() => handleCardPress(livro.rfid_tag)}
                  />
                  {removingId === livro.rfid_tag && (
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

          <View style={{ width: "100%", paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
            <Button
              variant="primary"
              size="large"
              title={isLoading ? "Finalizando..." : "Finalizar Empréstimo"}
              onPress={handleFinalizar}
              disabled={isLoading || livros.length === 0}
            />
            <Button
              variant="secondary"
              size="large"
              title="Cancelar Sessão"
              onPress={handleCancelar}
              disabled={isLoading}
            />
          </View>
        </>
      )}
    </AnimatedScreen>
  );
}
