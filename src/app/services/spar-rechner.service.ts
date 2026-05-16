import { Injectable } from '@angular/core';
import { JAHRESWERTE as JW } from '../constants/jahreswerte';

export const SPAR_CONSTANTS = {
  DEFAULT_RENDITE: 7,   // % p.a. nominale Brutto-Marktrendite (Real = Brutto − 2 % Inflation)
  DEFAULT_JAHRE: 30,
};

export const AVD_CONSTANTS = {
  RENDITE: 4.0,                  // % p.a. (Marktrendite 7 % − Inflation 2 % − Kosten 1 %)
  MAX_OWN_MONTH: 570,            // 6.840 €/Jahr gesetzlicher Höchstbeitrag (§10a EStG)
  MAX_ZULAGE_MONTH: 150,         // 1.800 €/Jahr → volle Grundzulage (Optimierungsgrenze)
  MIN_OWN_MONTH: 10,             // 120 €/Jahr Mindestbeitrag
  TIER1_CAP_YEAR: 360,           // Ersten 360 € Eigenanteil/Jahr zu 50 %
  TIER1_RATE: 0.50,              // → max 180 €/Jahr
  TIER2_RATE: 0.25,              // 361–1.800 €/Jahr zu 25 % → max 360 €/Jahr
  MAX_GRUNDZULAGE_YEAR: 540,     // 180 + 360 = 540 €/Jahr Grundzulage
  MAX_KINDERZULAGE_MONTH: 25,    // 25 €/Monat = 300 €/Jahr je Kind; wird ab Mindesteigenbeitrag 25 €/Mon. gezahlt (§10a EStG)
  MAX_SONDERAUSGABEN_OWN_YEAR: 1800, // Sonderausgabenabzug §10a EStG nur auf max. 1.800 €/Jahr Eigenanteil
  FALLBACK_STEUERSATZ: 0.20,     // Fallback wenn keine Rentendaten vorhanden
  ENTNAHMERATE: 0.04,            // 4 %-Regel
  JUNGSPARER_BONUS: 200,         // Einmalige Zulage für Kontoöffnung vor dem 25. Lebensjahr (§10a EStG)
};

// §32a EStG — Rentenbesteuerung (Werte aus JAHRESWERTE)
const GRUNDFREIBETRAG        = JW.GRUNDFREIBETRAG;
const WERBUNGSKOSTEN_RENTNER = JW.WERBUNGSKOSTEN_RENTNER;
const SONDERAUSGABEN_PAUSCH  = JW.SONDERAUSGABEN_PAUSCHBETRAG;
const ETF_STEUERSATZ_EFFEKTIV = JW.KEST_ETF_EFFEKTIV;

export interface SparrateResult {
  monthlyRate: number;
  totalContributions: number;
  startingCapitalGrown: number;
  gainFromReturns: number;
  finalCapital: number;
}

export interface KapitalResult {
  finalCapital: number;
  totalContributions: number;
  startingCapitalGrown: number;
  gainFromReturns: number;
}

export interface AvdChartPoint {
  ownMonth: number;
  etfMonth: number;
  bonusMonth: number;
  depotMonth: number;
  avdGrossIncome: number; // vor ESt (4%-Regel)
  avdTax: number;         // ESt-Abzug auf AVD-Einkommen
  avdIncome: number;      // nach ESt (4%-Regel)
  etfGrossIncome: number; // vor KESt (4%-Regel)
  etfTax: number;         // KESt-Abzug auf ETF-Erträge
  etfIncome: number;      // nach KESt (4%-Regel)
  guenstigerRefundAnnual: number; // Jährl. Steuererstattung Günstigerprüfung (0 wenn n.a.)
  guenstigerEtfBonus: number;     // Zusätzl. monatl. Nettorente aus reinvestierter Erstattung
  netIncomeMonth: number;
}

// AvdChartPoint is reused for sweetspot too
export type AvdSweetspotPoint = AvdChartPoint;

export interface AvdOptResult {
  refMonthlyIncome: number;       // monatl. Nettoeinkommen bei reinem ETF-Sparplan

