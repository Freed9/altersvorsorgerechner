// ────────────────────────────────────────────────────────────────────────────
// JAHRESWERTE – einzige Stelle für alle gesetzlich festgelegten Jahreswerte.
//
// Jährliche Pflege: Nur diese Datei aktualisieren. Dienste, Infokarten und
// Glossar beziehen ihre Werte automatisch von hier.
//
// Quellen:
//   SVBezGrV     – Sozialversicherungs-Rechengrößenverordnung
//   §32a EStG    – Einkommensteuertarif (Grundtabelle)
//   §9a EStG     – Pauschbeträge
//   GKV-SV       – Zusatzbeitragssatz-Empfehlung Spitzenverband
//   SGB XI       – Pflegeversicherungsgesetz
//   InvStG §20   – Teilfreistellung Investmentfonds
//   §20 Abs.9 EStG – Sparerpauschbetrag
// ────────────────────────────────────────────────────────────────────────────

export const JAHRESWERTE = {
  /** Bezugsjahr dieser Konstanten */
  JAHR: 2026,

  // ── SVBezGrV ───────────────────────────────────────────────────────────────
  /** Vorläufiges Durchschnittsentgelt aller GRV-Versicherten (SVBezGrV 2026) */
  DURCHSCHNITTSENTGELT: 51_944,
  /** Beitragsbemessungsgrenze GRV / AV (bundeseinheitlich seit 2025) */
  BBG: 101_400,

  // ── GRV-Rente ──────────────────────────────────────────────────────────────
  /** Aktueller Rentenwert ab 1. Juli 2025 (ab 1. Juli 2026: 42,52 €) */
  RENTENWERT: 40.79,
  /** Gesetzliches Rentenalter für Jahrgänge ab 1964 */
  RENTENALTER: 67,
  /** Grundsicherung im Alter: Regelsatz + ø KdU (Alleinstehend) */
  GRUNDSICHERUNG_SCHWELLE: 933,

  // ── Sozialversicherung: AN-Anteile (bis BBG) ───────────────────────────────
  /** KV-Basissatz (gesetzlich, halber Beitragssatz; AG=AN) */
  KV_BASISSATZ: 0.073,
  /** Ø Zusatzbeitrag 2026, AN-Anteil (GKV-Spitzenverband: 2,9 % gesamt → 1,45 % AN) */
  KV_ZUSATZBEITRAG_AN: 0.0145,
  /** KV AN-Anteil gesamt = KV_BASISSATZ + KV_ZUSATZBEITRAG_AN */
  KV_AN: 0.0875,
  /**
   * KV-Beitragssatz auf die Rente (§249a SGB V):
   * Rentner zahlen KV_BASISSATZ (7,3 %) + vollen KV_ZUSATZBEITRAG_GESAMT (2,9 %).
   * DRV übernimmt die andere Hälfte des Basissatzes (7,3 %) direkt an die KK.
   */
  KV_ZUSATZBEITRAG_GESAMT: 0.029,
  KV_RENTNER: 0.102,
  /** PV AN-Anteil Elternteil (Beitragssatz 3,6 % / 2) */
  PV_AN_ELTERNTEIL: 0.018,
  /** PV AN-Anteil kinderlos (3,6 % + 0,6 % Kinderlosenzuschlag − AG-Anteil 1,8 %) */
  PV_AN_KINDERLOS: 0.024,
  /** PV Rentner Elternteil (voller Beitragssatz, kein AG-Anteil) */
  PV_RENTNER_ELTERNTEIL: 0.036,
  /** PV Rentner kinderlos (voller Satz + Kinderlosenzuschlag) */
  PV_RENTNER_KINDERLOS: 0.042,
  /** RV AN-Anteil (Beitragssatz 18,6 % / 2) */
  RV_AN: 0.093,
  /** AV AN-Anteil (Beitragssatz 2,6 % / 2) */
  AV_AN: 0.013,

  // ── Einkommensteuer §32a EStG ──────────────────────────────────────────────
  /** Steuerfreies Existenzminimum */
  GRUNDFREIBETRAG: 12_348,
  /** Werbungskostenpauschbetrag Arbeitnehmer §9a S.1 Nr.1 EStG */
  WERBUNGSKOSTEN_AN: 1_230,
  /** Werbungskostenpauschbetrag Rentner §9a S.1 Nr.3 EStG */
  WERBUNGSKOSTEN_RENTNER: 102,
  /** Sonderausgabenpauschbetrag §10c EStG */
  SONDERAUSGABEN_PAUSCHBETRAG: 36,

  /**
   * §32a EStG Zonengrenzen und Progressionskoeffizienten 2026.
   * Koeffizienten sind aus den Zonengrenzen mathematisch abgeleitet
   * (Stetigkeitsbedingung). Bei Gesetzesänderung immer zusammen aktualisieren.
   */
  ESTG: {
    ZONE1_BIS: 17_799,   // Ende 1. Progressionszone (ZvE)
    ZONE2_BIS: 69_878,   // Ende 2. Progressionszone
    ZONE3_BIS: 277_825,  // Ende 1. Proportionalzone
    Z1_A: 914.51,        // Progressionskoeff. a₁ Zone 1
    Z1_B: 1_400,         // Progressionskoeff. b₁ Zone 1
    Z2_A: 173.10,        // Progressionskoeff. a₂ Zone 2
    Z2_B: 2_397,         // Progressionskoeff. b₂ Zone 2
    Z2_C: 1_034.87,      // Konstantenterm Zone 2 (Stetigkeitsbedingung)
    Z3_OFFSET: 11_135.63,   // Proportionalabzug Zone 3
    Z4_OFFSET: 19_470.38,   // Proportionalabzug Zone 4 (Reichensteuer)
  },

  // ── Kapitalertragsteuer ────────────────────────────────────────────────────
  /** KESt 25 % + Solidaritätszuschlag 5,5 % = 26,375 % */
  KEST_SOLI: 0.26375,
  /** Teilfreistellung für Aktien-ETF (≥ 51 % Aktienquote) nach §20 InvStG */
  TEILFREISTELLUNG_ETF: 0.30,
  /** Effektiver KESt-Satz nach Teilfreistellung = KEST_SOLI × (1 − TEILFREISTELLUNG_ETF) */
  KEST_ETF_EFFEKTIV: 0.184625,
  /** Sparerpauschbetrag §20 Abs. 9 EStG (gilt für ETF-Depot, nicht für AVD) */
  SPARERPAUSCHBETRAG: 1_000,

  // ── GRV-Besteuerung ────────────────────────────────────────────────────────
  /**
   * Besteuerungsanteil der GRV-Rente für Rentenbeginn in JAHR.
   * Formel: 82,5 % + 0,5 % × (JAHR − 2023) — JStG 2022 i.d.F. Wachstumschancengesetz 2024.
   * Vollbesteuerung ab 2058.
   */
  BESTEUERUNGSANTEIL_GRV: 84,

  // ── AVD (Altersvorsorgereformgesetz, geplant ab 01.01.2027) ───────────────
  /** Geplantes Einführungsjahr des Altersvorsorgedepots */
  AVD_STARTJAHR: 2027,
} as const;
