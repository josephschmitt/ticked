import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

export function ImageBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const captionColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const { width: screenWidth } = useWindowDimensions();

  // Calculate available width accounting for padding and depth
  const containerPadding = 32; // Typical container padding
  const depthIndent = depth * 24;
  const maxWidth = screenWidth - containerPadding - depthIndent;

  // Get image URL from either file or external type
  const imageUrl = block.image?.type === "file"
    ? block.image.file?.url
    : block.image?.external?.url;

  const caption = block.image?.caption;

  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default aspect ratio

  if (!imageUrl) {
    return null;
  }

  return (
    <View style={{ marginBottom: 12, marginLeft: depthIndent }}>
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: maxWidth,
          aspectRatio,
          borderRadius: 8,
        }}
        contentFit="contain"
        onLoad={(e) => {
          // Update aspect ratio based on actual image dimensions
          const { width, height } = e.source;
          if (width && height) {
            setAspectRatio(width / height);
          }
        }}
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        transition={200}
      />
      {caption && caption.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <RichText
            richText={caption}
            style={{ fontSize: 14, color: captionColor, textAlign: "center" }}
          />
        </View>
      )}
    </View>
  );
}
