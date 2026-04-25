export const T = {
  orange: "#D4622A",
  orangeLight: "#E8834F",
  orangeDark: "#B04A1A",
  navy: "#2C3E5C",
  navyLight: "#3D5278",
  navyDark: "#1A2840",
  cream: "#F5F0E8",
  creamDark: "#EDE5D4",
  white: "#FDFBF7",
  text: "#1A2030",
  textMid: "#4A5568",
  textLight: "#8A95A3",
  success: "#2D7A4F",
  successLight: "#7FD4A8",
  warning: "#C47A00",
  warningLight: "#F7C96A",
  danger: "#C0392B",
  dangerLight: "#F08080",
  border: "#D8CEBC",
  borderLight: "#EDE5D4",
} as const;

export type ThemeColor = keyof typeof T;
