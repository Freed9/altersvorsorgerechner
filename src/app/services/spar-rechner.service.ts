import { Injectable } from '@angular/core';

export const SPAR_CONSTANTS = {
  DEFAULT_RENDITE: 5,   // % p.a. (7 % historisch − 2 % Inflation)
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
  KINDERZULAGE_YEAR: 300,        // 300 €/Jahr pro Kind mit Kindergeldanspruch
  FALLBACK_STEUERSATZ: 0.20,     // Fallback wenn keine Rentendaten vorhanden
  ENTNAHMERATE: 0.04,            // 4 %-Regel
};

// §32a EStG 2024 — Rentenbesteuerung
const GRUNDFREIBETRAG = 11784;
const WERBUNGSKOSTEN_RENTNER = 102;   // §9a S.1 Nr.3 EStG
const SONDERAUSGABEN_PAUSCH = 36;

const KEST_SOLI = 0.26375;
const ETF_STEUERSATZ_EFFEKTIV = KEST_SOLI * (1 - 0.30); // 18,4625 % mit 30 % Teilfreistellung

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
  avdIncome: number;     // Rentenanteil aus AVD-Depot (nach Steuer, 4%-Regel)
  etfIncome: number;     // Rentenanteil aus ETF (nach KESt, 4%-Regel)
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
  optAvdBonus: number;
  optAvdDepot: number;
  optTotal: number;
  optSaving: number;
  optSavingPct: number;

  // Gleiche Sparrate, mehr Rente
  fullEtf: number;
  fullAvdOwn: number;
  fullAvdBonus: number;
  fullMonthlyIncome: number;
  fullGainPct: number;

  kAvd: number;   // Nettorente je 1 €/Monat AVD-Depot (nach Steuer + 4%-Regel)
  kEtf: number;   // Nettorente je 1 €/Monat ETF (nach KESt + 4%-Regel)

  sweetspotOwnMonth: number;  // letzter Schritt mit 50 % Tier-1-Zulage (Knick der Kurve)

  // Günstigerprüfung (§10a EStG Ansparphase)
  guenstigerBreakEvenRate: number;    // Grenzsteuersatz ab dem Steuervorteil > Zulage
  guenstigerAbzugsfaehigYear: number; // Abzugsfähiger Betrag/Jahr (Eigenbeitrag + Zulage)
  guenstigerZulageYear: number;       // Zulageanspruch/Jahr beim opt. Eigenanteil

  // Sweetspot-Vergleich: ±10 € um das Optimum
  sweetspot: AvdSweetspotPoint[];

  // Vollständige Kurve: alle 10 € AVD-Eigenanteil + 0 € (reiner ETF)
  chartPoints: AvdChartPoint[];
}

@Injectable({ providedIn: 'root' })
export class SparRechnerService {

  // ── Rentensteuer-Hilfsmethoden ────────────────────────────────────────────

  // Besteuerungsanteil nach JStG 2022: 83 % in 2023, +0,5 %/Jahr bis 100 % in 2058
  private besteuerungsanteil(retirementYear: number): number {
    return Math.min(1.0, 0.83 + 0.005 * Math.max(0, retirementYear - 2023));
  }

  // Zu versteuerndes Einkommen aus GRV-Rente (§22 Nr. 1 EStG)
  private taxableRenteZvE(annualGrossRente: number, retirementYear: number): number {
    const ratio = this.besteuerungsanteil(retirementYear);
    return Math.max(0, annualGrossRente * ratio - WERBUNGSKOSTEN_RENTNER - SONDERAUSGABEN_PAUSCH);
  }

  // §32a EStG 2024 — analytischer Grenzsteuersatz
  private marginalTaxRate(zvE: number): number {
    if (zvE <= GRUNDFREIBETRAG) return 0;
    if (zvE <= 17005) {
      const y = (zvE - GRUNDFREIBETRAG) / 10000;
      return Math.min(0.42, (2 * 979.18 * y + 1400) / 10000);
    }
    if (zvE <= 66760) {
      const z = (zvE - 17005) / 10000;
      return Math.min(0.42, (2 * 192.59 * z + 2397) / 10000);
    }
    if (zvE <= 277826) return 0.42;
    return 0.45;
  }

