import { Injectable } from '@angular/core';

export const RENTEN_CONSTANTS = {
  DURCHSCHNITTSENTGELT: 51944,
  RENTENWERT: 39.32,
  BEITRAGSBEMESSUNGSGRENZE: 90600,
  RENTENALTER: 67,
  // Grundsicherung im Alter für Alleinstehende 2025: Regelsatz 563 € + ø KdU 370 €
  GRUNDSICHERUNG_SCHWELLE: 933,
  // Abzüge auf die Rente
  KV_BEITRAGSSATZ: 0.073,
  PV_BEITRAGSSATZ: 0.018,
  // Nettolohn-Berechnung: Steuerklasse 1, keine Kirchensteuer (Werte 2024)
  KV_AN: 0.0815,   // 7,3 % Basisbeitrag + Ø 0,85 % Zusatzbeitrag (AN-Anteil)
  PV_AN: 0.018,    // Arbeitnehmeranteil Pflegeversicherung
  RV_AN: 0.093,    // 18,6 % / 2
  AV_AN: 0.013,    // 2,6 % / 2
  WERBUNGSKOSTEN_PAUSCHBETRAG: 1230,
  SONDERAUSGABEN_PAUSCHBETRAG: 36,
  GRUNDFREIBETRAG: 11784,  // 2024
};

export interface RentenResult {
  totalPoints: number;
  monthlyPension: number;
  monthlyPensionNet: number;
  currentMonthlyNetIncome: number;
  pensionShortfallPercent: number;
  pointsAlreadyCollected: number;
  pointsStillToCollect: number;
  incomeWasCapped: boolean;
  monthlyGapAmount: number;
  belowGrundsicherung: boolean;
}

@Injectable({ providedIn: 'root' })
export class RentenCalculatorService {

  calculateSimple(currentAge: number, startAge: number, annualGrossIncome: number): RentenResult {
    const cappedIncome = Math.min(annualGrossIncome, RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE);
    const pointsPerYear = cappedIncome / RENTEN_CONSTANTS.DURCHSCHNITTSENTGELT;
    const yearsWorked = Math.max(0, currentAge - startAge);
    const yearsRemaining = Math.max(0, RENTEN_CONSTANTS.RENTENALTER - currentAge);
    const pointsAlreadyCollected = yearsWorked * pointsPerYear;
    const pointsStillToCollect = yearsRemaining * pointsPerYear;
    const totalPoints = pointsAlreadyCollected + pointsStillToCollect;
    const monthlyPension = totalPoints * RENTEN_CONSTANTS.RENTENWERT;
    const monthlyPensionNet = this.calcPensionNet(monthlyPension);
    const currentMonthlyNetIncome = this.calcCurrentNetIncome(annualGrossIncome) / 12;

    return {
      totalPoints,
      monthlyPension,
      monthlyPensionNet,
      currentMonthlyNetIncome,
      pensionShortfallPercent: this.calcShortfall(currentMonthlyNetIncome, monthlyPensionNet),
      pointsAlreadyCollected,
      pointsStillToCollect,
      incomeWasCapped: annualGrossIncome > RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE,
      monthlyGapAmount: Math.max(0, currentMonthlyNetIncome - monthlyPensionNet),
      belowGrundsicherung: monthlyPensionNet < RENTEN_CONSTANTS.GRUNDSICHERUNG_SCHWELLE,
    };
  }

  calculateAdvanced(
    pointsFromStatement: number,
    statementYear: number,
    currentAge: number,
    annualGrossIncome: number,
  ): RentenResult {
    const currentYear = new Date().getFullYear();
    const cappedIncome = Math.min(annualGrossIncome, RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE);
    const pointsPerYear = cappedIncome / RENTEN_CONSTANTS.DURCHSCHNITTSENTGELT;
    const yearsSinceStatement = Math.max(0, currentYear - statementYear);
    const yearsUntilRetirement = Math.max(0, RENTEN_CONSTANTS.RENTENALTER - currentAge);
    const pointsAlreadyCollected = pointsFromStatement + yearsSinceStatement * pointsPerYear;
    const pointsStillToCollect = yearsUntilRetirement * pointsPerYear;
    const totalPoints = pointsAlreadyCollected + pointsStillToCollect;
    const monthlyPension = totalPoints * RENTEN_CONSTANTS.RENTENWERT;
    const monthlyPensionNet = this.calcPensionNet(monthlyPension);
    const currentMonthlyNetIncome = this.calcCurrentNetIncome(annualGrossIncome) / 12;

    return {
      totalPoints,
      monthlyPension,
      monthlyPensionNet,
      currentMonthlyNetIncome,
      pensionShortfallPercent: this.calcShortfall(currentMonthlyNetIncome, monthlyPensionNet),
      pointsAlreadyCollected,
      pointsStillToCollect,
      incomeWasCapped: annualGrossIncome > RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE,
      monthlyGapAmount: Math.max(0, currentMonthlyNetIncome - monthlyPensionNet),
      belowGrundsicherung: monthlyPensionNet < RENTEN_CONSTANTS.GRUNDSICHERUNG_SCHWELLE,
    };
  }

  private calcPensionNet(gross: number): number {
    return gross * (1 - RENTEN_CONSTANTS.KV_BEITRAGSSATZ - RENTEN_CONSTANTS.PV_BEITRAGSSATZ);
  }

  private calcShortfall(currentNet: number, pensionNet: number): number {
    if (currentNet <= 0) return 0;
    return Math.max(0, ((currentNet - pensionNet) / currentNet) * 100);
  }

  calcCurrentNetIncome(annualGross: number): number {
    const bbg = RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE;
    const capped = Math.min(annualGross, bbg);
    const sv =
      capped * RENTEN_CONSTANTS.KV_AN +
      capped * RENTEN_CONSTANTS.PV_AN +
      capped * RENTEN_CONSTANTS.RV_AN +
      capped * RENTEN_CONSTANTS.AV_AN;
    const zvE = Math.max(
      0,
      annualGross - sv - RENTEN_CONSTANTS.WERBUNGSKOSTEN_PAUSCHBETRAG - RENTEN_CONSTANTS.SONDERAUSGABEN_PAUSCHBETRAG,
    );
    return annualGross - sv - this.calcEinkommensteuer(zvE);
  }

  // §32a EStG 2024 — Grundtabelle, kein Soli (ab 2021 für die meisten entfallen), keine KiSt
  private calcEinkommensteuer(zvE: number): number {
    if (zvE <= RENTEN_CONSTANTS.GRUNDFREIBETRAG) return 0;
    if (zvE <= 17005) {
      const y = (zvE - RENTEN_CONSTANTS.GRUNDFREIBETRAG) / 10000;
      return Math.floor((979.18 * y + 1400) * y);
    }
    if (zvE <= 66760) {
      const z = (zvE - 17005) / 10000;
      return Math.floor((192.59 * z + 2397) * z + 966);
    }
    if (zvE <= 277826) {
      return Math.floor(0.42 * zvE - 10602);
    }
    return Math.floor(0.45 * zvE - 18936);
  }
}
