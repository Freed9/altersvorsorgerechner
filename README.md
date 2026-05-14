# Rentenlückenrechner

Ein kostenloser, werbefreier Altersvorsorgerechner für Deutschland — mit AVD-Optimierung, Kapitalbedarf und interaktiver Sparplanberechnung. Alle Berechnungen laufen vollständig im Browser, ohne Server oder Datenweitergabe.

**Live:** [altersvorsorgerechner.org](https://www.altersvorsorgerechner.org)

---

## Was der Rechner kann

**Schritt 1 – Rentenlücke berechnen**
Ermittelt die monatliche Lücke zwischen dem heutigen Nettoeinkommen und der erwarteten gesetzlichen Nettorente — wahlweise über eine vereinfachte Formel oder per Rentenbescheid (Entgeltpunkte).

**Schritt 2 – Kapitalbedarf ermitteln**
Berechnet das benötigte Startkapital bei Rentenbeginn für zwei Entnahmestrategien: einen zeitlich begrenzten Auszahlungsplan (Entnahmeplan) und die ewige 4-%-Regel. Berücksichtigt vorhandenes Kapital und weitere Renteneinkünfte.

**Schritt 3 – Sparplan & AVD-Optimierung**
Berechnet die monatlich notwendige Sparrate und optimiert die Aufteilung zwischen klassischem ETF-Depot und dem Altersvorsorgedepot (AVD, ab 2027). Zeigt interaktiv, bei welchem AVD-Eigenanteil die staatliche Förderung (Grundzulage + Kinderzulage + Günstigerprüfung) den größten Effekt hat.

**Weitere Features**
- Interaktive Optimierungskurve (SVG-Chart) mit Sweetspot- und Optimum-Markierung
- Vollständige AVD-Detailtabelle mit Differenzsteuer-Berechnung
- Auszahlungsoptionen bei Rentenbeginn (Auszahlungsplan, Leibrente, Hybrid 30 %)
- Jungsparer-/Berufseinsteiger-Bonus für unter 25-Jährige
- Produktvergleich AVD vs. klassisches ETF-Depot
- Alphabetisches Glossar mit Volltextsuche (70+ Einträge)
- Keine Cookies, kein Tracking, keine persönlichen Daten

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Angular 21 (Standalone Components, Signals) |
| Sprache | TypeScript 5.9 |
| Styles | SCSS (BEM, CSS Custom Properties) |
| Rendering | Angular SSR (Server-Side Rendering) |
| Deployment | Docker · nginx (unprivileged) |
| CI/CD | GitHub Actions |
| Tests | Vitest |

---

## Lokale Entwicklung

**Voraussetzungen:** Node.js ≥ 20, npm

```bash
# Repository klonen
git clone https://github.com/Freed9/rentenluecke.git
cd rentenluecke

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (http://localhost:4200)
npm start
```

### Weitere Befehle

```bash
# Produktions-Build
npm run build

# Tests ausführen
npm test

# Docker-Image bauen (aus /docker)
docker build -f docker/Dockerfile -t rentenluecke .
```

---

## Projektstruktur

```
src/app/
├── components/
│   ├── rentenluecke/     # Schritt 1: Rentenlücke
│   ├── kapitalbedarf/    # Schritt 2: Kapitalbedarf
│   ├── sparrechner/      # Schritt 3: Sparplan & AVD-Optimierung
│   └── glossar/          # Glossar mit Suche
├── services/
│   ├── renten-calculator.service.ts
│   ├── kapital-calculator.service.ts
│   ├── spar-rechner.service.ts
│   └── app-state.service.ts
└── directives/
    └── info-tip.directive.ts
```

Alle Berechnungen sind in den Services gekapselt und unabhängig von der UI testbar.

---

## Beitragen

Beiträge sind willkommen — egal ob Bugfix, Verbesserungsvorschlag oder neues Feature.

### Via GitHub (bevorzugt)

1. **Issue erstellen** — beschreibe den Fehler oder die Idee unter [Issues](https://github.com/Freed9/rentenluecke/issues), bevor du mit der Umsetzung beginnst
2. **Fork & Branch** — forke das Repository und erstelle einen Feature-Branch:
   ```bash
   git checkout -b feat/mein-feature
   ```
3. **Änderungen committen** — halte Commits klein und beschreibend
4. **Pull Request öffnen** — beschreibe kurz was du geändert hast und warum

### Via Fork

Du kannst das Projekt natürlich auch forken und eigenständig weiterentwickeln — die MIT-Lizenz erlaubt das ausdrücklich, solange der Lizenzhinweis erhalten bleibt.

### Via E-Mail

Für Fragen, Hinweise auf Rechenfehler oder Feedback, das nicht öffentlich sein soll:

**kontakt@altersvorsorgerechner.org**

### Was besonders hilfreich wäre

- Hinweise auf Rechenfehler oder veraltete Gesetzesgrundlagen (das AVD-Gesetz ist noch im Entwurfsstadium)
- Verbesserungen der Barrierefreiheit
- Übersetzungen (aktuell nur Deutsch)
- Erweiterungen für Sonderfälle (Selbstständige, Beamte, …)

---

## Rechtliches

Dieses Projekt ist ein privates, nicht-kommerzielles Informationsangebot. Die Ergebnisse sind **keine Anlageberatung** und ersetzen keine individuelle Beratung durch einen Finanzfachmann. Alle Berechnungen basieren auf vereinfachten Modellannahmen.

Das Altersvorsorgedepot (AVD) basiert auf dem Referentenentwurf des pAV-RefG (Stand 2026) — Gesetzesänderungen vorbehalten.

**Lizenz:** [MIT](LICENSE)  
**Impressum & Kontakt:** [altersvorsorgerechner.org](https://www.altersvorsorgerechner.org)
