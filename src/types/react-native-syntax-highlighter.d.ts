declare module "react-native-syntax-highlighter" {
  import { ComponentType } from "react";

  interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: Record<string, unknown>;
    fontSize?: number;
    fontFamily?: string;
    highlighter?: "prism" | "hljs";
    PreTag?: ComponentType<{ children?: React.ReactNode }>;
    CodeTag?: ComponentType<{ children?: React.ReactNode }>;
  }

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}
