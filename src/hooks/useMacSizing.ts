import { isMacCatalyst } from "./usePlatform";

export interface MacSizing {
  fontSize: {
    largeTitle: number;   // iOS: 28 -> Mac: 21
    title: number;        // iOS: 22 -> Mac: 17
    body: number;         // iOS: 17 -> Mac: 13
    secondary: number;    // iOS: 15 -> Mac: 11
    caption: number;      // iOS: 13 -> Mac: 10
  };
  spacing: {
    rowPaddingVertical: number;   // iOS: 12 -> Mac: 8
    rowPaddingHorizontal: number; // iOS: 16 -> Mac: 12
    sectionMargin: number;        // iOS: 24 -> Mac: 16
  };
  minHeight: {
    row: number;          // iOS: 44 -> Mac: 28
    floatingElement: number; // iOS: 48 -> Mac: 36
  };
  iconSize: {
    small: number;        // iOS: 12-14 -> Mac: 10-12
    medium: number;       // iOS: 20 -> Mac: 16
    large: number;        // iOS: 22-24 -> Mac: 18-20
  };
  isMac: boolean;
}

export function useMacSizing(): MacSizing {
  const isMac = isMacCatalyst;

  if (isMac) {
    return {
      fontSize: {
        largeTitle: 21,
        title: 17,
        body: 13,
        secondary: 11,
        caption: 10,
      },
      spacing: {
        rowPaddingVertical: 8,
        rowPaddingHorizontal: 12,
        sectionMargin: 16,
      },
      minHeight: {
        row: 28,
        floatingElement: 36,
      },
      iconSize: {
        small: 11,
        medium: 16,
        large: 19,
      },
      isMac: true,
    };
  }

  // iOS/iPad defaults
  return {
    fontSize: {
      largeTitle: 28,
      title: 22,
      body: 17,
      secondary: 15,
      caption: 13,
    },
    spacing: {
      rowPaddingVertical: 12,
      rowPaddingHorizontal: 16,
      sectionMargin: 24,
    },
    minHeight: {
      row: 44,
      floatingElement: 48,
    },
    iconSize: {
      small: 13,
      medium: 20,
      large: 22,
    },
    isMac: false,
  };
}
