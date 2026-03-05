// Text formatting utilities
export const formatText = {
  // Capitalize first letter
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Convert to title case
  titleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  // Convert to kebab-case
  kebabCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  // Convert to snake_case
  snakeCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  },

  // Convert to camelCase
  camelCase: (text: string): string => {
    return text
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^(.)/, (char) => char.toLowerCase());
  },

  // Truncate text
  truncate: (text: string, length: number, suffix: string = '...'): string => {
    if (text.length <= length) return text;
    return text.slice(0, length) + suffix;
  },

  // Remove extra spaces
  removeExtraSpaces: (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
  },

  // Remove special characters
  removeSpecialChars: (text: string, keepSpaces: boolean = true): string => {
    const regex = keepSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
    return text.replace(regex, '');
  },

  // Extract numbers from text
  extractNumbers: (text: string): number[] => {
    const matches = text.match(/-?\d+(\.\d+)?/g);
    return matches ? matches.map(Number) : [];
  },

  // Mask email
  maskEmail: (email: string): string => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.slice(-1);
    return `${maskedUsername}@${domain}`;
  },

  // Mask phone number
  maskPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return cleaned.slice(0, -4).replace(/\d/g, '*') + cleaned.slice(-4);
  },

  // Slugify text
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

// Number formatting
export const formatNumber = {
  // Add commas to number
  withCommas: (num: number): string => {
    return num.toLocaleString();
  },

  // Format currency
  currency: (num: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(num);
  },

  // Format percentage
  percentage: (num: number, decimals: number = 2): string => {
    return `${num.toFixed(decimals)}%`;
  },

  // Format decimal
  decimal: (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  },

  // Abbreviate large numbers
  abbreviate: (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
  },

  // Pad number with zeros
  pad: (num: number, length: number): string => {
    return num.toString().padStart(length, '0');
  },

  // Random number between range
  random: (min: number, max: number, decimals: number = 0): number => {
    const num = Math.random() * (max - min) + min;
    return Number(num.toFixed(decimals));
  },

  // Clamp number between range
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },
};

// Date formatting
export const formatDate = {
  // Format to local date string
  local: (date: Date | string): string => {
    return new Date(date).toLocaleDateString();
  },

  // Format to local time string
  time: (date: Date | string): string => {
    return new Date(date).toLocaleTimeString();
  },

  // Format to local date and time
  datetime: (date: Date | string): string => {
    return new Date(date).toLocaleString();
  },

  // Format to ISO string
  iso: (date: Date | string): string => {
    return new Date(date).toISOString();
  },

  // Format to custom format
  custom: (date: Date | string, format: string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // Get time ago
  ago: (date: Date | string): string => {
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  },

  formatDuration: (ms: number): string => {
    if (!Number.isFinite(ms) || ms < 0) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;

    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  },

  // Check if date is today
  isToday: (date: Date | string): boolean => {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  },

  // Check if date is yesterday
  isYesterday: (date: Date | string): boolean => {
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  },

  // Get start of day
  startOfDay: (date: Date | string): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  // Get end of day
  endOfDay: (date: Date | string): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },
};

// Array formatting
export const formatArray = {
  // Join array with comma and "and"
  joinWithAnd: (arr: string[]): string => {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
  },

  // Get unique items
  unique: <T>(arr: T[]): T[] => {
    return Array.from(new Set(arr));
  },

  // Shuffle array
  shuffle: <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Chunk array
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  // Group by key
  groupBy: <T, K extends PropertyKey>(arr: T[], key: (item: T) => K): Record<K, T[]> => {
    return arr.reduce((groups, item) => {
      const group = key(item);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  // Sort by key
  sortBy: <T, K extends keyof T>(arr: T[], key: K, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...arr].sort((a, b) => {
      if (order === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      } else {
        return a[key] < b[key] ? 1 : -1;
      }
    });
  },
};

// Color formatting
export const formatColor = {
  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  },

  // Convert RGB to hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // Generate random color
  random: (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  // Lighten color
  lighten: (hex: string, amount: number): string => {
    const { r, g, b } = formatColor.hexToRgb(hex);
    return formatColor.rgbToHex(
      Math.min(255, Math.floor(r + (255 - r) * amount)),
      Math.min(255, Math.floor(g + (255 - g) * amount)),
      Math.min(255, Math.floor(b + (255 - b) * amount))
    );
  },

  // Darken color
  darken: (hex: string, amount: number): string => {
    const { r, g, b } = formatColor.hexToRgb(hex);
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    return formatColor.rgbToHex(
      clamp(r - amount),
      clamp(g - amount),
      clamp(b - amount)
    );
  },
};