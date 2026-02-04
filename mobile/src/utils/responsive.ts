import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const baseWidth = 375;
const baseHeight = 812;

export const wp = (percentage: number) => (SCREEN_WIDTH * percentage) / 100;

export const hp = (percentage: number) => (SCREEN_HEIGHT * percentage) / 100;

export const responsiveWidth = (size: number) =>
  Math.min(size, (SCREEN_WIDTH * size) / baseWidth);

export const responsiveHeight = (size: number) =>
  Math.min(size, (SCREEN_HEIGHT * size) / baseHeight);

export const responsiveFontSize = (size: number) => {
  const scale = Math.min(SCREEN_WIDTH / baseWidth, SCREEN_HEIGHT / baseHeight);
  const adjustedSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(adjustedSize));
};

export const scale = (size: number) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / baseWidth, SCREEN_HEIGHT / baseHeight);
  return size * scaleFactor;
};

export const verticalScale = (size: number) => {
  const verticalScaleFactor = SCREEN_HEIGHT / baseHeight;
  return size * verticalScaleFactor;
};

export const moderateScale = (size: number, factor: number = 0.5) => {
  return size + (responsiveFontSize(size) - size) * factor;
};

export const isSmallScreen = SCREEN_HEIGHT < 700;
export const isMediumScreen = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;
export const isLargeScreen = SCREEN_HEIGHT >= 800;

export const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;

export const isTablet = SCREEN_WIDTH >= 768;

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

export const statusBarHeight = Platform.OS === "ios" ? 44 : Platform.Version as number >= 30 ? 48 : 24;

export const bottomTabHeight = Platform.OS === "ios" ? 88 : 60;

export const responsivePadding = {
  small: responsiveWidth(12),
  medium: responsiveWidth(16),
  large: responsiveWidth(24),
  xlarge: responsiveWidth(32),
};

export const responsiveMargin = {
  small: responsiveWidth(8),
  medium: responsiveWidth(16),
  large: responsiveWidth(24),
  xlarge: responsiveWidth(32),
};

export const getResponsiveSize = {
  iconSmall: responsiveWidth(20),
  iconMedium: responsiveWidth(24),
  iconLarge: responsiveWidth(32),
  iconXLarge: responsiveWidth(40),

  buttonHeight: responsiveHeight(48),
  inputHeight: responsiveHeight(52),

  cardPadding: responsiveWidth(16),
  cardBorderRadius: responsiveWidth(16),

  avatarSmall: responsiveWidth(36),
  avatarMedium: responsiveWidth(48),
  avatarLarge: responsiveWidth(64),
};
