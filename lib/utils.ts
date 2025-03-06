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
    const version = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return version && version[1] ? `Firefox ${version[1]}` : 'Firefox';
  }
  
  // Check for Edge
  if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
    const version = userAgent.match(/Edg(?:e)?\/(\d+\.\d+)/);
    return version && version[1] ? `Edge ${version[1]}` : 'Edge';
  }
  
  // Check for Chrome
  if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium/') && !userAgent.includes('Edg/')) {
    const version = userAgent.match(/Chrome\/(\d+\.\d+)/);
    return version && version[1] ? `Chrome ${version[1]}` : 'Chrome';
  }
  
  // Check for Safari on iOS
  if ((userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) 
      && userAgent.includes('Safari/') && userAgent.includes('Version/')) {
    const version = userAgent.match(/Version\/(\d+\.\d+)/);
    return version && version[1] ? `Safari ${version[1]}` : 'Safari';
  }
  
  // Check for Safari on macOS
  if (userAgent.includes('Safari/') && userAgent.includes('Version/') && userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Version\/(\d+\.\d+)/);
    return version && version[1] ? `Safari ${version[1]}` : 'Safari';
  }
  
  // Check for Safari (generic)
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) {
    return 'Safari';
  }
  
  // Check for Opera
  if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    const version = userAgent.match(/OPR\/(\d+\.\d+)/);
    return version && version[1] ? `Opera ${version[1]}` : 'Opera';
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
  
  // Check for iOS devices first (iPhone, iPad, iPod)
  if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) {
    // Extract iOS version if available
    const iosVersionMatch = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
    if (iosVersionMatch && iosVersionMatch[1]) {
      const version = iosVersionMatch[1].replace(/_/g, '.');
      return `iOS ${version}`;
    }
    return 'iOS';
  }
  
  // Check for macOS
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    // Try to extract macOS version
    const macVersionMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    let macVersion = '';
    
    if (macVersionMatch && macVersionMatch[1]) {
      macVersion = macVersionMatch[1].replace(/_/g, '.');
      
      // Map version numbers to macOS names
      const macOSNames: Record<string, string> = {
        '10.15': 'Catalina',
        '11.0': 'Big Sur',
        '12.0': 'Monterey',
        '13.0': 'Ventura',
        '14.0': 'Sonoma',
        '15.0': 'Sequoia'
      };
      
      // Get the major and minor version
      const majorMinor = macVersion.split('.').slice(0, 2).join('.');
      const osName = macOSNames[majorMinor] || '';
      
      // Check if it's Apple Silicon - look for absence of "Intel" in newer Mac user agents
      const isAppleSilicon = !userAgent.includes('Intel');
      
      if (isAppleSilicon) {
        return osName ? `macOS ${osName} (Apple Silicon)` : `macOS ${macVersion} (Apple Silicon)`;
      } else {
        return osName ? `macOS ${osName}` : `macOS ${macVersion}`;
      }
    }
    
    // Check if it's Apple Silicon without version info
    if (!userAgent.includes('Intel')) {
      return 'macOS (Apple Silicon)';
    }
    
    return 'macOS';
  }
  
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
  
  // Check for Android
  if (userAgent.includes('Android')) {
    const version = userAgent.match(/Android (\d+(\.\d+)*)/);
    return version && version[1] ? `Android ${version[1]}` : 'Android';
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
  
  // Check for specific mobile devices
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('iPod')) return 'iPod';
  
  // Check for Android devices
  if (userAgent.includes('Android')) {
    // Look for specific Android device model in the user agent
    const deviceMatch = userAgent.match(/Android.*?;\s*([^;)]+)(?:[;)])/);
    if (deviceMatch && deviceMatch[1]) {
      const deviceName = deviceMatch[1].trim();
      // If it's a single letter like 'K', it's likely a placeholder or generic model
      if (deviceName.length <= 2) {
        return 'Android Phone';
      }
      return deviceName;
    }
    
    if (/Android.*?Tablet|Android.*?Tab/i.test(userAgent)) return 'Android Tablet';
    return 'Android Phone';
  }
  
  // Check for Mac
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
    // Check if it's Apple Silicon
    if (!userAgent.includes('Intel')) {
      return 'Mac (Apple Silicon)';
    }
    return 'Mac (Intel)';
  }
  
  // Check for Windows
  if (userAgent.includes('Windows')) {
    return 'PC';
  }
  
  // Check for Linux
  if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    return 'Linux PC';
  }
  
  // Default for other mobile devices
  if (isMobileDevice(userAgent)) {
    return 'Mobile Device';
  }
  
  // Default for other desktop devices
  return 'Desktop';
}
