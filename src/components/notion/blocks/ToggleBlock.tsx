import { useState, useCallback } from "react";
import { View, Pressable, LayoutAnimation, Platform, UIManager, ActivityIndicator } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { RichText } from "./RichText";
import type { BlockProps, BlockContext } from "./types";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { IOS_GRAYS } from "@/constants/colors";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ToggleBlockProps extends BlockProps {
  renderBlocks: (blocks: NotionBlock[], context: BlockContext) => React.ReactNode;
}

export function ToggleBlock({ block, context, renderBlocks }: ToggleBlockProps) {
  const { isDark, depth, onFetchChildren } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const chevronColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<NotionBlock[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (!isExpanded && block.has_children && !children && onFetchChildren) {
      setIsLoading(true);
      try {
        const fetchedChildren = await onFetchChildren(block.id);
        setChildren(fetchedChildren);
      } catch (error) {
        console.error("Failed to fetch toggle children:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsExpanded(!isExpanded);
  }, [isExpanded, block.id, block.has_children, children, onFetchChildren]);

  const childContext: BlockContext = {
    ...context,
    depth: depth + 1,
  };

  return (
    <View style={{ marginBottom: 4, marginLeft: depth * 24 }}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "flex-start",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            marginTop: 4,
            marginRight: 4,
            transform: [{ rotate: isExpanded ? "90deg" : "0deg" }],
          }}
        >
          <ChevronRight size={16} color={chevronColor} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <RichText
            richText={block.toggle?.rich_text || []}
            style={{ fontSize: 17, lineHeight: 24, color: textColor }}
          />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={{ marginTop: 4 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 8, paddingLeft: 20 }}>
              <ActivityIndicator size="small" color={chevronColor} />
            </View>
          ) : children && children.length > 0 ? (
            renderBlocks(children, childContext)
          ) : null}
        </View>
      )}
    </View>
  );
}
