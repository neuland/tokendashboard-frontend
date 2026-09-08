// Canonical (German) UI dictionary. `en.ts` is typed against this shape, so a
// missing/extra/mismatched key (including function signatures) is a compile error.

export const de = {
  nav: {
    overview: 'Übersicht',
    faq: 'FAQ',
  },
  common: {
    unknownError: 'Unbekannter Fehler',
    fetchFailed: (status: number): string => `Serverantwort HTTP ${status}`,
    loading: 'Daten werden geladen …',
    loadFailed: (detail: string): string => `Daten konnten nicht geladen werden: ${detail}`,
    tokensLabel: 'Tokens',
    scopeProviders: 'Provider',
    scopeModels: 'Modelle',
    total: 'Gesamt',
    co2Column: 'CO₂ (geschätzt)',
    costColumn: 'Kosten',
  },
  formats: {
    weekLabel: (week: number, year: number): string => `KW${week} ${year}`,
  },
  layout: {
    // `company` may be empty (PUBLIC_COMPANY_NAME unset); every template has to read
    // cleanly without it — no dangling separators or prepositions.
    title: (company: string): string => (company ? `${company} · Token- & CO₂-Dashboard` : 'Token- & CO₂-Dashboard'),
    description: (company: string): string =>
      `Firmenweiter Token- und CO₂-Verbrauch durch AI-Agents${company ? ` bei ${company}` : ''}.`,
    homeAriaLabel: 'Startseite',
    brandSub: 'Token- & CO₂-Dashboard',
    navAriaLabel: 'Hauptnavigation',
    footerProject: (buildDate: string): string => `Agentic - Ökonomie und Ökologie | ${buildDate} | `,
    footerCredit: 'Ein Projekt von neuland - Büro für Informatik',
  },
  header: {
    defaultTitle: 'Verbrauchsübersicht',
    defaultLede: (company: string): string =>
      `Firmenweiter Token- und CO₂-Verbrauch durch AI-Agents${company ? ` bei ${company}` : ''}.`,
  },
  presets: {
    today: 'Heute',
    weekToDate: 'Diese Woche',
    monthToDate: 'Dieser Monat',
    yearToDate: 'Dieses Jahr',
    yesterday: 'Gestern',
    prevWeek: 'Vorige Woche',
    prevBusinessWeek: 'Vorige Geschäftswoche',
    prevMonth: 'Voriger Monat',
    prevYear: 'Voriges Jahr',
    last2: 'Letzte 2 Tage',
    last4: 'Letzte 4 Tage',
    last7: 'Letzte 7 Tage',
    last14: 'Letzte 14 Tage',
    last30: 'Letzte 30 Tage',
    allTime: 'Alle Zeitpunkte',
  },
  presetGroups: {
    toDate: 'Bis dato',
    prevPeriod: 'Vorige Periode',
    rolling: 'Letzte Tage',
    misc: 'Weiteres',
  },
  views: {
    tokenType: 'Verlauf nach Token-Typ',
    tokenTypeAll: 'Verlauf nach Token-Typ (gesamt)',
    model: 'Verlauf nach Modell',
    co2: 'Verlauf nach CO₂',
    cost: 'Verlauf nach Preis',
    installations: 'Verlauf nach Installationen',
    tokensPerInstallation: 'Verlauf Tokens je Installation',
  },
  viewToggleLabels: {
    tokenType: 'Token in/out',
    tokenTypeAll: 'Token gesamt',
    model: 'Modell-Auswertung',
    co2: 'CO₂',
    cost: 'Preis',
    installations: 'Installationen',
    tokensPerInstallation: 'Ø Tokens/Installation',
  },
  tokenTypes: {
    input: 'In-Tokens',
    output: 'Out-Tokens',
    cacheWrite: 'Cache-Write',
    cacheRead: 'Cache-Read',
  },
  dateRangePicker: {
    customRange: 'Eigener Datumsbereich',
    panelAriaLabel: 'Zeitraum wählen',
    panelTitle: 'Zeitraum wählen',
    closeAriaLabel: 'Schließen',
    customGroupTitle: 'Benutzerdefiniert',
    fromLabel: 'Von',
    toLabel: 'Bis',
    applyButton: 'Anwenden',
  },
  viewToggle: {
    ariaLabel: 'Ansicht wählen',
  },
  providerFilter: {
    ariaLabel: 'Provider auswählen',
  },
  kpiSummaryRow: {
    totalTokens: 'Gesamt-Tokens',
    totalTokensSub: (scope: string): string => `Alle ${scope}, ohne Cache-Tokens`,
    totalCo2: 'CO₂ gesamt',
    totalCo2Sub: 'Geschätzt aus Token-Verbrauch',
    totalCost: 'Kosten gesamt',
    totalCostSub: (scope: string): string => `Alle ${scope}, in US-Dollar`,
  },
  pluginPanel: {
    activeUsers: 'Aktive Plugin-User',
    activeUsersSub: 'Distinkte Nutzer der letzten 4 Wochen',
    enableTracking: 'Tracking aktivieren',
    trackingFallback: 'Tracking-Plugin',
    descriptionPrefix: 'Der Verbrauch wird über ein',
    descriptionSuffix:
      'erfasst. Nur Nutzer mit installiertem Plugin fließen in die Auswertung ein — die ausgewiesene Nutzerzahl bildet daher die aktiven Plugin-Installationen im gewählten Zeitraum ab.',
  },
  emptyRangeNotice: {
    message: 'Für den gewählten Zeitraum liegen noch keine Daten vor.',
  },
  installCommand: {
    installLabel: 'Installieren',
    uninstallLabel: 'Deinstallieren',
    copy: 'Kopieren',
    copied: 'Kopiert!',
  },
  forceDayToggle: {
    label: 'Immer nach Tag',
  },
  dashboard: {
    companyTotals: 'Firmenweite Gesamtwerte',
    usageByProvider: 'Verbrauch nach Provider',
  },
  providerDetail: {
    lede: 'Token- und CO₂-Verbrauch nach Modell und Token-Typ.',
    backToOverview: 'Zur Übersicht',
    notFound: 'Für diesen Provider liegen keine Daten vor.',
    totals: 'Gesamtwerte',
    pluginTracking: 'Plugin-Tracking',
    byTokenType: 'Aufteilung nach Token-Typ',
    byModel: 'Aufschlüsselung nach Modell',
    modelColumn: 'Modell',
  },
  providerComparison: {
    providerColumn: 'Provider',
    withoutCache: '(ohne Cache-Tokens)',
    detailsLink: 'Details',
  },
  seriesBarChart: {
    installationsSuffix: 'Installationen',
    tokensPerInstallationSuffix: 'Tokens/Installation',
    inOutSuffix: ' (In+Out)',
  },
  homeUsageSeriesChart: {
    providerHistoryLabel: 'Provider im Verlauf:',
  },
  usageBars: {
    co2: 'CO₂',
    cost: 'Preis',
    installations: 'Installationen',
    tokensPerInstallation: 'Tokens/Installation',
  },
  faqPage: {
    title: (company: string): string => `FAQ · ${company ? `${company} ` : ''}Token-Dashboard`,
    headerTitle: 'FAQ',
    headerLede: 'Allgemeine Hinweise sowie Erläuterungen zu Berechnungen, Datenschutz und Nutzung.',
    tocAriaLabel: 'Inhalt',
  },
  providerPage: {
    title: (providerLabel: string, company: string): string =>
      `${providerLabel} · ${company ? `${company} ` : ''}Token-Dashboard`,
  },
  faqAsterisk: {
    explanation: 'Erläuterung in der FAQ',
    tokens: {
      id: 'total-tokens',
      q: 'Warum zählen die Gesamt-Tokens keine Cache-Tokens?',
      aria: 'Erläuterung zu den Gesamt-Tokens (FAQ-Seite)',
    },
    co2: {
      id: 'co2-calculation',
      q: 'Wie wird der CO₂-Wert berechnet?',
      aria: 'Erläuterung zur CO₂-Berechnung (FAQ-Seite)',
    },
    cost: {
      id: 'cost-calculation',
      q: 'Wie werden die Kosten berechnet?',
      aria: 'Erläuterung zur Kostenberechnung (FAQ-Seite)',
    },
    claude: {
      id: 'provider-coverage',
      q: 'Welche Provider werden angezeigt?',
      aria: 'Erläuterung zur Provider-Abdeckung (FAQ-Seite)',
    },
    privacy: {
      id: 'user-data',
      q: 'Welche Nutzerdaten werden erfasst?',
      aria: 'Datenschutz-Hinweis zur Nutzerzahl (FAQ-Seite)',
    },
  },
};
