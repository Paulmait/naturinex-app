// Comprehensive Responsive Design System
// Ensures perfect display across all devices and screen sizes
import { Dimensions, Platform, PixelRatio } from 'react-native';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Device detection
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isWeb = Platform.OS === 'web';
// Screen size categories
const isSmallDevice = screenWidth < 375;
const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
const isLargeDevice = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isDesktop = screenWidth >= 1024;
// Responsive scaling functions
const scale = (size) => {
  const baseWidth = 375; // iPhone 11 Pro
  const scaleFactor = screenWidth / baseWidth;
  const newSize = size * scaleFactor;
  if (isSmallDevice) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 0.95));
  } else if (isTablet) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 1.2));
  } else if (isDesktop) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 1.3));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
const verticalScale = (size) => {
  const baseHeight = 812; // iPhone 11 Pro
  const scaleFactor = screenHeight / baseHeight;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};
// Font scaling with accessibility support
const scaleFontSize = (size) => {
  const fontScale = PixelRatio.getFontScale();
  const scaledSize = size * fontScale;
  // Limit maximum font scaling for layout consistency
  const maxScale = 1.3;
  return Math.min(scaledSize, size * maxScale);
};
// Responsive styles for all components
const ResponsiveStyles = {
  // Container styles
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
    paddingTop: isIOS ? verticalScale(44) : verticalScale(24),
    paddingBottom: isIOS && screenHeight >= 812 ? verticalScale(34) : 0,
  },
  // Typography
  text: {
    h1: {
      fontSize: scaleFontSize(isDesktop ? 36 : isTablet ? 32 : 28),
      fontWeight: 'bold',
      lineHeight: scaleFontSize(isDesktop ? 44 : isTablet ? 40 : 36),
      marginBottom: verticalScale(16),
    },
    h2: {
      fontSize: scaleFontSize(isDesktop ? 28 : isTablet ? 26 : 24),
      fontWeight: '600',
      lineHeight: scaleFontSize(isDesktop ? 36 : isTablet ? 32 : 30),
      marginBottom: verticalScale(12),
    },
    h3: {
      fontSize: scaleFontSize(isDesktop ? 22 : isTablet ? 20 : 18),
      fontWeight: '600',
      lineHeight: scaleFontSize(isDesktop ? 28 : isTablet ? 26 : 24),
      marginBottom: verticalScale(8),
    },
    body: {
      fontSize: scaleFontSize(isDesktop ? 16 : isTablet ? 15 : 14),
      lineHeight: scaleFontSize(isDesktop ? 24 : isTablet ? 22 : 20),
      color: '#333333',
    },
    caption: {
      fontSize: scaleFontSize(isDesktop ? 14 : isTablet ? 13 : 12),
      lineHeight: scaleFontSize(isDesktop ? 20 : isTablet ? 18 : 16),
      color: '#666666',
    },
  },
  // Buttons
  button: {
    primary: {
      backgroundColor: '#10B981',
      paddingVertical: verticalScale(isDesktop ? 14 : isTablet ? 12 : 10),
      paddingHorizontal: scale(isDesktop ? 24 : isTablet ? 20 : 16),
      borderRadius: scale(8),
      minHeight: verticalScale(isDesktop ? 48 : isTablet ? 44 : 40),
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#10B981',
      paddingVertical: verticalScale(isDesktop ? 14 : isTablet ? 12 : 10),
      paddingHorizontal: scale(isDesktop ? 24 : isTablet ? 20 : 16),
      borderRadius: scale(8),
    },
    text: {
      fontSize: scaleFontSize(isDesktop ? 16 : isTablet ? 15 : 14),
      fontWeight: '600',
      color: '#ffffff',
    },
  },
  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: scale(12),
    padding: scale(isDesktop ? 20 : isTablet ? 18 : 16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  // Grid layouts
  grid: {
    columns: isDesktop ? 3 : isTablet ? 2 : 1,
    gap: scale(isDesktop ? 24 : isTablet ? 20 : 16),
  },
  // Forms
  input: {
    container: {
      marginBottom: verticalScale(16),
    },
    field: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: scale(8),
      paddingVertical: verticalScale(isDesktop ? 12 : isTablet ? 10 : 8),
      paddingHorizontal: scale(12),
      fontSize: scaleFontSize(isDesktop ? 16 : isTablet ? 15 : 14),
      minHeight: verticalScale(isDesktop ? 48 : isTablet ? 44 : 40),
    },
    label: {
      fontSize: scaleFontSize(isDesktop ? 14 : isTablet ? 13 : 12),
      marginBottom: verticalScale(4),
      color: '#555555',
      fontWeight: '500',
    },
  },
  // Navigation
  navigation: {
    header: {
      height: verticalScale(isDesktop ? 64 : isTablet ? 60 : 56),
      paddingHorizontal: scale(16),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#10B981',
    },
    tabBar: {
      height: verticalScale(isIOS ? 83 : 56),
      paddingBottom: isIOS && screenHeight >= 812 ? verticalScale(20) : 0,
    },
  },
  // Modals
  modal: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: scale(20),
    },
    content: {
      backgroundColor: '#ffffff',
      borderRadius: scale(16),
      padding: scale(isDesktop ? 32 : isTablet ? 24 : 20),
      width: isDesktop ? '50%' : isTablet ? '70%' : '90%',
      maxWidth: scale(480),
      maxHeight: screenHeight * 0.8,
    },
  },
  // Lists
  list: {
    item: {
      paddingVertical: verticalScale(isDesktop ? 16 : isTablet ? 14 : 12),
      paddingHorizontal: scale(16),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    separator: {
      height: verticalScale(1),
      backgroundColor: '#f0f0f0',
    },
  },
  // Images
  image: {
    thumbnail: {
      width: scale(isDesktop ? 80 : isTablet ? 72 : 64),
      height: scale(isDesktop ? 80 : isTablet ? 72 : 64),
      borderRadius: scale(8),
    },
    avatar: {
      width: scale(isDesktop ? 48 : isTablet ? 44 : 40),
      height: scale(isDesktop ? 48 : isTablet ? 44 : 40),
      borderRadius: scale(isDesktop ? 24 : isTablet ? 22 : 20),
    },
    hero: {
      width: '100%',
      height: verticalScale(isDesktop ? 400 : isTablet ? 300 : 200),
      resizeMode: 'cover',
    },
  },
  // Spacing
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  },
  // Breakpoints for web
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1440,
  },
};
// Platform-specific adjustments
const platformStyles = {
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
  web: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },
};
// Get platform-specific style
const getPlatformStyle = () => {
  if (isIOS) return platformStyles.ios;
  if (isAndroid) return platformStyles.android;
  return platformStyles.web;
};
// Responsive component wrapper
const ResponsiveView = ({ children, style, ...props }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  return (
    <View style={[ResponsiveStyles.container, style]} {...props}>
      {children}
    </View>
  );
};
export {
  ResponsiveStyles,
  scale,
  verticalScale,
  moderateScale,
  scaleFontSize,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isDesktop,
  isIOS,
  isAndroid,
  isWeb,
  getPlatformStyle,
  ResponsiveView,
  screenWidth,
  screenHeight,
};
export default ResponsiveStyles;