  // Grenzsteuersatz auf das AVD-Einkommen, gegeben GRV-Bruttorente und Alter
  computeAvdTaxRate(
    monthlyPensionGross: number | null,
    currentAge: number | null,
  ): { rate: number; retirementYear: number; besteuerungsanteil: number } {
    const CURRENT_YEAR = new Date().getFullYear();
    const retirementYear = currentAge != null
      ? CURRENT_YEAR + Math.max(0, 67 - currentAge)
      : CURRENT_YEAR + 30;
    const ba = this.besteuerungsanteil(retirementYear);

    if (monthlyPensionGross == null || monthlyPensionGross <= 0) {
      return { rate: AVD_CONSTANTS.FALLBACK_STEUERSATZ, retirementYear, besteuerungsanteil: ba };
    }

    const annualGrossRente = monthlyPensionGross * 12;
    const zvE = this.taxableRenteZvE(annualGrossRente, retirementYear);
    const rate = this.marginalTaxRate(zvE);
    return { rate, retirementYear, besteuerungsanteil: ba };
  }

  // ── AVD-Förderung ─────────────────────────────────────────────────────────

  private avdMonthlyBonus(monthlyOwn: number, eligibleChildren: number): number {
    if (monthlyOwn < AVD_CONSTANTS.MIN_OWN_MONTH) return 0;
    const yearlyOwn = Math.min(monthlyOwn * 12, 1800);
    const tier1 = Math.min(yearlyOwn, AVD_CONSTANTS.TIER1_CAP_YEAR) * AVD_CONSTANTS.TIER1_RATE;
    const tier2 = Math.max(0, yearlyOwn - AVD_CONSTANTS.TIER1_CAP_YEAR) * AVD_CONSTANTS.TIER2_RATE;
    const grundzulageYear = Math.min(tier1 + tier2, AVD_CONSTANTS.MAX_GRUNDZULAGE_YEAR);
    const kinderzulageYear = eligibleChildren * AVD_CONSTANTS.KINDERZULAGE_YEAR;
    return (grundzulageYear + kinderzulageYear) / 12;
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
    monthlyPensionGross: number | null = null,
    currentAge: number | null = null,
    etfTerPct: number = 0.25,
    avdCostPct: number = 1.0,
  ): AvdOptResult {
    const n = years * 12;
    // Effektive Renditen nach Kosten: ETF = Brutto − TER; AVD = 5 % (7 % − 2 % Infl.) − Kosten
    const r_etf = Math.max(0, etfAnnualRatePct - etfTerPct) / 100 / 12;
    const r_avd = Math.max(0, 5.0 - avdCostPct) / 100 / 12;

    const fvEtf = r_etf > 0 ? (Math.pow(1 + r_etf, n) - 1) / r_etf : n;
    const fvAvd = r_avd > 0 ? (Math.pow(1 + r_avd, n) - 1) / r_avd : n;

    // Grenzsteuersatz auf AVD-Auszahlung aus realen Rentendaten
    const taxInfo = this.computeAvdTaxRate(monthlyPensionGross, currentAge);
    const avdTaxRate = taxInfo.rate;

    // Monatl. Nettoeinkommen je 1 € monatl. investiert (4 %-Regel)
    const K_etf = fvEtf * AVD_CONSTANTS.ENTNAHMERATE / 12 * (1 - ETF_STEUERSATZ_EFFEKTIV);
    const K_avd = fvAvd * AVD_CONSTANTS.ENTNAHMERATE / 12 * (1 - avdTaxRate);

    // Referenz: reiner ETF-Sparplan
    const refMonthlyIncome = targetCapital * AVD_CONSTANTS.ENTNAHMERATE / 12 * (1 - ETF_STEUERSATZ_EFFEKTIV);

    const incomeFor = (own: number, etf: number): number => {
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      return (own + bonus) * K_avd + etf * K_etf;
    };

    // ---- Gleiche Rente, weniger sparen ----
    // Optimierungsgrenze: max. Eigenanteil mit voller Grundzulage (150 €/Monat)
    const maxAvdIncome = incomeFor(AVD_CONSTANTS.MAX_ZULAGE_MONTH, 0);

    let optAvdOwn: number;
    let optEtf: number;

    if (maxAvdIncome >= refMonthlyIncome) {
      // AVD allein reicht – minimale Eigeneinzahlung finden (binäre Suche)
      let lo = AVD_CONSTANTS.MIN_OWN_MONTH;
      let hi = AVD_CONSTANTS.MAX_ZULAGE_MONTH;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (incomeFor(mid, 0) >= refMonthlyIncome) hi = mid;
        else lo = mid + 1;
      }
      optAvdOwn = hi;
      optEtf = 0;
    } else {
      // AVD maximal ausschöpfen (bis volle Zulage), Rest via ETF
      optAvdOwn = AVD_CONSTANTS.MAX_ZULAGE_MONTH;
      const remaining = refMonthlyIncome - incomeFor(optAvdOwn, 0);
      optEtf = remaining > 0 ? Math.ceil(remaining / K_etf) : 0;
    }