  // Steuerinfo AVD-Auszahlung
  avdEffTaxRate: number;          // Grenzsteuersatz auf AVD-Einkommen im Rentenalter
  avdRetirementYear: number;      // geschätztes Renteneintrittsjahr
  avdBesteuerungsanteil: number;  // Besteuerungsanteil der GRV-Rente

  // Gleiche Rente, weniger sparen
  optEtf: number;
  optAvdOwn: number;
  optAvdBonus: number;       // Zulage (effektiv gemittelt, für Einkommensberechnung)
  optAvdBonusCurrent: number;// Zulage aktueller Monat (integer Kinder jetzt, für Anzeige)
  optAvdDepot: number;
  optTotal: number;
  optSaving: number;
  optSavingPct: number;

  // Gleiche Sparrate, mehr Rente
  fullEtf: number;
  fullAvdOwn: number;
  fullAvdBonus: number;       // Zulage (effektiv gemittelt)
  fullAvdBonusCurrent: number;// Zulage aktueller Monat (für Anzeige)
  fullAvdDepot: number;
  fullMonthlyIncome: number;
  fullGainPct: number;

  kAvd: number;   // Nettorente je 1 €/Monat AVD-Depot (nach Steuer + 4%-Regel)
  kEtf: number;   // Nettorente je 1 €/Monat ETF (nach KESt + 4%-Regel)

  sweetspotOwnMonth: number;  // letzter Schritt mit 50 % Tier-1-Zulage (Knick der Kurve)

  // Günstigerprüfung (§10a EStG Ansparphase) — Werte für "günstigerer Sparplan" (optAvdOwn)
  guenstigerBreakEvenRate: number;    // Grenzsteuersatz ab dem Steuervorteil > Zulage (opt)
  guenstigerAbzugsfaehigYear: number; // Abzugsfähiger Betrag/Jahr (opt)
  guenstigerZulageYear: number;       // Zulageanspruch/Jahr beim opt. Eigenanteil
  guenstigerActive: boolean;          // true wenn aktueller Steuersatz > Break-Even
  guenstigerCurrentTaxRate: number;   // eingegebener Grenzsteuersatz (0 = deaktiviert)
  guenstigerRefundAtOpt: number;      // Jährl. Erstattung beim "weniger sparen"-Optimum
  guenstigerRefundAtFull: number;     // Jährl. Erstattung beim "mehr Rente"-Optimum
  // Günstigerprüfung-Werte für "mehr Rente" (fullAvdOwn)
  guenstigerBreakEvenRateFull: number;
  guenstigerAbzugsfaehigYearFull: number;
  guenstigerZulageYearFull: number;

  // Jungsparer-Bonus: monatl. Zusatzrente aus einmaliger Zahlung von 200 € (0 wenn Alter ≥ 25)
  jungsparerBonusMonthly: number;

  // AVD-Depot-Kapital am Rentenbeginn beim Optimum (fullAvdOwn + Zulage, angespart, vor Steuer)
  avdCapitalAtOpt: number;

  // Sweetspot-Vergleich: ±10 € um das Optimum
  sweetspot: AvdSweetspotPoint[];

  // Vollständige Kurve: alle 10 € AVD-Eigenanteil + 0 € (reiner ETF)
  chartPoints: AvdChartPoint[];
}

@Injectable({ providedIn: 'root' })
export class SparRechnerService {

  // ── Rentensteuer-Hilfsmethoden ────────────────────────────────────────────

  // Besteuerungsanteil nach JStG 2022 i.d.F. Wachstumschancengesetz 2024: 82,5 % in 2023, +0,5 %/Jahr bis 100 % in 2058
  private besteuerungsanteil(retirementYear: number): number {
    return Math.min(1.0, 0.825 + 0.005 * Math.max(0, retirementYear - 2023));
  }

  // Zu versteuerndes Einkommen aus GRV-Rente (§22 Nr. 1 EStG)
  private taxableRenteZvE(annualGrossRente: number, retirementYear: number): number {
    const ratio = this.besteuerungsanteil(retirementYear);
    return Math.max(0, annualGrossRente * ratio - WERBUNGSKOSTEN_RENTNER - SONDERAUSGABEN_PAUSCH);
  }

