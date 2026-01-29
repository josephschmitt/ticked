import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Copy, Check } from "lucide-react-native";
import SyntaxHighlighter from "react-native-syntax-highlighter";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

// Horizontal scroll wrapper for code that may overflow
const CodeScrollWrapper = ({ children }: { children: React.ReactNode }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ flexGrow: 1 }}
  >
    {children}
  </ScrollView>
);

// Simple wrapper for inner code content
const CodeWrapper = ({ children }: { children: React.ReactNode }) => (
  <View>{children}</View>
);

// Map Notion language names to highlight.js language names
const LANGUAGE_MAP: Record<string, string> = {
  "plain text": "plaintext",
  "c++": "cpp",
  "c#": "csharp",
  "objective-c": "objectivec",
  "f#": "fsharp",
  "visual basic": "vbnet",
};

export function CodeBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const bgColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  // Extract plain text from rich text items
  const codeText = (block.code?.rich_text || [])
    .map((item) => item.plain_text)
    .join("");

  // Get the language, mapping Notion names to highlight.js names
  const notionLanguage = block.code?.language?.toLowerCase() || "plaintext";
  const language = LANGUAGE_MAP[notionLanguage] || notionLanguage;

  // Custom style to match our background
  const customStyle = {
    ...(isDark ? atomOneDark : atomOneLight),
    hljs: {
      ...(isDark ? atomOneDark : atomOneLight).hljs,
      background: "transparent",
      padding: 0,
    },
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(codeText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={{
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: bgColor,
        marginLeft: depth * 24,
      }}
    >
      {/* Header row with language and copy button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Text style={{ fontSize: 12, color: secondaryColor }}>
          {block.code?.language || ""}
        </Text>
        <Pressable
          onPress={handleCopy}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          {copied ? (
            <Check size={12} color={secondaryColor} />
          ) : (
            <Copy size={12} color={secondaryColor} />
          )}
          <Text style={{ fontSize: 12, color: secondaryColor }}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
      </View>

      {/* Code content */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          fontSize={14}
          fontFamily="Menlo"
          PreTag={CodeScrollWrapper}
          CodeTag={CodeWrapper}
        >
          {codeText}
        </SyntaxHighlighter>
      </View>
    </View>
  );
}
