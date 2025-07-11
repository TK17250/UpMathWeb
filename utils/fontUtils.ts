'use client';

// Function to convert font file to base64
export const loadFontAsBase64 = async (fontPath: string): Promise<string> => {
  try {
    const response = await fetch(fontPath);
    const arrayBuffer = await response.arrayBuffer();
    const base64String = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return base64String;
  } catch (error) {
    console.error('Error loading font:', error);
    throw error;
  }
};

// Font paths
export const FONT_PATHS = {
  regular: '/THSarabunNew/THSarabunNew.ttf',
  bold: '/THSarabunNew/THSarabunNew Bold.ttf',
  italic: '/THSarabunNew/THSarabunNew Italic.ttf',
  boldItalic: '/THSarabunNew/THSarabunNew BoldItalic.ttf'
};

// Cache for loaded fonts
const fontCache: { [key: string]: string } = {};

export const getCachedFont = async (fontType: keyof typeof FONT_PATHS): Promise<string> => {
  if (fontCache[fontType]) {
    return fontCache[fontType];
  }
  
  const fontBase64 = await loadFontAsBase64(FONT_PATHS[fontType]);
  fontCache[fontType] = fontBase64;
  return fontBase64;
};