  // §32a EStG — absoluter Steuerbetrag (Koeffizienten aus JAHRESWERTE.ESTG)
  private einkStBetrag(zvE: number): number {
    const e = JW.ESTG;
    if (zvE <= GRUNDFREIBETRAG) return 0;
    if (zvE <= e.ZONE1_BIS) {
      const y = (zvE - GRUNDFREIBETRAG) / 10000;
      return Math.floor((e.Z1_A * y + e.Z1_B) * y);
    }
    if (zvE <= e.ZONE2_BIS) {
      const z = (zvE - e.ZONE1_BIS) / 10000;
      return Math.floor((e.Z2_A * z + e.Z2_B) * z + e.Z2_C);
    }
    if (zvE <= e.ZONE3_BIS) return Math.floor(0.42 * zvE - e.Z3_OFFSET);
    return Math.floor(0.45 * zvE - e.Z4_OFFSET);
  }

  // §32a EStG — analytischer Grenzsteuersatz
  private marginalTaxRate(zvE: number): number {
    const e = JW.ESTG;
    if (zvE <= GRUNDFREIBETRAG) return 0;
    if (zvE <= e.ZONE1_BIS) {
      const y = (zvE - GRUNDFREIBETRAG) / 10000;
      return Math.min(0.42, (2 * e.Z1_A * y + e.Z1_B) / 10000);
    }
    if (zvE <= e.ZONE2_BIS) {
      const z = (zvE - e.ZONE1_BIS) / 10000;
      return Math.min(0.42, (2 * e.Z2_A * z + e.Z2_B) / 10000);
    }
    if (zvE <= e.ZONE3_BIS) return 0.42;
    return 0.45;
  }

  // Grenzsteuersatz auf das AVD-Einkommen, gegeben GRV-Bruttorente und Alter
  computeAvdTaxRate(
    monthlyPensionGross: number | null,
    currentAge: number | null,
  ): { rate: number; retirementYear: number; besteuerungsanteil: number; zvE: number } {
    const CURRENT_YEAR = new Date().getFullYear();
    const retirementYear = currentAge != null
      ? CURRENT_YEAR + Math.max(0, 67 - currentAge)
      : CURRENT_YEAR + 30;
    const ba = this.besteuerungsanteil(retirementYear);

    if (monthlyPensionGross == null || monthlyPensionGross <= 0) {
      return { rate: AVD_CONSTANTS.FALLBACK_STEUERSATZ, retirementYear, besteuerungsanteil: ba, zvE: 0 };
    }

    const annualGrossRente = monthlyPensionGross * 12;
    const zvE = this.taxableRenteZvE(annualGrossRente, retirementYear);
    const rate = this.marginalTaxRate(zvE);
    return { rate, retirementYear, besteuerungsanteil: ba, zvE };
  }

  computeWorkingMarginalTaxRate(annualGross: number): number {
    const capped = Math.min(annualGross, JW.BBG);
    const sv = capped * (JW.KV_AN + JW.PV_AN_ELTERNTEIL + JW.RV_AN + JW.AV_AN);
    const zvE = Math.max(0, annualGross - sv - JW.WERBUNGSKOSTEN_AN - SONDERAUSGABEN_PAUSCH);
    return this.marginalTaxRate(zvE);
  }

  // ── AVD-Förderung ─────────────────────────────────────────────────────────

  avdMonthlyBonus(monthlyOwn: number, eligibleChildren: number): number {
    if (monthlyOwn < AVD_CONSTANTS.MIN_OWN_MONTH) return 0;
    const yearlyOwn = Math.min(monthlyOwn * 12, 1800);
    const tier1 = Math.min(yearlyOwn, AVD_CONSTANTS.TIER1_CAP_YEAR) * AVD_CONSTANTS.TIER1_RATE;
    const tier2 = Math.max(0, yearlyOwn - AVD_CONSTANTS.TIER1_CAP_YEAR) * AVD_CONSTANTS.TIER2_RATE;
    const grundzulageYear = Math.min(tier1 + tier2, AVD_CONSTANTS.MAX_GRUNDZULAGE_YEAR);
    const kinderzulageMonth = eligibleChildren * Math.min(monthlyOwn, AVD_CONSTANTS.MAX_KINDERZULAGE_MONTH);
    return grundzulageYear / 12 + kinderzulageMonth;
  }

