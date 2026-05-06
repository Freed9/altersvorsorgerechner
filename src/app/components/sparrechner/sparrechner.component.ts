import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SparRechnerService, SparrateResult, KapitalResult, AvdOptResult, SPAR_CONSTANTS, AVD_CONSTANTS } from '../../services/spar-rechner.service';
import { AppStateService } from '../../services/app-state.service';

type Mode = 'sparrate' | 'kapital';

@Component({
  selector: 'app-sparrechner',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './sparrechner.component.html',
  styleUrl: './sparrechner.component.scss',
})
export class SparrechnnerComponent {
  private fb = inject(FormBuilder);
  private service = inject(SparRechnerService);
  appState = inject(AppStateService);

  readonly defaults = SPAR_CONSTANTS;
  readonly avdConst = AVD_CONSTANTS;

  mode = signal<Mode>('sparrate');
  sparrateResult = signal<SparrateResult | null>(null);
  kapitalResult = signal<KapitalResult | null>(null);
  avdResult = signal<AvdOptResult | null>(null);

  children = signal<{ age: number }[]>([]);
  eligibleChildrenCount = computed(() => this.children().filter(c => c.age < 18).length);

  etfTer = signal(0.25);   // TER in % (0–1.5)
  avdCost = signal(1.0);   // AVD-Kosten in % (0–1.5)

  readonly CHART = { W: 540, H: 200, PAD: { t: 16, r: 20, b: 44, l: 58 } };

  hoverPoint = signal<{
    index: number; left: number; top: number; rightSide: boolean;
    svgX: number; svgY: number;
  } | null>(null);

  chartData = computed(() => {
    const avd = this.avdResult();
    if (!avd || avd.chartPoints.length < 2) return null;
    const pts = avd.chartPoints;
    const { W, H, PAD } = this.CHART;
    const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;

    // X = AVD-Eigenanteil (ownMonth), Y = Nettorente (netIncomeMonth)
    const maxOwn = pts[pts.length - 1].ownMonth;
    const incomes = pts.map(p => p.netIncomeMonth);
    const rawMinY = Math.min(...incomes), rawMaxY = Math.max(...incomes);
    const yPad = (rawMaxY - rawMinY) * 0.10 || 1;
    const minY = rawMinY - yPad, maxY = rawMaxY + yPad;

    const sx = (own: number) => PAD.l + (own / (maxOwn || 1)) * iW;
    const sy = (inc: number) => PAD.t + iH - ((inc - minY) / (maxY - minY)) * iH;

    const scaled = pts.map(p => ({ ...p, sx: sx(p.ownMonth), sy: sy(p.netIncomeMonth) }));

    let line = `M ${scaled[0].sx.toFixed(1)} ${scaled[0].sy.toFixed(1)}`;
    for (let i = 1; i < scaled.length; i++) {
      const cp = ((scaled[i - 1].sx + scaled[i].sx) / 2).toFixed(1);
      line += ` C ${cp} ${scaled[i - 1].sy.toFixed(1)},${cp} ${scaled[i].sy.toFixed(1)},${scaled[i].sx.toFixed(1)} ${scaled[i].sy.toFixed(1)}`;
    }
    const baseY = (PAD.t + iH).toFixed(1);
    const area = `${line} L ${scaled.at(-1)!.sx.toFixed(1)} ${baseY} L ${scaled[0].sx.toFixed(1)} ${baseY} Z`;

    // X-Ticks: 0, 50, 100, 150 (bei kleinem Budget ggf. 10er-Schritte)
    const xTickStep = maxOwn <= 50 ? 10 : 50;
    const xTicks: { label: number; svgX: number }[] = [];
    for (let v = 0; v <= maxOwn; v += xTickStep) xTicks.push({ label: v, svgX: sx(v) });

    // Y-Ticks: schöne Intervalle
    const rough = (rawMaxY - rawMinY) / 4 || 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const d = rough / mag;
    let yStep = d < 1.5 ? mag : d < 3 ? 2 * mag : d < 7 ? 5 * mag : 10 * mag;
    yStep = Math.max(yStep, 0.01);
    const yTicks: { label: number; svgY: number }[] = [];
    for (let v = Math.ceil(rawMinY / yStep) * yStep; v <= rawMaxY + yStep * 0.1; v += yStep) {
      yTicks.push({ label: Math.round(v * 100) / 100, svgY: sy(v) });
    }

    return { scaled, line, area, xTicks, yTicks, W, H, PAD, iW, iH, maxOwn };
  });

  sparrateForm = this.fb.nonNullable.group({
    targetCapital: [0, [Validators.required, Validators.min(1)]],
    startingCapital: [0, [Validators.required, Validators.min(0)]],
    years: [SPAR_CONSTANTS.DEFAULT_JAHRE, [Validators.required, Validators.min(1), Validators.max(60)]],
    rendite: [SPAR_CONSTANTS.DEFAULT_RENDITE, [Validators.required, Validators.min(0.1), Validators.max(20)]],
  });

