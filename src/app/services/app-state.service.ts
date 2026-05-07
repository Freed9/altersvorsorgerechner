import { Injectable, signal, computed } from '@angular/core';

export type ActiveStep = 1 | 2 | 3;

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // Stepper navigation
  activeStep = signal<ActiveStep>(1);

  // Step 1 – Rentenlücke
  monthlyGap = signal<number | null>(null);
  currentAge = signal<number | null>(null);
  currentMonthlyNetIncome = signal<number | null>(null);
  monthlyPensionGross = signal<number | null>(null);

  // Step 2 – Kapitalbedarf
  kapitalCalculated = signal<boolean>(false);
  targetCapital = signal<number | null>(null);
  targetCapitalSource = signal<string | null>(null);
  existingCapital = signal<number>(0);

  // Completion flags
  step1Done = computed(() => this.monthlyGap() !== null);
  step2Done = computed(() => this.kapitalCalculated());

  navigateToKapital(monthlyGap: number): void {
    this.monthlyGap.set(monthlyGap);
    this.activeStep.set(2);
  }

  markKapitalDone(): void {
    this.kapitalCalculated.set(true);
  }

  navigateToSparrechner(capital: number, source: string): void {
    // Reset to null first so the effect in Sparrechner always re-fires,
    // even when the capital value hasn't changed since the last navigation.
    this.targetCapital.set(null);
    this.targetCapital.set(capital);
    this.targetCapitalSource.set(source);
    this.kapitalCalculated.set(true);
    this.activeStep.set(3);
  }
}
