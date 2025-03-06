import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the browser name from a user agent string
 */
export function getBrowserNameFromUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Check for Firefox
  if (userAgent.includes('Firefox/')) {
    return 'Firefox';
  }
  
  // Check for Edge
  if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
    return 'Edge';
  }
  
  // Check for Chrome
  if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) {
    return 'Chrome';
  }
  
  // Check for Safari
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) {
    return 'Safari';
  }
  
  // Check for Opera
  if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    return 'Opera';
  }
  
  // Check for IE
  if (userAgent.includes('Trident/') || userAgent.includes('MSIE ')) {
    return 'Internet Explorer';
  }
  
  // Default case
  return 'Browser';
}

/**
 * Extracts the operating system from a user agent string
 */
export function getOSFromUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Check for Windows
  if (userAgent.includes('Windows NT')) {
    const version = userAgent.match(/Windows NT (\d+\.\d+)/);
    const versionMap: Record<string, string> = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.2': 'XP',
      '5.1': 'XP',
      '5.0': '2000'
    };
    return `Windows ${version && version[1] ? versionMap[version[1]] || version[1] : ''}`;
  }
  
  // Check for macOS
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    return 'macOS';
  }
  
  // Check for iOS
  if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) {
    return 'iOS';
  }
  
  // Check for Android
  if (userAgent.includes('Android')) {
    return 'Android';
  }
  
  // Check for Linux
  if (userAgent.includes('Linux')) {
    return 'Linux';
  }
  
  // Default case
  return 'Unknown OS';
}

/**
 * Determines if the device is mobile based on user agent
 */
export function isMobileDevice(userAgent: string): boolean {
  if (!userAgent) return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Gets a friendly device type name
 */
export function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  if (isMobileDevice(userAgent)) {
    if (userAgent.includes('iPad')) return 'Tablet';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) {
      if (/Android.*?Tablet|Android.*?Tab/i.test(userAgent)) return 'Tablet';
      return 'Android Phone';
    }
    return 'Mobile';
  }
  
  return 'Desktop';
}
