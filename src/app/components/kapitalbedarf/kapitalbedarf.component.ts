import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { KapitalCalculatorService, EntnahmeplanResult, VierProzentResult, KAPITAL_CONSTANTS } from '../../services/kapital-calculator.service';
import { AppStateService } from '../../services/app-state.service';
import { InfoTipDirective } from '../../directives/info-tip.directive';

@Component({
  selector: 'app-kapitalbedarf',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, InfoTipDirective],
  templateUrl: './kapitalbedarf.component.html',
  styleUrl: './kapitalbedarf.component.scss',
})
export class KapitalbedarfComponent {
  private fb = inject(FormBuilder);
  private kapitalCalculator = inject(KapitalCalculatorService);
  appState = inject(AppStateService);

  readonly constants = KAPITAL_CONSTANTS;
  readonly purchasingPowerPct = Math.round(
    (1 / Math.pow(1 + KAPITAL_CONSTANTS.INFLATION_RATE, KAPITAL_CONSTANTS.ENTNAHMEPLAN_YEARS)) * 100,
  );

  entnahmeResult = signal<EntnahmeplanResult | null>(null);
  vierProzentResult = signal<VierProzentResult | null>(null);

  form = this.fb.nonNullable.group({
    monthlyGap: [0, [Validators.required, Validators.min(1)]],
    otherMonthlyIncome: [0, [Validators.required, Validators.min(0)]],
    existingCapital: [0, [Validators.required, Validators.min(0)]],
  });

  get effectiveGap(): number {
    const gap = this.form.get('monthlyGap')?.value ?? 0;
    const other = this.form.get('otherMonthlyIncome')?.value ?? 0;
    return Math.max(0, gap - other);
  }

  existingCapitalGrown(targetCapital: number): number {
    const ec = this.form.get('existingCapital')?.value ?? 0;
    if (ec <= 0) return 0;
    const age = this.appState.currentAge();
    const years = age !== null ? Math.max(1, 67 - age) : 30;
    return ec * Math.pow(1.05, years);
  }

  remainingTarget(targetCapital: number): number {
    const grown = this.existingCapitalGrown(targetCapital);
    return Math.max(0, targetCapital - grown);
  }

  constructor() {
    effect(() => {
      const gap = this.appState.monthlyGap();
      if (gap !== null) {
        this.form.patchValue({ monthlyGap: gap });
        this.calculate();
      }
    }, { allowSignalWrites: true });
  }

  calculate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const effectiveGap = this.effectiveGap;
    this.entnahmeResult.set(this.kapitalCalculator.calculateEntnahmeplan(effectiveGap));
    this.vierProzentResult.set(this.kapitalCalculator.calculateVierProzent(effectiveGap));
    this.appState.markKapitalDone();
  }

  goToSparrechner(source: 'Entnahmeplan' | '4%-Regel'): void {
    // Always recalculate with the current form state (e.g. otherMonthlyIncome
    // may have changed since the last explicit "Berechnen" click).
    this.calculate();
    const capital = source === 'Entnahmeplan'
      ? this.entnahmeResult()?.requiredCapital
      : this.vierProzentResult()?.requiredCapital;
    if (capital == null) return;
    this.appState.existingCapital.set(this.form.get('existingCapital')?.value ?? 0);
    this.appState.navigateToSparrechner(capital, source);
  }
}
