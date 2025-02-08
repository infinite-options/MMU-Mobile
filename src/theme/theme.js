export const colors = {
  primary: "#E4423F",
  secondary: "#1A1A1A",
  background: {
    primary: "#FFFFFF",
    secondary: "#F5F5F5",
    tertiary: "#F9F9F9",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    primary: "#000000",
    secondary: "#666666",
    tertiary: "#888888",
    light: "#FFFFFF",
    error: "#FF0000",
  },
  border: {
    light: "#EEEEEE",
    medium: "#DDDDDD",
    dark: "#CCCCCC",
  },
  status: {
    success: "#4CAF50",
    warning: "#FFC107",
    error: "#FF0000",
    info: "#2196F3",
  },
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "bold",
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold",
  },
  body1: {
    fontSize: 16,
  },
  body2: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
  },
};

export const shadows = {
  small: {
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
