import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AppStateService, ActiveStep } from './services/app-state.service';
import { RentenlueckeComponent } from './components/rentenluecke/rentenluecke.component';
import { KapitalbedarfComponent } from './components/kapitalbedarf/kapitalbedarf.component';
import { SparrechnnerComponent } from './components/sparrechner/sparrechner.component';

@Component({
  selector: 'app-root',
  imports: [RentenlueckeComponent, KapitalbedarfComponent, SparrechnnerComponent, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  appState = inject(AppStateService);
  readonly currentYear = new Date().getFullYear();
  impressumOpen = signal(false);
  disclaimerOpen = signal(false);
  licenseOpen = signal(false);
  consentGiven = signal(App.readConsent());
  consentChecked = signal(false);

  private static readConsent(): boolean {
    return document.cookie.split(';').some(c => c.trim() === 'rl-consent=1');
  }

  acceptConsent(): void {
    document.cookie = `rl-consent=1; max-age=${365 * 24 * 60 * 60}; SameSite=Lax; path=/`;
    this.consentGiven.set(true);
  }

  setStep(n: ActiveStep): void {
    if (n === 1) { this.appState.activeStep.set(1); return; }
    if (n === 2 && this.appState.step1Done()) { this.appState.activeStep.set(2); return; }
    if (n === 3 && this.appState.step2Done()) { this.appState.activeStep.set(3); return; }
  }
}
