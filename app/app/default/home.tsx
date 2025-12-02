import { AnimatedScreen } from "@/components/animated-screen";
import { BookCard } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingScreen } from "@/components/loading-screen";
import LogoBibliotech from "@/components/logo";
import { useBooksStore } from "@/stores/booksStore";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Searchbar } from "react-native-paper";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const { livros, recomendados, isLoading, fetchLivros, fetchRecomendados } =
		useBooksStore();

	// Carrega livros e recomendados ao montar
	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setError(null);
			await Promise.all([fetchLivros(), fetchRecomendados()]);
		} catch (err: any) {
			console.error("Erro ao carregar dados:", err);
			setError("Erro ao carregar livros. Tente novamente.");
		}
	};

	// Debounce na busca
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchQuery.length >= 2 || searchQuery.length === 0) {
				handleSearch();
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleSearch = async () => {
		try {
			setError(null);
			await fetchLivros({ search: searchQuery || undefined });
		} catch (err: any) {
			console.error("Erro na busca:", err);
			setError("Erro ao buscar livros");
		}
	};

	const onRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await loadData();
		setIsRefreshing(false);
	}, []);

	const handleCardPress = (livro: any) => {
		router.push({
			pathname: "/livro",
			params: { id: livro.id },
		});
	};

	if (isLoading && livros.length === 0 && recomendados.length === 0) {
		return <LoadingScreen />;
	}

	if (error && livros.length === 0) {
		return <ErrorState message={error} />;
	}

	const displayBooks = searchQuery ? livros : recomendados;

	return (
		<AnimatedScreen animation={"slideUp"} duration={300} resetOnFocus={true}>
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

					<Searchbar
						placeholder="Encontrar livro"
						onChangeText={setSearchQuery}
						value={searchQuery}
						icon={() => <Search size={24} color={"#8E8E93"} />}
						inputStyle={{
							fontFamily: "Manrope-Regular",
						}}
						style={{
							borderRadius: 20,
							width: "90%",
							alignItems: "center",
						}}
					/>

					<Text
						style={{
							fontFamily: "Manrope-Bold",
							fontSize: 24,
						}}
					>
						{searchQuery ? "Resultados" : "Recomendados"}
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
					}}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
					}
				>
					{displayBooks.length === 0 ? (
						<EmptyState
							message={
								searchQuery
									? "Nenhum livro encontrado"
									: "Nenhum livro recomendado"
							}
						/>
					) : (
						displayBooks.map((book) => (
							<BookCard
								key={book.id}
								title={book.titulo}
								author={book.autor}
								description={book.sinopse || "Sem descrição"}
								status={book.status === "disponivel" ? 1 : 0}
								imageSource={
									book.capa_url
										? { uri: book.capa_url }
										: require("@/assets/images/logo.png")
								}
								icon1={"heart"}
								onIcon1Press={() => {
									console.log("Favoritar:", book.id);
								}}
								onPress={() => handleCardPress(book)}
							/>
						))
					)}
				</ScrollView>
			</View>
		</AnimatedScreen>
	);
}