  calculateSparrate(
    targetCapital: number,
    years: number,
    annualRatePct: number,
    startingCapital: number,
  ): SparrateResult {
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    const K0grown = startingCapital * Math.pow(1 + r, n);
    const fvNeeded = Math.max(0, targetCapital - K0grown);
    const PMT = fvNeeded > 0 && r > 0
      ? (fvNeeded * r) / (Math.pow(1 + r, n) - 1)
      : fvNeeded / n;
    const totalContributions = PMT * n + startingCapital;
    const gainFromReturns = targetCapital - totalContributions;
    return { monthlyRate: PMT, totalContributions, startingCapitalGrown: K0grown, gainFromReturns, finalCapital: targetCapital };
  }

  calculateKapital(
    monthlyRate: number,
    years: number,
    annualRatePct: number,
    startingCapital: number,
  ): KapitalResult {
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    const fvSavings = r > 0 ? monthlyRate * (Math.pow(1 + r, n) - 1) / r : monthlyRate * n;
    const K0grown = startingCapital * Math.pow(1 + r, n);
    const finalCapital = fvSavings + K0grown;
    const totalContributions = monthlyRate * n + startingCapital;
    const gainFromReturns = finalCapital - totalContributions;
    return { finalCapital, totalContributions, startingCapitalGrown: K0grown, gainFromReturns };
  }

