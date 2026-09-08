import type { de } from './de';

// Typed against `de`'s shape: a missing/extra/mismatched key (including function
// signatures) is a compile error, so this is the entire schema check — no library.
export const en: typeof de = {
  nav: {
    overview: 'Overview',
    faq: 'FAQ',
  },
  common: {
    unknownError: 'Unknown error',
    fetchFailed: (status: number) => `server responded HTTP ${status}`,
    loading: 'Loading data …',
    loadFailed: (detail: string) => `Could not load data: ${detail}`,
    tokensLabel: 'tokens',
    scopeProviders: 'providers',
    scopeModels: 'models',
    total: 'Total',
    co2Column: 'CO₂ (estimated)',
    costColumn: 'Cost',
  },
  formats: {
    weekLabel: (week: number, year: number) => `W${week} ${year}`,
  },
  layout: {
    title: (company: string) => (company ? `${company} · Token & CO₂ Dashboard` : 'Token & CO₂ Dashboard'),
    description: (company: string) =>
      `Company-wide token and CO₂ consumption from AI agents${company ? ` at ${company}` : ''}.`,
    homeAriaLabel: 'Home',
    brandSub: 'Token & CO₂ Dashboard',
    navAriaLabel: 'Main navigation',
    footerProject: (buildDate: string) => `Agentic Economy and Ecology | ${buildDate} | `,
    footerCredit: 'A project by neuland - Büro für Informatik',
  },
  header: {
    defaultTitle: 'Usage overview',
    defaultLede: (company: string) =>
      `Company-wide token and CO₂ consumption from AI agents${company ? ` at ${company}` : ''}.`,
  },
  presets: {
    today: 'Today',
    weekToDate: 'This week',
    monthToDate: 'This month',
    yearToDate: 'This year',
    yesterday: 'Yesterday',
    prevWeek: 'Last week',
    prevBusinessWeek: 'Last business week',
    prevMonth: 'Last month',
    prevYear: 'Last year',
    last2: 'Last 2 days',
    last4: 'Last 4 days',
    last7: 'Last 7 days',
    last14: 'Last 14 days',
    last30: 'Last 30 days',
    allTime: 'All time',
  },
  presetGroups: {
    toDate: 'To date',
    prevPeriod: 'Previous period',
    rolling: 'Last days',
    misc: 'More',
  },
  views: {
    tokenType: 'Trend by token type',
    tokenTypeAll: 'Trend by token type (total)',
    model: 'Trend by model',
    co2: 'Trend by CO₂',
    cost: 'Trend by cost',
    installations: 'Trend by installations',
    tokensPerInstallation: 'Trend of tokens per installation',
  },
  viewToggleLabels: {
    tokenType: 'Token in/out',
    tokenTypeAll: 'Token total',
    model: 'Model breakdown',
    co2: 'CO₂',
    cost: 'Cost',
    installations: 'Installations',
    tokensPerInstallation: 'Avg tokens/installation',
  },
  tokenTypes: {
    input: 'Input tokens',
    output: 'Output tokens',
    cacheWrite: 'Cache write',
    cacheRead: 'Cache read',
  },
  dateRangePicker: {
    customRange: 'Custom date range',
    panelAriaLabel: 'Select time range',
    panelTitle: 'Select time range',
    closeAriaLabel: 'Close',
    customGroupTitle: 'Custom',
    fromLabel: 'From',
    toLabel: 'To',
    applyButton: 'Apply',
  },
  viewToggle: {
    ariaLabel: 'Select view',
  },
  providerFilter: {
    ariaLabel: 'Select providers',
  },
  kpiSummaryRow: {
    totalTokens: 'Total tokens',
    totalTokensSub: (scope: string) => `All ${scope}, excluding cache tokens`,
    totalCo2: 'Total CO₂',
    totalCo2Sub: 'Estimated from token usage',
    totalCost: 'Total cost',
    totalCostSub: (scope: string) => `All ${scope}, in US dollars`,
  },
  pluginPanel: {
    activeUsers: 'Active plugin users',
    activeUsersSub: 'Distinct users over the last 4 weeks',
    enableTracking: 'Enable tracking',
    trackingFallback: 'tracking plugin',
    descriptionPrefix: 'Usage is recorded via a',
    descriptionSuffix:
      "— only users with the plugin installed are included in the analysis, so the reported user count reflects active plugin installations for the selected period.",
  },
  emptyRangeNotice: {
    message: 'No data available yet for the selected period.',
  },
  installCommand: {
    installLabel: 'Install',
    uninstallLabel: 'Uninstall',
    copy: 'Copy',
    copied: 'Copied!',
  },
  forceDayToggle: {
    label: 'Always by day',
  },
  dashboard: {
    companyTotals: 'Company-wide totals',
    usageByProvider: 'Usage by provider',
  },
  providerDetail: {
    lede: 'Token and CO₂ consumption by model and token type.',
    backToOverview: 'Back to overview',
    notFound: 'No data available for this provider.',
    totals: 'Totals',
    pluginTracking: 'Plugin tracking',
    byTokenType: 'Breakdown by token type',
    byModel: 'Breakdown by model',
    modelColumn: 'Model',
  },
  providerComparison: {
    providerColumn: 'Provider',
    withoutCache: '(excluding cache tokens)',
    detailsLink: 'Details',
  },
  seriesBarChart: {
    installationsSuffix: 'installations',
    tokensPerInstallationSuffix: 'tokens/installation',
    inOutSuffix: ' (in+out)',
  },
  homeUsageSeriesChart: {
    providerHistoryLabel: 'Providers over time:',
  },
  usageBars: {
    co2: 'CO₂',
    cost: 'Cost',
    installations: 'Installations',
    tokensPerInstallation: 'Tokens/installation',
  },
  faqPage: {
    title: (company: string) => `FAQ · ${company ? `${company} ` : ''}Token Dashboard`,
    headerTitle: 'FAQ',
    headerLede: 'General notes and explanations on calculations, privacy, and usage.',
    tocAriaLabel: 'Contents',
  },
  providerPage: {
    title: (providerLabel: string, company: string) =>
      `${providerLabel} · ${company ? `${company} ` : ''}Token Dashboard`,
  },
  faqAsterisk: {
    explanation: 'explanation in the FAQ',
    tokens: {
      id: 'total-tokens',
      q: 'Why don’t total tokens count cache tokens?',
      aria: 'Explanation of total tokens (FAQ page)',
    },
    co2: {
      id: 'co2-calculation',
      q: 'How is the CO₂ value calculated?',
      aria: 'Explanation of the CO₂ calculation (FAQ page)',
    },
    cost: {
      id: 'cost-calculation',
      q: 'How is the cost calculated?',
      aria: 'Explanation of the cost calculation (FAQ page)',
    },
    claude: {
      id: 'provider-coverage',
      q: 'Which providers are shown?',
      aria: 'Explanation of provider coverage (FAQ page)',
    },
    privacy: {
      id: 'user-data',
      q: 'What user data is collected?',
      aria: 'Privacy note on the user count (FAQ page)',
    },
  },
};
