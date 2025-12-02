import {
  Heart,
  HeartOff,
  Trash,
  Recycle,
  ArchiveRestore,
} from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";

interface BookProps {
  title: string;
  author: string;
  description: string;
  status: number;
  imageSource: any;
  icon1: string;
  icon2?: string;
  onPress?: () => void;
  onIcon1Press?: () => void;
  onIcon2Press?: () => void;
}

export const BookCard: React.FC<BookProps> = ({
  title,
  author,
  description,
  status,
  imageSource,
  icon1,
  icon2,
  onPress,
  onIcon1Press,
  onIcon2Press,
}) => {
  const statusText = status === 1 ? "Disponível" : "Emprestado";
  const statusColor = status === 1 ? "#69B565" : "#FF3B30";

  const renderIcon = (iconName?: string, onIconPress?: () => void) => {
    if (!iconName) return null;

    switch (iconName) {
      case "trash":
        return <Trash color="#FF3B30" size={24} onPress={onIconPress} />;
      case "heart":
        return <Heart color="#FF3B30" size={24} onPress={onIconPress} />;
      case "heartOff":
        return <HeartOff color="#FF3B30" size={24} onPress={onIconPress} />;
      case "recycle":
        return <Recycle color="#69B565" size={24} onPress={onIconPress} />;
      case "restore":
        return (
          <ArchiveRestore color="#FF3B30" size={24} onPress={onIconPress} />
        );
      default:
        return null;
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.container}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {author}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        <View style={styles.iconsContainer}>
          {renderIcon(icon1, onIcon1Press)}
          {renderIcon(icon2, onIcon2Press)}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    borderRadius: 20,
    width: "90%",
    height: 150,
  },
  container: {
    flexDirection: "row",
    padding: 12,
    height: "100%",
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "Manrope-Bold",
  },
  author: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontFamily: "Manrope-Regular",
  },
  description: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    fontFamily: "Manrope-Regular",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Manrope-Bold",
  },
  iconsContainer: {
    padding: 8,
    height: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
