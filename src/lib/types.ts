// Domain types for the company-wide token & CO₂ dashboard, plus the labels and
// colours every chart and table renders providers and token types with.

import type { Locale } from '~/i18n';

export type TokenType = 'input' | 'output' | 'cacheWrite' | 'cacheRead';

export type Provider = 'claude' | 'copilot' | 'opencode';

export type TokenCounts = Record<TokenType, number>;

export interface ModelUsage {
  model: string;
  tokens: TokenCounts;
  tokensTotal: number;
  estimatedCo2: number;
  costUsdCent: number;
}

/** A model family (e.g. "sonnet"), its individual models ("sonnet-4.6", "sonnet-5") and their totals. */
export interface ModelFamilyUsage {
  modelFamily: string;
  models: ModelUsage[];
  tokens: TokenCounts;
  tokensTotal: number;
  estimatedCo2: number;
  costUsdCent: number;
}

export interface ProviderUsage {
  provider: Provider;
  modelFamilies: ModelFamilyUsage[];
  overallTokens: TokenCounts;
  overallTokensTotal: number;
  tokensInOut: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
  activeUsers: number;
}

export interface UsageSnapshot {
  from: string;
  to: string;
  providers: ProviderUsage[];
}

export interface ProviderOverview {
  provider: Provider;
  tokensInOut: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
}

export interface UsageOverview {
  from: string;
  to: string;
  providerUsages: Partial<Record<Provider, ProviderOverview>>;
  tokensInOut: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
}

export type SeriesGranularity = 'day' | 'week';

export interface ProviderBucketStats {
  tokens: TokenCounts;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
  pluginInstallations: number;
}

export interface SeriesBucket {
  // Bucket start and end, both ISO YYYY-MM-DD and inclusive. For "day" they are equal;
  // for "week" they are clamped to the requested range, so edge weeks can be partial.
  date: string;
  periodEnd: string;
  modelFamilies: ModelFamilyUsage[];
  overallTokens: TokenCounts;
  overallTokensTotal: number;
  totalEstimatedCo2: number;
  totalCostUsdCent: number;
  pluginInstallations: number;
  /** Only populated by `fetchAllUsageSeries`: per-provider values for the home page chart. */
  byProvider?: Partial<Record<Provider, ProviderBucketStats>>;
}

export interface ProviderUsageSeries {
  from: string;
  to: string;
  buckets: SeriesBucket[]; // ascending by date, periods without data filled with zeros
}

export const TOKEN_TYPES: TokenType[] = ['input', 'output', 'cacheWrite', 'cacheRead'];

export const PROVIDERS: Provider[] = ['claude', 'copilot', 'opencode'];

export function usdCentToUsd(cent: number): number {
  return cent / 100;
}

export const TOKEN_TYPE_LABELS: Record<Locale, Record<TokenType, string>> = {
  de: {
    input: 'In-Tokens',
    output: 'Out-Tokens',
    cacheWrite: 'Cache-Write',
    cacheRead: 'Cache-Read',
  },
  en: {
    input: 'Input tokens',
    output: 'Output tokens',
    cacheWrite: 'Cache write',
    cacheRead: 'Cache read',
  },
};

export const PROVIDER_LABELS: Record<Locale, Record<Provider, string>> = {
  de: {
    claude: 'Claude',
    copilot: 'Copilot',
    opencode: 'OpenCode',
  },
  en: {
    claude: 'Claude',
    copilot: 'Copilot',
    opencode: 'OpenCode',
  },
};

export const PROVIDER_SHORT_LABELS: Record<Locale, Record<Provider, string>> = {
  de: {
    claude: 'Claude',
    copilot: 'Copilot',
    opencode: 'OpenCode',
  },
  en: {
    claude: 'Claude',
    copilot: 'Copilot',
    opencode: 'OpenCode',
  },
};

export const TOKEN_TYPE_COLORS: Record<TokenType, string> = {
  input: '#FF5A55',
  output: '#FFACAA',
  cacheWrite: '#0EA19C',
  cacheRead: '#B7DCE1',
};

export const PROVIDER_COLORS: Record<Provider, string> = {
  claude: '#FF5A55',
  copilot: '#77C4B4',
  opencode: '#0EA19C',
};
