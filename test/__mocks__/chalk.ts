interface ChalkColor {
  (text: string): string;
  red: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  white: (text: string) => string;
  gray: (text: string) => string;
  bgRed: (text: string) => string;
  bgGreen: (text: string) => string;
  bgYellow: (text: string) => string;
  bgBlue: (text: string) => string;
  bold: (text: string) => string;
  dim: (text: string) => string;
}

const colors = {
  red: (text: string) => text,
  green: (text: string) => text,
  yellow: (text: string) => text,
  blue: (text: string) => text,
  white: (text: string) => text,
  gray: (text: string) => text,
  bgRed: (text: string) => text,
  bgGreen: (text: string) => text,
  bgYellow: (text: string) => text,
  bgBlue: (text: string) => text,
  bold: (text: string) => text,
  dim: (text: string) => text
};

const mockChalk = ((text: string) => text) as ChalkColor;
Object.assign(mockChalk, colors);

export const {
  red, green, yellow, blue,
  white, gray,
  bgRed, bgGreen, bgYellow, bgBlue,
  bold, dim
} = mockChalk;

export default mockChalk;