  kapitalForm = this.fb.nonNullable.group({
    monthlyRate: [0, [Validators.required, Validators.min(1)]],
    startingCapital: [0, [Validators.required, Validators.min(0)]],
    years: [SPAR_CONSTANTS.DEFAULT_JAHRE, [Validators.required, Validators.min(1), Validators.max(60)]],
    rendite: [SPAR_CONSTANTS.DEFAULT_RENDITE, [Validators.required, Validators.min(0.1), Validators.max(20)]],
  });

  constructor() {
    effect(() => {
      const capital = this.appState.targetCapital();
      if (capital !== null) {
        const age = this.appState.currentAge();
        const years = age !== null
          ? Math.max(1, Math.min(60, 67 - age))
          : SPAR_CONSTANTS.DEFAULT_JAHRE;
        const existing = untracked(() => this.appState.existingCapital());
        this.sparrateForm.patchValue({ targetCapital: Math.round(capital), years, startingCapital: existing });
        this.calculate();
      }
    }, { allowSignalWrites: true });
  }

  savingsRatePct(monthlyRate: number): number | null {
    const net = this.appState.currentMonthlyNetIncome();
    if (!net || net <= 0) return null;
    return (monthlyRate / net) * 100;
  }

  dynamisierungRate(monthlyRate: number): number {
    return monthlyRate * 1.02;
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.sparrateResult.set(null);
    this.kapitalResult.set(null);
    this.avdResult.set(null);
    this.children.set([]);
  }

  calculate(): void {
    if (this.mode() === 'sparrate') {
      if (this.sparrateForm.invalid) { this.sparrateForm.markAllAsTouched(); return; }
      const { targetCapital, startingCapital, years, rendite } = this.sparrateForm.getRawValue();
      const sr = this.service.calculateSparrate(targetCapital, years, rendite, startingCapital);
      this.sparrateResult.set(sr);
      this.avdResult.set(this.service.calculateAvdOptimization(
        sr.finalCapital, sr.monthlyRate, years, rendite,
        this.eligibleChildrenCount(),
        this.appState.monthlyPensionGross(),
        this.appState.currentAge(),
        this.etfTer(),
        this.avdCost(),
      ));
    } else {
      if (this.kapitalForm.invalid) { this.kapitalForm.markAllAsTouched(); return; }
      const { monthlyRate, startingCapital, years, rendite } = this.kapitalForm.getRawValue();
      this.kapitalResult.set(this.service.calculateKapital(monthlyRate, years, rendite, startingCapital));
      this.avdResult.set(null);
    }
  }

  private recalculateAvd(): void {
    const sr = this.sparrateResult();
    if (!sr) return;
    const { years, rendite } = this.sparrateForm.getRawValue();
    this.avdResult.set(this.service.calculateAvdOptimization(
      sr.finalCapital, sr.monthlyRate, years, rendite,
      this.eligibleChildrenCount(),
      this.appState.monthlyPensionGross(),
      this.appState.currentAge(),
      this.etfTer(),
      this.avdCost(),
    ));
  }

  onCostChange(field: 'etfTer' | 'avdCost', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const val = Math.round(parseFloat(raw) * 100) / 100;
    if (isNaN(val) || val < 0 || val > 1.5) return;
    if (field === 'etfTer') this.etfTer.set(val);
    else this.avdCost.set(val);
    this.recalculateAvd();
  }

  addChild(): void {
    if (this.children().length < 9) {
      this.children.update(arr => [...arr, { age: 5 }]);
      this.recalculateAvd();
    }
  }

  removeChild(index: number): void {
    this.children.update(arr => arr.filter((_, i) => i !== index));
    this.recalculateAvd();
  }

  updateChildAge(index: number, event: Event): void {
    const age = +(event.target as HTMLInputElement).value;
    if (!isNaN(age) && age >= 0 && age <= 25) {
      this.children.update(arr => arr.map((c, i) => i === index ? { age } : c));
      this.recalculateAvd();
    }
  }

  onChartMouseMove(event: MouseEvent): void {
    const el = event.currentTarget as SVGSVGElement;
    const sr = el.getBoundingClientRect();
    const data = this.chartData();
    if (!data) return;
    const svgX = ((event.clientX - sr.left) / sr.width) * data.W;
    let best = 0, minD = Infinity;
    data.scaled.forEach((p, i) => { const d = Math.abs(p.sx - svgX); if (d < minD) { minD = d; best = i; } });
    const wr = el.parentElement!.getBoundingClientRect();
    this.hoverPoint.set({
      index: best,
      left: event.clientX - wr.left,
      top: event.clientY - wr.top,
      rightSide: event.clientX - wr.left > wr.width / 2,
      svgX: data.scaled[best].sx,
      svgY: data.scaled[best].sy,
    });
  }

  onChartMouseLeave(): void { this.hoverPoint.set(null); }
}