  calculateAvdOptimization(
    targetCapital: number,
    monthlyEtfRate: number,
    years: number,
    etfAnnualRatePct: number,
    eligibleChildren: number,
    eligibleChildrenNow: number,
    monthlyPensionGross: number | null = null,
    currentAge: number | null = null,
    etfTerPct: number = 0.25,
    avdCostPct: number = 1.0,
    currentMarginalTaxRate: number = 0,  // 0 = Günstigerprüfung deaktiviert
    grossMarketReturnPct: number = 7.0,  // Nominale Brutto-Marktrendite vor Inflation und Kosten
  ): AvdOptResult {
    const n = years * 12;
    // Effektive Renditen nach Kosten: ETF = Brutto − TER; AVD = Markt − 2 % Infl. − AVD-Kosten
    const r_etf = Math.max(0, etfAnnualRatePct - etfTerPct) / 100 / 12;
    const r_avd = Math.max(0, grossMarketReturnPct - 2.0 - avdCostPct) / 100 / 12;
    const r_avd_annual = Math.max(0, grossMarketReturnPct - 2.0 - avdCostPct) / 100;

    const fvEtf = r_etf > 0 ? (Math.pow(1 + r_etf, n) - 1) / r_etf : n;
    const fvAvd = r_avd > 0 ? (Math.pow(1 + r_avd, n) - 1) / r_avd : n;

    // Jährlicher FV-Faktor für die ETF-Reinvestition der Steuererstattung (Günstigerprüfung)
    const r_etf_annual = Math.max(0, etfAnnualRatePct - etfTerPct) / 100;
    const fvEtfAnnual = r_etf_annual > 0
      ? (Math.pow(1 + r_etf_annual, years) - 1) / r_etf_annual
      : years;

    // Steuerinfo: Grenzsteuersatz + ZvE aus GRV-Rente allein
    const taxInfo = this.computeAvdTaxRate(monthlyPensionGross, currentAge);
    const avdTaxRate = taxInfo.rate;   // Grenzrate bei ZvE_GRV (für kAvd-Referenzanzeige)
    const zvE_grv = taxInfo.zvE;       // ZvE nur aus GRV — Basis für Differenzsteuer
    const tax_grv = this.einkStBetrag(zvE_grv);

    // Jungsparer-Bonus: einmalige 200 € für Kontoöffnung vor dem 25. Lebensjahr
    // Wächst als Einmalzahlung im AVD, erzeugt Zusatzrente (nach Differenzsteuer approximiert)
    const jungsparerRaw = (currentAge !== null && currentAge < 25)
      ? AVD_CONSTANTS.JUNGSPARER_BONUS : 0;
    const jungsparerCapital = jungsparerRaw * Math.pow(1 + r_avd_annual, years);
    const jungsparerGrossMonth = jungsparerCapital * AVD_CONSTANTS.ENTNAHMERATE / 12;
    const jungsparerBonusMonthly = jungsparerGrossMonth * (1 - avdTaxRate);

    // Brutto-Faktoren je 1 € monatl. investiert (4 %-Regel, vor Steuer)
    const K_etf_gross = fvEtf * AVD_CONSTANTS.ENTNAHMERATE / 12;
    const K_avd_gross = fvAvd * AVD_CONSTANTS.ENTNAHMERATE / 12;

    // Gewinn-Anteil des ETF-Corpus (Wertzuwachs vs. Einzahlungen)
    const gainFraction_etf = fvEtf > 0 && n > 0 ? Math.max(0, 1 - n / fvEtf) : 0;

    // Netto ETF-Monatseinkommen mit Sparerpauschbetrag (§20 Abs. 9 EStG)
    // Steuerfrei: Teilfreistellung + Sparerpauschbetrag auf den verbleibenden Gewinnanteil
    const etfNetIncome = (etf: number): number => {
      const gross = etf * K_etf_gross;
      const annualTax = Math.max(0, gross * gainFraction_etf * (1 - JW.TEILFREISTELLUNG_ETF) * 12 - JW.SPARERPAUSCHBETRAG) * JW.KEST_SOLI;
      return gross - annualTax / 12;
    };

    // Inverse: ETF-Monatsbeitrag für gegebenes Ziel-Nettoeinkommen
    const etfForTarget = (target: number): number => {
      const a = gainFraction_etf * (1 - JW.TEILFREISTELLUNG_ETF) * JW.KEST_SOLI;
      const b = JW.SPARERPAUSCHBETRAG * JW.KEST_SOLI / 12;
      const grossNoTax = target;
      if (grossNoTax * gainFraction_etf * (1 - JW.TEILFREISTELLUNG_ETF) * 12 <= JW.SPARERPAUSCHBETRAG) return Math.ceil(grossNoTax / K_etf_gross);
      return Math.ceil((target - b) / ((1 - a) * K_etf_gross));
    };

    // K_avd nur für Referenzanzeige (kAvd-Feld); Berechnungen nutzen Differenzsteuer
    const K_avd = K_avd_gross * (1 - avdTaxRate);

    // Referenz: reiner ETF-Sparplan (nur aus der monatlichen Sparrate, ohne Startkapital)
    const refMonthlyIncome = etfNetIncome(monthlyEtfRate);

    // Netto-AVD-Monatseinkommen für einen gegebenen Eigenanteil:
    // Differenzsteuer §32a(ZvE_GRV + AVD_Jahresbrutto) − §32a(ZvE_GRV)
    const avdNetMonth = (own: number): number => {
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      const avdAnnualGross = (own + bonus) * K_avd_gross * 12;
      const taxOnAvd = this.einkStBetrag(zvE_grv + avdAnnualGross) - tax_grv;
      return (avdAnnualGross - taxOnAvd) / 12;
    };

    // Günstigerprüfung §10a EStG: Steuererstattung = max(0, Steuersatz × Abzug − Zulage)
    // Sonderausgabenabzug ist auf max. 1.800 €/Jahr Eigenanteil begrenzt (§10a Abs.1 EStG).
    // Die Erstattung wird jährlich ins ETF reinvestiert → zusätzl. monatl. Nettorente
    const guenstigerFor = (own: number, bonus: number): { refundAnnual: number; etfBonus: number } => {
      if (currentMarginalTaxRate <= 0 || own <= 0) return { refundAnnual: 0, etfBonus: 0 };
      const zulageAnnual = bonus * 12;
      const eligibleOwnAnnual = Math.min(own * 12, AVD_CONSTANTS.MAX_SONDERAUSGABEN_OWN_YEAR);
      const abzugAnnual = eligibleOwnAnnual + zulageAnnual;
      const refundAnnual = Math.max(0, currentMarginalTaxRate * abzugAnnual - zulageAnnual);
      const etfBonus = refundAnnual * fvEtfAnnual * AVD_CONSTANTS.ENTNAHMERATE / 12 * (1 - gainFraction_etf * ETF_STEUERSATZ_EFFEKTIV);
      return { refundAnnual, etfBonus };
    };

    const incomeFor = (own: number, etf: number): number => {
      if (own <= 0) return etfNetIncome(etf);
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      return avdNetMonth(own) + etfNetIncome(etf) + guenstigerFor(own, bonus).etfBonus + jungsparerBonusMonthly;
    };

    // ---- Vollständige Kurve: alle Schritte mit Differenzsteuer ----
    const etfGross0 = monthlyEtfRate * K_etf_gross;
    const chartPoints: AvdChartPoint[] = [{
      ownMonth: 0, etfMonth: monthlyEtfRate, bonusMonth: 0, depotMonth: 0,
      avdGrossIncome: 0, avdTax: 0, avdIncome: 0,
      etfGrossIncome: etfGross0, etfTax: etfGross0 - etfNetIncome(monthlyEtfRate),
      etfIncome: etfNetIncome(monthlyEtfRate),
      guenstigerRefundAnnual: 0, guenstigerEtfBonus: 0,
      netIncomeMonth: incomeFor(0, monthlyEtfRate),
    }];
    for (let own = AVD_CONSTANTS.MIN_OWN_MONTH; own <= Math.min(AVD_CONSTANTS.MAX_OWN_MONTH, monthlyEtfRate); own += 10) {
      const etf = Math.max(0, monthlyEtfRate - own);
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      const depot = own + bonus;

      // Differenzsteuer: §32a(ZvE_GRV + AVD_Jahresbrutto) − §32a(ZvE_GRV)
      const avdAnnualGross = depot * K_avd_gross * 12;
      const avdTaxAnnual = this.einkStBetrag(zvE_grv + avdAnnualGross) - tax_grv;
      const avdGrossMonth = avdAnnualGross / 12;
      const avdTaxMonth = avdTaxAnnual / 12;
      const avdIncomeMonth = avdGrossMonth - avdTaxMonth;

      const etfGross = etf * K_etf_gross;
      const { refundAnnual: gpRefund, etfBonus: gpEtfBonus } = guenstigerFor(own, bonus);
      chartPoints.push({
        ownMonth: own, etfMonth: etf, bonusMonth: bonus, depotMonth: depot,
        avdGrossIncome: avdGrossMonth, avdTax: avdTaxMonth, avdIncome: avdIncomeMonth,
        etfGrossIncome: etfGross, etfTax: etfGross - etfNetIncome(etf), etfIncome: etfNetIncome(etf),
        guenstigerRefundAnnual: gpRefund, guenstigerEtfBonus: gpEtfBonus,
        netIncomeMonth: avdIncomeMonth + etfNetIncome(etf) + gpEtfBonus + jungsparerBonusMonthly,
      });
    }

    // ---- Sweetspot: letzter Schritt innerhalb Tier-1-Förderung (50 %-Zone) ----
    const tier1MaxMonth = AVD_CONSTANTS.TIER1_CAP_YEAR / 12; // 30 €/Mon.
    const sweetspotOwnMonth = [...chartPoints]
      .filter(p => p.ownMonth > 0 && p.ownMonth <= tier1MaxMonth)
      .pop()?.ownMonth ?? chartPoints[1]?.ownMonth ?? 0;

    // ---- Gleiche Sparrate, mehr Rente: exaktes Einkommensmaximum ----
    // Grobes Optimum aus 10€-Raster, dann 1€-Feinscan im ±9€-Umfeld
    const coarsePt = chartPoints.reduce((best, p) =>
      p.netIncomeMonth > best.netIncomeMonth ? p : best, chartPoints[0]);

    const scanLimit = Math.min(AVD_CONSTANTS.MAX_OWN_MONTH, monthlyEtfRate);
    const scanLo = Math.max(0, coarsePt.ownMonth - 9);
    const scanHi = Math.min(scanLimit, coarsePt.ownMonth + 9);
    let exactOwn = coarsePt.ownMonth;
    let exactIncome = coarsePt.netIncomeMonth;
    for (let own = scanLo; own <= scanHi; own++) {
      if (own % 10 === 0) continue;
      const income = incomeFor(own, Math.max(0, monthlyEtfRate - own));
      if (income > exactIncome) { exactIncome = income; exactOwn = own; }
    }

    // Exaktes Optimum in chartPoints einfügen wenn kein 10€-Vielfaches
    if (exactOwn % 10 !== 0) {
      const own = exactOwn;
      const etf = Math.max(0, monthlyEtfRate - own);
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      const depot = own + bonus;
      const avdAnnualGross = depot * K_avd_gross * 12;
      const avdTaxAnnual = this.einkStBetrag(zvE_grv + avdAnnualGross) - tax_grv;
      const avdGrossMonth = avdAnnualGross / 12;
      const avdTaxMonth = avdTaxAnnual / 12;
      const avdIncomeMonth = avdGrossMonth - avdTaxMonth;
      const etfGross = etf * K_etf_gross;
      const { refundAnnual: gpRefund, etfBonus: gpEtfBonus } = guenstigerFor(own, bonus);
      const insertIdx = chartPoints.findIndex(p => p.ownMonth > own);
      chartPoints.splice(insertIdx < 0 ? chartPoints.length : insertIdx, 0, {
        ownMonth: own, etfMonth: etf, bonusMonth: bonus, depotMonth: depot,
        avdGrossIncome: avdGrossMonth, avdTax: avdTaxMonth, avdIncome: avdIncomeMonth,
        etfGrossIncome: etfGross, etfTax: etfGross - etfNetIncome(etf), etfIncome: etfNetIncome(etf),
        guenstigerRefundAnnual: gpRefund, guenstigerEtfBonus: gpEtfBonus,
        netIncomeMonth: exactIncome,
      });
    }

    const maxPt = chartPoints.reduce((best, p) =>
      p.netIncomeMonth > best.netIncomeMonth ? p : best, chartPoints[0]);
    const fullAvdOwn = maxPt.ownMonth;
    const fullEtf = maxPt.etfMonth;
    const fullAvdBonus = maxPt.bonusMonth;
    const fullAvdDepot = maxPt.depotMonth;
    const fullMonthlyIncome = maxPt.netIncomeMonth;
    const fullGainPct = refMonthlyIncome > 0
      ? ((fullMonthlyIncome - refMonthlyIncome) / refMonthlyIncome) * 100 : 0;

    // ---- Gleiche Rente, günstigerer Sparplan: min-Kostenscan ----
    // Iteriert alle chartPoints und findet den AVD-Eigenanteil, der bei gleichem Rentenziel
    // die geringste Gesamtsparrate (own + benötigtes ETF) ergibt.
    let optAvdOwn = 0;
    let optEtf = monthlyEtfRate;
    let optTotal = monthlyEtfRate; // Startwert: reiner ETF-Plan

    for (const pt of chartPoints) {
      const avdOnlyIncome = pt.avdIncome + pt.guenstigerEtfBonus
        + (pt.ownMonth > 0 ? jungsparerBonusMonthly : 0);
      const neededEtf = avdOnlyIncome >= refMonthlyIncome
        ? 0
        : etfForTarget(refMonthlyIncome - avdOnlyIncome);
      const total = pt.ownMonth + neededEtf;
      if (total < optTotal) {
        optTotal = total;
        optAvdOwn = pt.ownMonth;
        optEtf = neededEtf;
      }
    }

    const optAvdBonus = this.avdMonthlyBonus(optAvdOwn, eligibleChildren);
    const optAvdBonusCurrent = this.avdMonthlyBonus(optAvdOwn, eligibleChildrenNow);
    const optAvdDepot = optAvdOwn + optAvdBonus;
    const optSaving = monthlyEtfRate - optTotal;
    const optSavingPct = monthlyEtfRate > 0 ? (optSaving / monthlyEtfRate) * 100 : 0;

    // ---- Günstigerprüfung (§10a EStG) — opt (günstigerer Sparplan) ----
    // Basis: aktuelle Zulage dieses Jahres (eligibleChildrenNow), nicht der gemittelte Wert
    // Sonderausgabenabzug max. 1.800 €/Jahr Eigenanteil + volle Zulage
    const guenstigerZulageYear = optAvdBonusCurrent * 12;
    const guenstigerAbzugsfaehigYear =
      Math.min(optAvdOwn * 12, AVD_CONSTANTS.MAX_SONDERAUSGABEN_OWN_YEAR) + guenstigerZulageYear;
    const guenstigerBreakEvenRate = guenstigerAbzugsfaehigYear > 0
      ? guenstigerZulageYear / guenstigerAbzugsfaehigYear : 0;
    const guenstigerRefundAtOpt = guenstigerFor(optAvdOwn, optAvdBonusCurrent).refundAnnual;

    // ---- Günstigerprüfung — full (mehr Rente) ----
    const fullAvdBonusCurrent = this.avdMonthlyBonus(fullAvdOwn, eligibleChildrenNow);
    const guenstigerZulageYearFull = fullAvdBonusCurrent * 12;
    const guenstigerAbzugsfaehigYearFull =
      Math.min(fullAvdOwn * 12, AVD_CONSTANTS.MAX_SONDERAUSGABEN_OWN_YEAR) + guenstigerZulageYearFull;
    const guenstigerBreakEvenRateFull = guenstigerAbzugsfaehigYearFull > 0
      ? guenstigerZulageYearFull / guenstigerAbzugsfaehigYearFull : 0;
    const guenstigerRefundAtFull = guenstigerFor(fullAvdOwn, fullAvdBonusCurrent).refundAnnual;

    const guenstigerActive = guenstigerRefundAtFull > 0 || guenstigerRefundAtOpt > 0;

    // AVD-Depot-Kapital beim Optimum: monatl. Depot × FV-Faktor + Jungsparer-Einmalzahlung
    const avdCapitalAtOpt = maxPt.avdGrossIncome > 0
      ? (maxPt.avdGrossIncome * 12 / AVD_CONSTANTS.ENTNAHMERATE) + jungsparerCapital
      : jungsparerCapital;

    return {
      refMonthlyIncome,
      avdEffTaxRate: avdTaxRate,
      avdRetirementYear: taxInfo.retirementYear,
      avdBesteuerungsanteil: taxInfo.besteuerungsanteil,
      kAvd: K_avd,
      kEtf: monthlyEtfRate > 0 ? etfNetIncome(monthlyEtfRate) / monthlyEtfRate : K_etf_gross * (1 - gainFraction_etf * ETF_STEUERSATZ_EFFEKTIV),
      sweetspotOwnMonth,
      jungsparerBonusMonthly,
      avdCapitalAtOpt,
      optEtf, optAvdOwn, optAvdBonus, optAvdBonusCurrent, optAvdDepot, optTotal, optSaving, optSavingPct,
      fullEtf, fullAvdOwn, fullAvdBonus, fullAvdBonusCurrent, fullAvdDepot, fullMonthlyIncome, fullGainPct,
      guenstigerBreakEvenRate, guenstigerAbzugsfaehigYear, guenstigerZulageYear,
      guenstigerBreakEvenRateFull, guenstigerAbzugsfaehigYearFull, guenstigerZulageYearFull,
      guenstigerActive, guenstigerCurrentTaxRate: currentMarginalTaxRate,
      guenstigerRefundAtOpt, guenstigerRefundAtFull,
      sweetspot: [],
      chartPoints,
    };
  }
}
