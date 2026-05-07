# AVD Steuerrecht — Recherchebasis für den Rechner

Stand: Mai 2026 (geplantes Inkrafttreten AVD: 01.01.2027)

---

## 1. Beitragsgrenzen

| Größe | Wert |
|---|---|
| Gesetzlicher Höchstbeitrag | **570 €/Monat = 6.840 €/Jahr** (§10a EStG AVD) |
| Eigenbeitrag für volle Grundzulage | **150 €/Monat = 1.800 €/Jahr** |
| Mindestbeitrag | **10 €/Monat = 120 €/Jahr** |

Beiträge über 150 €/Monat erhalten **keine zusätzliche Staatszulage** (Zulage ist bei 540 €/Jahr gedeckelt), werden aber trotzdem gefördert im Sinne des Sonderausgabenabzugs.

---

## 2. Staatszulage (Grundzulage)

| Tier | Eigenanteil/Jahr | Förderquote | Max. Zulage |
|---|---|---|---|
| Tier 1 | erste 360 € | **50 %** | 180 €/Jahr |
| Tier 2 | 361 – 1.800 € | **25 %** | 360 €/Jahr |
| Gesamt | max. 1.800 € | — | **540 €/Jahr** |

**Kinderzulage:** 300 €/Jahr je Kind mit Kindergeldanspruch (§32 EStG, i.d.R. bis 18 Jahre).

---

## 3. Günstigerprüfung (§10a EStG)

Während der Ansparphase prüft das Finanzamt automatisch, ob der **Sonderausgabenabzug** oder die **Staatszulage** vorteilhafter ist.

### Rechenlogik

```
Abzugsfähiger Betrag = Eigenbeitrag/Jahr + Zulage/Jahr
Steuerersparnis      = Abzugsfähiger Betrag × Grenzsteuersatz (Ansparphase)
Günstigerprüfungsgewinn = max(0, Steuerersparnis − Zulageanspruch)
```

Der Gewinn wird als **zusätzliche Steuererstattung** ausgezahlt (Finanzamt erstattet die Differenz).

### Break-even-Grenzsteuersatz

| Szenario | Eigenbeitrag | Zulage | Abzugsfähig | Break-even |
|---|---|---|---|---|
| Kinderlos, volle Grundzulage | 1.800 €/J | 540 €/J | 2.340 €/J | **~23,1 %** |
| 1 Kind, volle Zulage | 1.800 €/J | 840 €/J | 2.640 €/J | **~31,8 %** |
| 2 Kinder, volle Zulage | 1.800 €/J | 1.140 €/J | 2.940 €/J | **~38,8 %** |

**Fazit:** Wer kinderlos ist und einen Grenzsteuersatz > 23,1 % hat, profitiert vom Steuervorteil gegenüber der Zulage. Mit Kindern liegt der Break-even deutlich höher.

### Beispiel (kinderlos, 30 % Grenzsteuersatz)

```
Steuerersparnis = 2.340 × 0,30 = 702 €/Jahr
Zulage          = 540 €/Jahr
Günstigerprüfungsgewinn = 702 − 540 = 162 €/Jahr
```

---

## 4. Besteuerung der Entnahmen (Rentenphase)

### AVD-Entnahmen (§22 Nr. 5 EStG)
- AVD-Auszahlungen sind **sonstige Einkünfte** nach §22 EStG
- Besteuerung mit dem **individuellen Einkommensteuersatz** (Grenzsteuersatz)
- **KEIN** Sparerpauschbetrag (§20 Abs. 9 EStG gilt NICHT für §22-Einkünfte)
- **KEINE** Teilfreistellung (30 % gilt nur für §20-Einkünfte = ETF-Kapitalerträge)
- Der Grenzsteuersatz im Rentenalter hängt vom zvE aus der GRV-Rente ab (§32a EStG)

### ETF-Entnahmen (§20 EStG)
- Kapitalerträge aus ETF-Depot: **Abgeltungsteuer 25 % + Soli 5,5 % = 26,375 %**
- Bei Aktien-ETF (≥ 51 % Aktienquote): **30 % Teilfreistellung** → effektiver Satz **18,4625 %**
- **Sparerpauschbetrag 1.000 €/Jahr** (§20 Abs. 9 EStG) steuerfreigestellt
  - Nur auf den **Gewinnteil** der Entnahme anwendbar
  - Gewinnteil = gainFraction × monatliche Entnahme (für Entnahmeplan)
  - Voll abzugsfähig bei 4%-Regel (Annahme: 100 % Gewinn)

---

## 5. GRV-Rentenbesteuerung (für AVD-Grenzsteuersatz)

### Besteuerungsanteil (§22 Nr. 1 EStG, JStG 2022)
```
2023: 83 %
+0,5 % pro Jahr bis 2058 → 100 %
Formel: min(1,0; 0,83 + 0,005 × max(0, Renteneintrittsjahr − 2023))
```

### Zu versteuerndes Einkommen (ZvE)
```
ZvE = GRV-Rente × Besteuerungsanteil − 102 € (Werbungskostenpauschale) − 36 € (Sonderausgabenpauschale)
```

### Grenzsteuersatz (§32a EStG 2024)
| ZvE-Bereich | Grenzsteuersatz |
|---|---|
| bis 11.784 € | 0 % |
| 11.784 – 17.005 € | 14 – 24 % (Progressionszone 1) |
| 17.005 – 66.760 € | 24 – 42 % (Progressionszone 2) |
| 66.760 – 277.826 € | 42 % |
| über 277.826 € | 45 % |

---

## 6. Implementierungshinweise (Rechner)

### kapital-calculator.service.ts
- Entnahmeplan: gainFraction-Anteil je Entnahme, Sparerpauschbetrag (83,33 €/Monat) mindert Steuerlast
- 4%-Regel: Volles Einkommen als Gewinn, 1.000 €/Jahr Freibetrag abgezogen
- `monthlyGross = (net − F × t) / (1 − g × t)` wobei F = 83,33 €/Mon., g = gainFraction, t = 18,4625 %
- Wenn net ≤ F/g (klein): kein Gewinnanteil übrig, keine Steuer → gross = net

### spar-rechner.service.ts
- MAX_OWN_MONTH: 570 (gesetzlicher Höchstbeitrag, für Chartanzeige)
- MAX_ZULAGE_MONTH: 150 (volle Grundzulage, für Optimierungslogik)
- AVD-Entnahmen verwenden Einkommensteuer (kein Sparerpauschbetrag, keine Teilfreistellung)
- Günstigerprüfung: break-even = annualZulage / (annualOwn + annualZulage)
