import { View, Text, Pressable, Linking } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS, IOS_SEPARATORS } from "@/constants/colors";

/**
 * Extract domain from URL for display.
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const borderColor = isDark ? IOS_SEPARATORS.default.dark : IOS_SEPARATORS.default.light;
  const bgColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  const url = block.bookmark?.url;
  const caption = block.bookmark?.caption;

  if (!url) {
    return null;
  }

  const handlePress = () => {
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  };

  const domain = getDomain(url);
  const hasCaption = caption && caption.length > 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        marginBottom: 12,
        marginLeft: depth * 24,
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        backgroundColor: bgColor,
        overflow: "hidden",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ padding: 12 }}>
        {/* Title from caption or URL */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            {hasCaption ? (
              <RichText
                richText={caption}
                style={{ fontSize: 15, fontWeight: "500", color: textColor }}
              />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "500", color: textColor }}
                numberOfLines={1}
              >
                {url}
              </Text>
            )}
          </View>
          <ExternalLink size={14} color={secondaryColor} style={{ marginLeft: 8 }} />
        </View>

        {/* Domain / URL info */}
        <Text style={{ fontSize: 13, color: secondaryColor }} numberOfLines={1}>
          {domain}
        </Text>
      </View>
    </Pressable>
  );
}
