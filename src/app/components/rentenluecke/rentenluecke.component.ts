import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RentenCalculatorService, RentenResult, RENTEN_CONSTANTS } from '../../services/renten-calculator.service';
import { JAHRESWERTE } from '../../constants/jahreswerte';
import { AppStateService } from '../../services/app-state.service';
import { InfoTipDirective } from '../../directives/info-tip.directive';

type Mode = 'simple' | 'advanced';

@Component({
  selector: 'app-rentenluecke',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, InfoTipDirective],
  templateUrl: './rentenluecke.component.html',
  styleUrl: './rentenluecke.component.scss',
})
export class RentenlueckeComponent {
  private fb = inject(FormBuilder);
  private calculator = inject(RentenCalculatorService);
  private appState = inject(AppStateService);

  readonly constants = RENTEN_CONSTANTS;
  readonly jw = JAHRESWERTE;

  mode = signal<Mode>('simple');
  result = signal<RentenResult | null>(null);

  simpleForm = this.fb.nonNullable.group({
    currentAge: [35, [Validators.required, Validators.min(18), Validators.max(66)]],
    startAge: [22, [Validators.required, Validators.min(14), Validators.max(65)]],
    annualGrossIncome: [45000, [Validators.required, Validators.min(1)]],
  });

  advancedForm = this.fb.nonNullable.group({
    pointsFromStatement: [0, [Validators.required, Validators.min(0)]],
    statementYear: [
      new Date().getFullYear() - 1,
      [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear())],
    ],
    currentAge: [35, [Validators.required, Validators.min(18), Validators.max(66)]],
    annualGrossIncome: [45000, [Validators.required, Validators.min(1)]],
  });

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.result.set(null);
  }

  goToKapital(gap: number): void {
    this.appState.navigateToKapital(gap);
  }

  calculate(): void {
    if (this.mode() === 'simple') {
      if (this.simpleForm.invalid) {
        this.simpleForm.markAllAsTouched();
        return;
      }
      const { currentAge, startAge, annualGrossIncome } = this.simpleForm.getRawValue();
      this.appState.currentAge.set(currentAge);
      this.appState.annualGrossIncome.set(annualGrossIncome);
      const r = this.calculator.calculateSimple(currentAge, startAge, annualGrossIncome);
      this.result.set(r);
      this.appState.currentMonthlyNetIncome.set(r.currentMonthlyNetIncome);
      this.appState.monthlyPensionGross.set(r.monthlyPension);
    } else {
      if (this.advancedForm.invalid) {
        this.advancedForm.markAllAsTouched();
        return;
      }
      const { pointsFromStatement, statementYear, currentAge, annualGrossIncome } =
        this.advancedForm.getRawValue();
      this.appState.currentAge.set(currentAge);
      this.appState.annualGrossIncome.set(annualGrossIncome);
      const r = this.calculator.calculateAdvanced(pointsFromStatement, statementYear, currentAge, annualGrossIncome);
      this.result.set(r);
      this.appState.currentMonthlyNetIncome.set(r.currentMonthlyNetIncome);
      this.appState.monthlyPensionGross.set(r.monthlyPension);
    }
  }
}
