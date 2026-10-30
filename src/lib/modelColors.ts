import type { ModelFamilyUsage } from './types';

/**
 * Colours for model families, cycled by rank, since how many families the backend
 * reports is not known up front. Shared by the history chart's `model` view and the model
 * table, so a family has the same colour in both.
 */
export const MODEL_COLORS = [
  '#FF5A55',
  '#0EA19C',
  '#77C4B4',
  '#857871',
  '#FFACAA',
  '#B7DCE1',
  '#FF9A3C',
  '#E54D4D',
];

/** Colour for each family, by its position in `families` (ranked as the chart ranks them). */
export function modelFamilyColors(families: string[]): Record<string, string> {
  return Object.fromEntries(families.map((family, i) => [family, MODEL_COLORS[i % MODEL_COLORS.length]]));
}

/**
 * The chart's ranking — in + out tokens, largest first — computed from period totals
 * instead of a series. Same order as `sortedModelFamilies` for the same range.
 */
export function rankFamiliesByInOut(families: ModelFamilyUsage[]): string[] {
  return [...families]
    .sort((a, b) => b.tokens.input + b.tokens.output - (a.tokens.input + a.tokens.output))
    .map((f) => f.modelFamily);
}

/** A model version's bar: its family's colour, lightened so the nesting stays visible. */
export function versionColor(familyColor: string): string {
  return `color-mix(in srgb, ${familyColor} 45%, white)`;
}
