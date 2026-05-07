import { Injectable } from '@angular/core';

export const KAPITAL_CONSTANTS = {
  ENTNAHMEPLAN_RATE: 0.04,        // 4 % p.a.
  ENTNAHMEPLAN_YEARS: 28,
  VIER_PROZENT_RATE: 0.04,
  KEST_SOLI_RATE: 0.26375,        // 25 % KESt + 5,5 % Soli = 26,375 %
  TEILFREISTELLUNG_ETF: 0.30,     // 30 % Teilfreistellung Aktien-ETF (≥ 51 % Aktienquote)
  INFLATION_RATE: 0.02,
  SPARERPAUSCHBETRAG: 1000,       // §20 Abs. 9 EStG — gilt nur für ETF-Depot, NICHT für AVD
};

// Effektiver Steuersatz auf Kursgewinne/Ausschüttungen im ETF
const EFFEKTIVER_STEUERSATZ = KAPITAL_CONSTANTS.KEST_SOLI_RATE * (1 - KAPITAL_CONSTANTS.TEILFREISTELLUNG_ETF);

export interface EntnahmeplanResult {
  requiredCapital: number;
  monthlyGross: number;
  monthlyTax: number;
  monthlyNet: number;
  totalWithdrawn: number;
  gainFromReturns: number;
  gainFraction: number;
}

export interface VierProzentResult {
  requiredCapital: number;
  monthlyGross: number;
  monthlyTax: number;
  monthlyNet: number;
  annualGross: number;
  annualTax: number;
  annualNet: number;
}

@Injectable({ providedIn: 'root' })
export class KapitalCalculatorService {

  // monthlyNetTarget ist die gewünschte monatliche NETTO-Entnahme (= Rentenlücke)
  calculateEntnahmeplan(monthlyNetTarget: number): EntnahmeplanResult {
    const r = KAPITAL_CONSTANTS.ENTNAHMEPLAN_RATE / 12;
    const n = KAPITAL_CONSTANTS.ENTNAHMEPLAN_YEARS * 12;

    // Renditeanteil an der Gesamtentnahme (unabhängig von der Entnahmehöhe)
    // gainFraction = 1 − (1 − (1+r)^−n) / (r × n)
    const pvFactor = (1 - Math.pow(1 + r, -n)) / r;
    const gainFraction = 1 - pvFactor / n;
    const t = EFFEKTIVER_STEUERSATZ;
    const freibetragMonth = KAPITAL_CONSTANTS.SPARERPAUSCHBETRAG / 12; // 83,33 €/Mon.

    let monthlyGross: number;
    let monthlyTax: number;

    if (monthlyNetTarget > freibetragMonth / gainFraction) {
      // Freibetrag kleiner als monatlicher Gewinnanteil: Steuer auf Überschuss
      // net = gross × (1 − g×t) + F×t  →  gross = (net − F×t) / (1 − g×t)
      monthlyGross = (monthlyNetTarget - freibetragMonth * t) / (1 - gainFraction * t);
      monthlyTax = (monthlyGross * gainFraction - freibetragMonth) * t;
    } else {
      // Gewinnanteil vollständig durch Freibetrag gedeckt → keine Steuer
      monthlyGross = monthlyNetTarget;
      monthlyTax = 0;
    }

    const requiredCapital = monthlyGross * pvFactor;
    const totalWithdrawn = monthlyGross * n;
    const gainFromReturns = totalWithdrawn - requiredCapital;

    return { requiredCapital, monthlyGross, monthlyTax, monthlyNet: monthlyNetTarget, totalWithdrawn, gainFromReturns, gainFraction };
  }

  calculateVierProzent(monthlyNetTarget: number): VierProzentResult {
    const annualNetNeeded = monthlyNetTarget * 12;
    const F = KAPITAL_CONSTANTS.SPARERPAUSCHBETRAG; // 1.000 €/Jahr
    const t = EFFEKTIVER_STEUERSATZ;

    let annualGross: number;
    let annualTax: number;

    if (annualNetNeeded > F) {
      // net = gross × (1−t) + F×t  →  gross = (net − F×t) / (1−t)
      annualGross = (annualNetNeeded - F * t) / (1 - t);
      annualTax = (annualGross - F) * t;
    } else {
      // Entnahme vollständig durch Freibetrag steuerfreigestellt
      annualGross = annualNetNeeded;
      annualTax = 0;
    }

    const requiredCapital = annualGross / KAPITAL_CONSTANTS.VIER_PROZENT_RATE;

    return {
      requiredCapital,
      monthlyGross: annualGross / 12,
      monthlyTax: annualTax / 12,
      monthlyNet: monthlyNetTarget,
      annualGross,
      annualTax,
      annualNet: annualNetNeeded,
    };
  }
}
