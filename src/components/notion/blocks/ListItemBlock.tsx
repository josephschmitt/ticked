import { View, Text } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

export function BulletedListItemBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const bulletColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <View style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 8 + depth * 24 }}>
      <View style={{ width: 14, paddingTop: 8 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: bulletColor,
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <RichText
          richText={block.bulleted_list_item?.rich_text || []}
          style={{ fontSize: 17, lineHeight: 24, color: textColor }}
        />
      </View>
    </View>
  );
}

export function NumberedListItemBlock({ block, context }: BlockProps) {
  const { isDark, depth, index } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const numberColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  return (
    <View style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 8 + depth * 24 }}>
      <Text style={{ fontSize: 17, color: numberColor, marginRight: 8, minWidth: 20 }}>
        {index + 1}.
      </Text>
      <View style={{ flex: 1 }}>
        <RichText
          richText={block.numbered_list_item?.rich_text || []}
          style={{ fontSize: 17, lineHeight: 24, color: textColor }}
        />
      </View>
    </View>
  );
}
