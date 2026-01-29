import { useMemo } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps, BlockContext } from "./types";
import type { NotionBlock, RichTextItem } from "@/services/notion/operations/getPageContent";
import { IOS_SEPARATORS, IOS_BACKGROUNDS } from "@/constants/colors";

interface TableBlockProps extends BlockProps {
  renderBlocks: (blocks: NotionBlock[], context: BlockContext) => React.ReactNode;
}

const MIN_COLUMN_WIDTH = 80;
const MAX_COLUMN_WIDTH = 300;
const CELL_PADDING_H = 12;
const CELL_PADDING_V = 8;

export function TableBlock({ block, context }: TableBlockProps) {
  const { isDark, depth } = context;
  const { width: screenWidth } = useWindowDimensions();

  const tableData = block.table;
  const rows = block.children || [];

  const borderColor = isDark
    ? IOS_SEPARATORS.default.dark
    : IOS_SEPARATORS.default.light;
  const headerBgColor = isDark
    ? IOS_BACKGROUNDS.elevated.dark
    : IOS_BACKGROUNDS.grouped.light;
  const textColor = isDark ? "#FFFFFF" : "#000000";

  // Calculate column widths based on content
  const columnWidths = useMemo(() => {
    if (!tableData || rows.length === 0) return [];

    const columnCount = tableData.table_width;
    const widths: number[] = new Array(columnCount).fill(MIN_COLUMN_WIDTH);

    // Estimate width based on content length
    rows.forEach((row) => {
      const cells = row.table_row?.cells || [];
      cells.forEach((cell, colIndex) => {
        if (colIndex < columnCount) {
          const textLength = cell.map((item) => item.plain_text).join("").length;
          // Rough estimate: 8px per character + padding
          const estimatedWidth = Math.min(
            Math.max(textLength * 8 + CELL_PADDING_H * 2, MIN_COLUMN_WIDTH),
            MAX_COLUMN_WIDTH
          );
          widths[colIndex] = Math.max(widths[colIndex], estimatedWidth);
        }
      });
    });

    return widths;
  }, [tableData, rows]);

  const totalTableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
  const availableWidth = screenWidth - depth * 24 - 32; // Account for margins
  const needsScroll = totalTableWidth > availableWidth;

  if (!tableData || rows.length === 0) {
    return null;
  }

  const renderCell = (
    cell: RichTextItem[],
    colIndex: number,
    isHeader: boolean,
    isRowHeader: boolean
  ) => {
    const isHeaderCell = isHeader || isRowHeader;

    return (
      <View
        key={colIndex}
        style={{
          width: columnWidths[colIndex],
          paddingHorizontal: CELL_PADDING_H,
          paddingVertical: CELL_PADDING_V,
          borderRightWidth: colIndex < columnWidths.length - 1 ? 0.5 : 0,
          borderColor,
          backgroundColor: isHeaderCell ? headerBgColor : "transparent",
          justifyContent: "center",
        }}
      >
        <RichText
          richText={cell}
          style={{
            fontSize: 15,
            lineHeight: 20,
            color: textColor,
            fontWeight: isHeaderCell ? "600" : "400",
          }}
        />
      </View>
    );
  };

  const renderRow = (row: NotionBlock, rowIndex: number) => {
    const cells = row.table_row?.cells || [];
    const isHeaderRow = tableData.has_column_header && rowIndex === 0;
    const isLastRow = rowIndex === rows.length - 1;

    return (
      <View
        key={row.id}
        style={{
          flexDirection: "row",
          borderBottomWidth: isLastRow ? 0 : 0.5,
          borderColor,
        }}
      >
        {cells.map((cell, colIndex) =>
          renderCell(
            cell,
            colIndex,
            isHeaderRow,
            tableData.has_row_header && colIndex === 0
          )
        )}
      </View>
    );
  };

  const tableContent = (
    <View
      style={{
        borderWidth: 0.5,
        borderColor,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {rows.map((row, index) => renderRow(row, index))}
    </View>
  );

  return (
    <View style={{ marginBottom: 12, marginLeft: depth * 24 }}>
      {needsScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {tableContent}
        </ScrollView>
      ) : (
        tableContent
      )}
    </View>
  );
}
