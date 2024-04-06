import { theme } from 'unocss/preset-mini';

import type { HexColor, Lab, RGB, sRGB } from '../types/Color';
import { isHexColor } from '../types/Color';
import type { CourseColors, TWColorway, TWIndex } from '../types/ThemeColors';
import { colorwayIndexes } from '../types/ThemeColors';

/**
 * Converts a hexadecimal color value to RGB format. (adapted from https://stackoverflow.com/a/5624139/8022866)
 *
 * @param hex - The hexadecimal color value.
 * @returns An array containing the RGB values.
 */
export function hexToRGB(hex: HexColor): RGB | undefined {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const parsedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(parsedHex);

  if (!result || !(result.length > 3)) return undefined;

  return [parseInt(result[1]!, 16), parseInt(result[2]!, 16), parseInt(result[3]!, 16)];
}

export const useableColorways = Object.keys(theme.colors)
  // check that the color is a colorway (is an object)
  .filter(color => typeof theme.colors[color as keyof typeof theme.colors] === 'object')
  .slice(0, 17) as TWColorway[];

/**
 * Generate a Tailwind classname for the font color based on the background color
 * @param bgColor the hex color of the background
 */
export function pickFontColor(bgColor: HexColor): 'text-white' | 'text-black' | 'text-theme-black' {
  const coefficients = [0.2126729, 0.7151522, 0.072175] as const;

  const flipYs = 0.342; // based on APCA™ 0.98G middle contrast BG color

  const trc = 2.4; // 2.4 exponent for emulating actual monitor perception
  const rgb = hexToRGB(bgColor);
  if (!rgb) throw new Error('bgColor: Invalid hex.');

  // coefficients and rgb are both 3 elements long, so this is safe
  let Ys = rgb.reduce((acc, c, i) => acc + (c / 255.0) ** trc * coefficients[i]!, 0);

  if (Ys < flipYs) {
    return 'text-white';
  }

  return Ys < 0.365 ? 'text-black' : 'text-theme-black';
}

/**
 * Get primary and secondary colors from a Tailwind colorway
 * @param colorway the Tailwind colorway ex. "emerald"
 */
export function getCourseColors(colorway: TWColorway, index?: number, offset: number = 300): CourseColors {
  if (index === undefined) {
    // eslint-disable-next-line no-param-reassign
    index = colorway in colorwayIndexes ? colorwayIndexes[colorway as keyof typeof colorwayIndexes] : 500;
  }

  return {
    primaryColor: theme.colors[colorway][index as TWIndex] as HexColor,
    secondaryColor: theme.colors[colorway][(index + offset) as TWIndex] as HexColor,
  };
}

/**
 * Get the Tailwind colorway from a given color.
 *
 * @param color - The hexadecimal color value.
 * @returns The Tailwind colorway.
 */
export function getColorwayFromColor(color: HexColor): TWColorway {
  for (const colorway of useableColorways) {
    if (Object.values(theme.colors[colorway]).includes(color)) {
      return colorway as TWColorway;
    }
  }

  // not a direct match, get the closest color
  let closestColor = '';
  let closestDistance = Infinity;

  for (const colorway of useableColorways) {
    for (const [shade, shadeColor] of Object.entries(theme.colors[colorway])) {
      // type guard
      if (!isHexColor(shadeColor)) {
        continue;
      }

      const shadeColorRGB = hexToRGB(shadeColor);
      if (!shadeColorRGB) {
        continue;
      }

      const distance = oklabDistance(rgbToOKlab(shadeColorRGB), rgbToOKlab(shadeColorRGB));
      if (distance < closestDistance) {
        closestDistance = distance;
        closestColor = shade;
      }
    }
  }

  // type guard
  if (!isHexColor(closestColor)) {
    throw new Error("closestColor isn't a valid hex color");
  }

  return getColorwayFromColor(closestColor);
}

// OKLab helper functions (https://github.com/bottosson/bottosson.github.io/blob/master/misc/colorpicker/colorconversion.js)
function srgbTransferFunction(a: number): number {
  return a <= 0.0031308 ? 12.92 * a : 1.055 * a ** 0.4166666666666667 - 0.055;
}

function srgbTransferFunctionInv(a: number): number {
  return a > 0.04045 ? ((a + 0.055) / 1.055) ** 2.4 : a / 12.92;
}

function rgbToSrgb(rgb: RGB): sRGB {
  return rgb.map(c => srgbTransferFunctionInv(c / 255)) as sRGB;
}

/**
 * Convert an RGB color to the OKLab color space
 * @param rgb the RGB color
 * @returns the color in the OKLab color space
 */
function srgbToOKlab([r, g, b]: sRGB): Lab {
  let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  let lc = Math.cbrt(l);
  let mc = Math.cbrt(m);
  let sc = Math.cbrt(s);

  return [
    0.2104542553 * lc + 0.793617785 * mc - 0.0040720468 * sc,
    1.9779984951 * lc - 2.428592205 * mc + 0.4505937099 * sc,
    0.0259040371 * lc + 0.7827717662 * mc - 0.808675766 * sc,
  ];
}

function rgbToOKlab(rgb: RGB): Lab {
  return srgbToOKlab(rgbToSrgb(rgb));
}

/**
 * Calculate the distance between two colors in the OKLab color space
 */
function oklabDistance([l1, a1, b1]: Lab, [l2, a2, b2]: Lab): number {
  return Math.sqrt((l2 - l1) ** 2 + (a2 - a1) ** 2 + (b2 - b1) ** 2);
}
