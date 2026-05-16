import { Injectable } from '@angular/core';
import { JAHRESWERTE as JW } from '../constants/jahreswerte';

export const KAPITAL_CONSTANTS = {
  ENTNAHMEPLAN_RATE: 0.04,
  ENTNAHMEPLAN_YEARS: 28,
  VIER_PROZENT_RATE: 0.04,
  KEST_SOLI_RATE:       JW.KEST_SOLI,
  TEILFREISTELLUNG_ETF: JW.TEILFREISTELLUNG_ETF,
  INFLATION_RATE: 0.02,
  SPARERPAUSCHBETRAG:   JW.SPARERPAUSCHBETRAG,
};

// Effektiver Steuersatz auf Kursgewinne/Ausschüttungen im ETF
const EFFEKTIVER_STEUERSATZ = JW.KEST_ETF_EFFEKTIV;

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
    const kest = KAPITAL_CONSTANTS.KEST_SOLI_RATE;
    const freibetragMonth = KAPITAL_CONSTANTS.SPARERPAUSCHBETRAG / 12;

    let monthlyGross: number;
    let monthlyTax: number;

    if (monthlyNetTarget > freibetragMonth / gainFraction) {
      // Freibetrag kleiner als monatlicher Gewinnanteil: Steuer auf Überschuss
      // tax  = gross × g × t  −  (SPB/12) × KEST_SOLI
      // net  = gross × (1 − g×t) + (SPB/12) × KEST_SOLI
      // →  gross = (net − (SPB/12) × KEST_SOLI) / (1 − g×t)
      monthlyGross = (monthlyNetTarget - freibetragMonth * kest) / (1 - gainFraction * t);
      monthlyTax = monthlyGross * gainFraction * t - freibetragMonth * kest;
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
    const F = KAPITAL_CONSTANTS.SPARERPAUSCHBETRAG;
    const t = EFFEKTIVER_STEUERSATZ;
    const kest = KAPITAL_CONSTANTS.KEST_SOLI_RATE;
    const tf = KAPITAL_CONSTANTS.TEILFREISTELLUNG_ETF;
    // Steuerfreie Schwelle: gain × (1−TF) ≤ SPB → net ≤ SPB / (1−TF)
    const noTaxThreshold = F / (1 - tf);

    let annualGross: number;
    let annualTax: number;

    if (annualNetNeeded > noTaxThreshold) {
      // tax  = gross × t  −  F × KEST_SOLI
      // net  = gross × (1−t) + F × KEST_SOLI
      // →  gross = (net − F × KEST_SOLI) / (1−t)
      annualGross = (annualNetNeeded - F * kest) / (1 - t);
      annualTax = annualGross * t - F * kest;
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
