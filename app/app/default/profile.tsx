import { AnimatedScreen } from "@/components/animated-screen";
import Button from "@/components/button";
import Input from "@/components/input";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuthStore } from "@/stores/authStore";
import { usuarioService } from "@/services/usuario.service";
import { emprestimosService } from "@/services/emprestimos.service";
import { router, useFocusEffect } from "expo-router";
import { User } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  View
} from "react-native";
import type { Emprestimo, Usuario } from "@/types";

export default function Profile() {
  const { user, logout } = useAuthStore();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historico, setHistorico] = useState<Emprestimo[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [editForm, setEditForm] = useState({
    nome: "",
    email: "",
  });

  const loadPerfil = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getPerfil();
      setPerfil(data);
      setEditForm({
        nome: data.nome,
        email: data.email,
      });
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPerfil();
    }, [])
  );

  const handleEditPerfil = async () => {
    try {
      await usuarioService.updatePerfil(editForm);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setEditModalVisible(false);
      await loadPerfil();
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao atualizar perfil");
    }
  };

  const handleVerHistorico = async () => {
    try {
      setLoadingHistorico(true);
      setHistoryModalVisible(true);
      const data = await emprestimosService.getHistorico();
      setHistorico(data.emprestimos);
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao carregar histórico");
      setHistoryModalVisible(false);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Deseja realmente sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen />;
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
        gap: 15,
      }}
    >
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <View
          style={{
            width: 138,
            height: 138,
            borderWidth: 10,
            borderColor: "#8E8E93",
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <User color={"#8E8E93"} size={128} />
        </View>

        <Text style={{ fontFamily: "Manrope-Bold", fontSize: 24 }}>
          {perfil?.nome || "Usuário"}
        </Text>
        <Text style={{ fontFamily: "Manrope-Regular", fontSize: 14, color: "#666" }}>
          {perfil?.email}
        </Text>
        <Text style={{ fontFamily: "Manrope-Regular", fontSize: 14, color: "#666" }}>
          Matrícula: {perfil?.matricula}
        </Text>
      </View>

      <Button
        variant={"secondary"}
        size={"large"}
        title={"Editar perfil"}
        onPress={() => setEditModalVisible(true)}
      />

      <Button
        variant={"secondary"}
        size={"large"}
        title={"Ver histórico"}
        onPress={handleVerHistorico}
      />

      <Button
        variant={"danger"}
        size={"large"}
        title={"Sair"}
        onPress={handleLogout}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              width: "85%",
              gap: 15,
            }}
          >
            <Text style={{ fontFamily: "Manrope-Bold", fontSize: 20, textAlign: "center" }}>
              Editar Perfil
            </Text>

            <Input
              placeholder="Nome"
              value={editForm.nome}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, nome: text }))}
            />

            <Input
              placeholder="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />

            <Button
              variant="primary"
              size="large"
              title="Salvar"
              onPress={handleEditPerfil}
            />

            <Button
              variant="secondary"
              size="large"
              title="Cancelar"
              onPress={() => setEditModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "white",
              marginTop: 100,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontFamily: "Manrope-Bold", fontSize: 20, marginBottom: 20 }}>
              Histórico de Empréstimos
            </Text>

            {loadingHistorico ? (
              <LoadingScreen />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {historico.length === 0 ? (
                  <Text style={{ fontFamily: "Manrope-Regular", textAlign: "center", marginTop: 20, color: "#666" }}>
                    Nenhum empréstimo no histórico
                  </Text>
                ) : (
                  historico.map((emp) => (
                    <View
                      key={emp.id}
                      style={{
                        padding: 15,
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 10,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontFamily: "Manrope-Bold", fontSize: 16 }}>
                        {emp.livro.titulo}
                      </Text>
                      <Text style={{ fontFamily: "Manrope-Regular", fontSize: 14, color: "#666" }}>
                        {emp.livro.autor}
                      </Text>
                      <Text style={{ fontFamily: "Manrope-Regular", fontSize: 12, color: "#999", marginTop: 5 }}>
                        Empréstimo: {new Date(emp.data_emprestimo).toLocaleDateString('pt-BR')}
                      </Text>
                      {emp.data_devolucao_real && (
                        <Text style={{ fontFamily: "Manrope-Regular", fontSize: 12, color: "#999" }}>
                          Devolução: {new Date(emp.data_devolucao_real).toLocaleDateString('pt-BR')}
                        </Text>
                      )}
                      <Text style={{ 
                        fontFamily: "Manrope-Regular", 
                        fontSize: 12, 
                        color: emp.status === 'ativo' ? '#007AFF' : (emp.status === 'atrasado' ? '#FF3B30' : '#4CAF50'),
                        marginTop: 5 
                      }}>
                        Status: {emp.status === 'ativo' ? 'Ativo' : (emp.status === 'atrasado' ? 'Atrasado' : 'Devolvido')}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <Button
              variant="secondary"
              size="large"
              title="Fechar"
              onPress={() => setHistoryModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}
