import { Injectable } from '@angular/core';
import { JAHRESWERTE as JW } from '../constants/jahreswerte';

export const RENTEN_CONSTANTS = {
  DURCHSCHNITTSENTGELT:      JW.DURCHSCHNITTSENTGELT,
  RENTENWERT:                JW.RENTENWERT,
  BEITRAGSBEMESSUNGSGRENZE:  JW.BBG,
  RENTENALTER:               JW.RENTENALTER,
  GRUNDSICHERUNG_SCHWELLE:   JW.GRUNDSICHERUNG_SCHWELLE,
  KV_BEITRAGSSATZ:           JW.KV_RENTNER,
  PV_BEITRAGSSATZ:           JW.PV_RENTNER_ELTERNTEIL,
  KV_AN:                     JW.KV_AN,
  PV_AN:                     JW.PV_AN_ELTERNTEIL,
  RV_AN:                     JW.RV_AN,
  AV_AN:                     JW.AV_AN,
  WERBUNGSKOSTEN_PAUSCHBETRAG: JW.WERBUNGSKOSTEN_AN,
  SONDERAUSGABEN_PAUSCHBETRAG: JW.SONDERAUSGABEN_PAUSCHBETRAG,
  GRUNDFREIBETRAG:           JW.GRUNDFREIBETRAG,
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
    const capped = Math.min(annualGross, RENTEN_CONSTANTS.BEITRAGSBEMESSUNGSGRENZE);
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

  // §32a EStG — Grundtabelle, kein Soli (ab 2021 für die meisten entfallen), keine KiSt
  private calcEinkommensteuer(zvE: number): number {
    const { GRUNDFREIBETRAG: GF, ESTG: e } = JW;
    if (zvE <= GF) return 0;
    if (zvE <= e.ZONE1_BIS) {
      const y = (zvE - GF) / 10000;
      return Math.floor((e.Z1_A * y + e.Z1_B) * y);
    }
    if (zvE <= e.ZONE2_BIS) {
      const z = (zvE - e.ZONE1_BIS) / 10000;
      return Math.floor((e.Z2_A * z + e.Z2_B) * z + e.Z2_C);
    }
    if (zvE <= e.ZONE3_BIS) return Math.floor(0.42 * zvE - e.Z3_OFFSET);
    return Math.floor(0.45 * zvE - e.Z4_OFFSET);
  }
}