    const optAvdBonus = this.avdMonthlyBonus(optAvdOwn, eligibleChildren);
    const optAvdDepot = optAvdOwn + optAvdBonus;
    const optTotal = optEtf + optAvdOwn;
    const optSaving = monthlyEtfRate - optTotal;
    const optSavingPct = monthlyEtfRate > 0 ? (optSaving / monthlyEtfRate) * 100 : 0;

    // Günstigerprüfung (§10a EStG): Sonderausgabenabzug vs. Zulage in der Ansparphase
    const guenstigerZulageYear = optAvdBonus * 12;
    const guenstigerAbzugsfaehigYear = optAvdOwn * 12 + guenstigerZulageYear;
    const guenstigerBreakEvenRate = guenstigerAbzugsfaehigYear > 0
      ? guenstigerZulageYear / guenstigerAbzugsfaehigYear
      : 0;

    // ---- Vollständige Kurve: zuerst alle Schritte berechnen ----
    const chartPoints: AvdChartPoint[] = [{
      ownMonth: 0, etfMonth: monthlyEtfRate, bonusMonth: 0, depotMonth: 0,
      avdIncome: 0,
      etfIncome: monthlyEtfRate * K_etf,
      netIncomeMonth: incomeFor(0, monthlyEtfRate),
    }];
    for (let own = AVD_CONSTANTS.MIN_OWN_MONTH; own <= Math.min(AVD_CONSTANTS.MAX_OWN_MONTH, monthlyEtfRate); own += 10) {
      const etf = Math.max(0, monthlyEtfRate - own);
      const bonus = this.avdMonthlyBonus(own, eligibleChildren);
      const depot = own + bonus;
      chartPoints.push({
        ownMonth: own, etfMonth: etf, bonusMonth: bonus,
        depotMonth: depot,
        avdIncome: depot * K_avd,
        etfIncome: etf * K_etf,
        netIncomeMonth: incomeFor(own, etf),
      });
    }

    // ---- Sweetspot: letzter Schritt innerhalb Tier-1-Förderung (50 %-Zone) ----
    const tier1MaxMonth = AVD_CONSTANTS.TIER1_CAP_YEAR / 12; // 30 €/Mon.
    const sweetspotOwnMonth = [...chartPoints]
      .filter(p => p.ownMonth > 0 && p.ownMonth <= tier1MaxMonth)
      .pop()?.ownMonth ?? chartPoints[1]?.ownMonth ?? 0;

    // ---- Gleiche Sparrate, mehr Rente: tatsächliches Einkommensmaximum ----
    const maxPt = chartPoints.reduce((best, p) =>
      p.netIncomeMonth > best.netIncomeMonth ? p : best, chartPoints[0]);
    const fullAvdOwn = maxPt.ownMonth;
    const fullEtf = maxPt.etfMonth;
    const fullAvdBonus = maxPt.bonusMonth;
    const fullMonthlyIncome = maxPt.netIncomeMonth;
    const fullGainPct = refMonthlyIncome > 0
      ? ((fullMonthlyIncome - refMonthlyIncome) / refMonthlyIncome) * 100 : 0;

    return {
      refMonthlyIncome,
      avdEffTaxRate: avdTaxRate,
      avdRetirementYear: taxInfo.retirementYear,
      avdBesteuerungsanteil: taxInfo.besteuerungsanteil,
      kAvd: K_avd,
      kEtf: K_etf,
      sweetspotOwnMonth,
      optEtf, optAvdOwn, optAvdBonus, optAvdDepot, optTotal, optSaving, optSavingPct,
      fullEtf, fullAvdOwn, fullAvdBonus, fullMonthlyIncome, fullGainPct,
      guenstigerBreakEvenRate, guenstigerAbzugsfaehigYear, guenstigerZulageYear,
      sweetspot: [],
      chartPoints,
    };
  }
}
