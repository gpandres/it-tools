/**
 * Shared utility functions for Encoding, Decoding, and Text Transformation.
 * Extracted to ensure zero duplication between existing Blue Team tools and new Red Team tools.
 */

export const Transformers = {
  // --- BASE64 ---
  base64Encode: (input: string): string => {
    try {
      // Using btoa, but supporting UTF-8 by escaping first
      return btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
      return "Error: Invalid input for Base64 encoding.";
    }
  },
  
  base64Decode: (input: string): string => {
    try {
      return decodeURIComponent(escape(atob(input)));
    } catch (e) {
      return "Error: Invalid Base64 input.";
    }
  },

  // --- URL ---
  urlEncode: (input: string): string => {
    return encodeURIComponent(input);
  },

  urlDecode: (input: string): string => {
    try {
      return decodeURIComponent(input);
    } catch (e) {
      return "Error: Invalid URL encoded string.";
    }
  },

  // --- HTML ENTITIES ---
  htmlEncode: (input: string): string => {
    return input.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
      return '&#'+i.charCodeAt(0)+';';
    });
  },

  htmlDecode: (input: string): string => {
    try {
      const doc = new DOMParser().parseFromString(input, "text/html");
      return doc.documentElement.textContent || "";
    } catch (e) {
      return input; // Fallback for non-browser environments if needed
    }
  },

  // --- HEX ---
  hexEncode: (input: string): string => {
    return Array.from(input)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  },

  hexDecode: (input: string): string => {
    try {
      const hexes = input.match(/.{1,2}/g) || [];
      return hexes.map(h => String.fromCharCode(parseInt(h, 16))).join('');
    } catch (e) {
      return "Error: Invalid Hex string.";
    }
  },

  // --- UNICODE ESCAPE ---
  unicodeEncode: (input: string): string => {
    return Array.from(input)
      .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
      .join('');
  },
  
  unicodeDecode: (input: string): string => {
    try {
      return input.replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      });
    } catch (e) {
      return "Error: Invalid Unicode escape sequence.";
    }
  },
};
