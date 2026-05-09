import { Component, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { AppStateService, ActiveStep } from './services/app-state.service';
import { RentenlueckeComponent } from './components/rentenluecke/rentenluecke.component';
import { KapitalbedarfComponent } from './components/kapitalbedarf/kapitalbedarf.component';
import { SparrechnnerComponent } from './components/sparrechner/sparrechner.component';
import { GlossarComponent } from './components/glossar/glossar.component';

@Component({
  selector: 'app-root',
  imports: [RentenlueckeComponent, KapitalbedarfComponent, SparrechnnerComponent, DecimalPipe, GlossarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  appState = inject(AppStateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly currentYear = new Date().getFullYear();
  impressumOpen = signal(false);
  disclaimerOpen = signal(false);
  licenseOpen = signal(false);
  datenschutzOpen = signal(false);
  consentGiven = signal(this.isBrowser && App.readConsent());
  consentChecked = signal(false);

  private _stepScrollInit = false;

  constructor() {
    effect(() => {
      const step = this.appState.activeStep();
      if (!this._stepScrollInit) { this._stepScrollInit = true; return; }
      if (!this.isBrowser) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(`step-${step}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  private static readConsent(): boolean {
    return document.cookie.split(';').some(c => c.trim() === 'rl-consent=1');
  }

  acceptConsent(): void {
    document.cookie = `rl-consent=1; max-age=${14 * 24 * 60 * 60}; SameSite=Lax; path=/`;
    this.consentGiven.set(true);
  }

  setStep(n: ActiveStep): void {
    if (n === 1) { this.appState.activeStep.set(1); return; }
    if (n === 2 && this.appState.step1Done()) { this.appState.activeStep.set(2); return; }
    if (n === 3 && this.appState.step2Done()) { this.appState.activeStep.set(3); return; }
  }
}
