/**
 * Platform detection utility for cross-platform compatibility
 * Provides detailed information about the current platform and device
 */

import { Platform, Dimensions } from "react-native";
import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

// Platform types
export type PlatformType = "ios" | "android" | "web" | "windows" | "macos";

// Device types
export type DeviceType = "phone" | "tablet" | "desktop";

// Screen size breakpoints
const BREAKPOINTS = {
  phone: 480,
  tablet: 1024,
};

/**
 * Get the current platform type
 * @returns The current platform type
 */
export function getPlatformType(): PlatformType {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") {
    // Detect specific web platforms
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/Windows/.test(userAgent)) return "windows";
    if (/Mac/.test(userAgent)) return "macos";
    return "web";
  }
  return "web"; // Default fallback
}

/**
 * Determine if the current platform is mobile
 * @returns True if the platform is iOS or Android
 */
export function isMobilePlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Determine if the current platform is web
 * @returns True if the platform is web
 */
export function isWebPlatform(): boolean {
  return Platform.OS === "web";
}

/**
 * Determine the device type based on screen dimensions
 * @returns The device type (phone, tablet, or desktop)
 */
export function getDeviceType(): DeviceType {
  const { width } = Dimensions.get("window");
  
  if (width < BREAKPOINTS.phone) return "phone";
  if (width < BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

/**
 * Hook that provides platform and device information
 * @returns Object containing platform and device information
 */
export function usePlatform() {
  const dimensions = useWindowDimensions();
  
  return useMemo(() => {
    const platformType = getPlatformType();
    const isMobile = isMobilePlatform();
    const isWeb = isWebPlatform();
    
    // Determine device type based on dimensions and platform
    let deviceType: DeviceType;
    if (isWeb) {
      deviceType = dimensions.width < BREAKPOINTS.phone 
        ? "phone" 
        : dimensions.width < BREAKPOINTS.tablet 
          ? "tablet" 
          : "desktop";
    } else {
      // For native platforms, use a simpler heuristic
      const { width, height } = dimensions;
      const aspectRatio = width / height;
      deviceType = Math.max(width, height) >= BREAKPOINTS.tablet || aspectRatio > 1.6 
        ? "tablet" 
        : "phone";
    }
    
    return {
      platformType,
      deviceType,
      isMobile,
      isWeb,
      isIOS: platformType === "ios",
      isAndroid: platformType === "android",
      isWindows: platformType === "windows",
      isMacOS: platformType === "macos",
      isPhone: deviceType === "phone",
      isTablet: deviceType === "tablet",
      isDesktop: deviceType === "desktop",
      dimensions,
    };
  }, [dimensions.width, dimensions.height]);
}

/**
 * Select a value based on the current platform
 * @param options Object containing platform-specific values
 * @param defaultValue Default value to use if no platform match is found
 * @returns The value for the current platform or the default value
 */
export function selectByPlatform<T>(
  options: Partial<Record<PlatformType, T>>,
  defaultValue: T
): T {
  const platform = getPlatformType();
  return options[platform] !== undefined ? options[platform]! : defaultValue;
}

/**
 * Select a value based on the current device type
 * @param options Object containing device-specific values
 * @param defaultValue Default value to use if no device match is found
 * @returns The value for the current device or the default value
 */
export function selectByDevice<T>(
  options: Partial<Record<DeviceType, T>>,
  defaultValue: T
): T {
  const device = getDeviceType();
  return options[device] !== undefined ? options[device]! : defaultValue;
}