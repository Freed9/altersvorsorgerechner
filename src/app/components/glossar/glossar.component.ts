import { Component, signal, computed } from '@angular/core';

export interface GlossarEntry {
  type: 'abbr' | 'term';
  term: string;
  short?: string;
  definition: string;
  table?: { headers: string[]; rows: string[][] };
  link?: { text: string; url: string };
}

const ENTRIES: GlossarEntry[] = [
  // ── Abkürzungen ─────────────────────────────────────────────────────────────
  {
    type: 'abbr', term: 'AN',
    short: 'Arbeitnehmer',
    definition: 'Beschäftigte Person im Rahmen eines Arbeitsverhältnisses. Sozialversicherungsbeiträge werden je zur Hälfte vom Arbeitnehmer (AN) und vom Arbeitgeber (AG) getragen.',
  },
  {
    type: 'abbr', term: 'AV',
    short: 'Arbeitslosenversicherung',
    definition: 'Pflichtversicherung im Rahmen der gesetzlichen Sozialversicherung. Sichert Arbeitnehmer bei Arbeitslosigkeit ab. AN-Anteil 2024: 1,3 % des Bruttolohns (bis BBG).',
  },
  {
    type: 'abbr', term: 'AVD',
    short: 'Altersvorsorgedepot',
    definition: 'Staatlich gefördertes Wertpapierdepot für die private Altersvorsorge, geplant ab 01.01.2027. Kombiniert Einzahlungen in einen Investmentfonds mit staatlicher Grundzulage und Kinderzulage. Auszahlung als lebenslange Rente ab dem gesetzlichen Rentenalter.',
    link: { text: '§ 10a EStG – Gesetzestext (gesetze-im-internet.de)', url: 'https://www.gesetze-im-internet.de/estg/__10a.html' },
  },
  {
    type: 'abbr', term: 'BBG',
    short: 'Beitragsbemessungsgrenze',
    definition: 'Einkommensgrenze in der gesetzlichen Sozialversicherung, bis zu der Beiträge berechnet werden. Einkommensteile oberhalb der BBG sind beitragsfrei. BBG 2024 (GRV/AV West): 90.600 €/Jahr.',
  },
  {
    type: 'abbr', term: 'DSGVO',
    short: 'Datenschutz-Grundverordnung',
    definition: 'Europäische Verordnung zum Schutz personenbezogener Daten (EU 2016/679), seit 25.05.2018 in Kraft. Regelt Erhebung, Verarbeitung und Speicherung personenbezogener Daten in der EU.',
  },
  {
    type: 'abbr', term: 'EP',
    short: 'Entgeltpunkt(e)',
    definition: 'Berechnungseinheit der gesetzlichen Rentenversicherung. Ein Entgeltpunkt (EP) entspricht einem Jahresbruttoverdienst in Höhe des Durchschnittsentgelts (2024: 45.358 €). Die Summe aller EP × aktueller Rentenwert ergibt die monatliche Bruttorente.',
  },
  {
    type: 'abbr', term: 'ESt',
    short: 'Einkommensteuer',
    definition: 'Steuer auf das Einkommen natürlicher Personen. Rechtsgrundlage: §§ 1–56 EStG. Berechnung nach dem Grundtarif (§32a EStG) auf das zu versteuernde Einkommen (ZvE). Progressiver Stufentarif: 0 % bis 45 %.',
  },
  {
    type: 'abbr', term: 'EStG',
    short: 'Einkommensteuergesetz',
    definition: 'Deutsches Bundesgesetz, das die Einkommensteuer regelt. Enthält u. a. §32a (Grundtarif), §10a (Altersvorsorgeaufwendungen / AVD-Zulage), §20 (Kapitalerträge / KESt), §22 (Rentenbesteuerung).',
    link: { text: 'EStG – Volltext (gesetze-im-internet.de)', url: 'https://www.gesetze-im-internet.de/estg/' },
  },
  {
    type: 'abbr', term: 'ETF',
    short: 'Exchange Traded Fund',
    definition: 'Börsengehandelter Indexfonds. Bildet einen Wertpapierindex (z. B. MSCI World, S&P 500) kostengünstig nach. Typische Kosten (TER): 0,07–0,20 % p.a. Im Kontext dieser App: klassisches ETF-Depot als Alternative oder Ergänzung zum AVD.',
  },
  {
    type: 'abbr', term: 'FV',
    short: 'Future Value (Endwert)',
    definition: 'Zukünftiger Wert einer Einzahlung oder Reihe von Einzahlungen unter Berücksichtigung von Zins und Zinseszins. Formel für regelmäßige Sparraten: FV = PMT × ((1+r)^n − 1) / r.',
  },
  {
    type: 'abbr', term: 'GRV',
    short: 'Gesetzliche Rentenversicherung',
    definition: 'Pflichtversicherung in Deutschland für Arbeitnehmer. Finanziert nach dem Umlageverfahren: Beiträge der Aktiven finanzieren die laufenden Renten. Rentenalter: 67 Jahre (Geburtsjahrgänge ab 1964).',
    link: { text: 'Deutsche Rentenversicherung (drv.de)', url: 'https://www.deutsche-rentenversicherung.de' },
  },
  {
    type: 'abbr', term: 'JStG',
    short: 'Jahressteuergesetz',
    definition: 'Jährliches Gesetz zur Anpassung steuerlicher Regelungen in Deutschland. Das JStG 2022 änderte u. a. die Rentenbesteuerung: volle Besteuerung ab 2058 (Besteuerungsanteil +0,5 % pro Jahr ab 2023).',
  },
  {
    type: 'abbr', term: 'K₀',
    short: 'Startkapital / Anfangskapital',
    definition: 'Bereits vorhandenes Kapital zu Beginn des Anlagezeitraums. Wächst im Laufe der Zeit durch Zins und Zinseszins: K₀ × (1+r)^n.',
  },
  {
    type: 'abbr', term: 'K_E',
    short: 'Endkapital / Zielkapital',
    definition: 'Das angestrebte oder errechnete Kapital am Ende des Anlagezeitraums. Im Sparraten-Modus: Eingabe, aus der die nötige monatliche Rate abgeleitet wird. Im Endkapital-Modus: das Ergebnis der Berechnung.',
  },
  {
    type: 'abbr', term: 'KESt',
    short: 'Kapitalertragsteuer',
    definition: 'Abgeltungsteuer auf Kapitalerträge (Zinsen, Dividenden, realisierte Kursgewinne). Steuersatz: 25 % + 5,5 % Solidaritätszuschlag = 26,375 %. Bei Aktien-ETF mit 30 % Teilfreistellung effektiv 18,4625 %. Abzug direkt durch die depotführende Bank (Quellensteuer).',
  },
  {
    type: 'abbr', term: 'KiSt',
    short: 'Kirchensteuer',
    definition: 'Steuer, die Mitglieder einer steuererhebenden Religionsgemeinschaft zahlen. Wird in dieser App nicht berücksichtigt. Je nach Bundesland 8 % oder 9 % der Einkommensteuer.',
  },
  {
    type: 'abbr', term: 'KV',
    short: 'Krankenversicherung',
    definition: 'Gesetzliche Pflichtversicherung zur Absicherung von Krankheitskosten. AN-Anteil 2024: 8,15 % des Bruttolohns (bis BBG) inklusive durchschnittlicher Zusatzbeitrag. Auf Rentenbezüge: 7,3 % Beitrag (kein AG-Anteil für Rentner).',
  },
  {
    type: 'abbr', term: 'n',
    short: 'Laufzeit / Anzahl der Perioden',
    definition: 'Anzahl der Zeitperioden im Sparplan. In der monatlichen Zinsrechnung: n = Jahre × 12. Beispiel: 30 Jahre Anlagehorizont = n = 360 Monate.',
  },
  {
    type: 'abbr', term: 'p.a.',
    short: 'per annum (pro Jahr)',
    definition: 'Lateinisch für „pro Jahr". Renditeangaben sind üblicherweise p.a. – bei monatlicher Berechnung wird die Jahresrendite in eine monatliche Rate umgerechnet: r_monatl. = r_p.a. / 12.',
  },
  {
    type: 'abbr', term: 'PMT',
    short: 'Payment – monatliche Sparrate',
    definition: 'Regelmäßige, monatlich gleichbleibende Zahlung in einen Sparplan. Formel zur Berechnung der nötigen PMT: PMT = (K_E_nötig × r) / ((1+r)^n − 1), wobei r die monatliche Rendite und n die Gesamtmonate sind.',
  },
  {
    type: 'abbr', term: 'PV',
    short: 'Pflegeversicherung',
    definition: 'Gesetzliche Pflichtversicherung zur Absicherung von Pflegebedürftigkeit. AN-Anteil 2024: 1,8 % des Bruttolohns (bis BBG). Auf Rentenbezüge: 1,8 % Beitrag.',
  },
  {
    type: 'abbr', term: 'r',
    short: 'Rendite / Zinssatz',
    definition: 'Monatliche Rendite in der Zinsformel. Berechnung: r = Jahresrendite (%) / 100 / 12. Beispiel: 7 % p.a. → r = 0,005833 pro Monat.',
  },
  {
    type: 'abbr', term: 'RV',
    short: 'Rentenversicherung',
    definition: 'Gesetzliche Pflichtversicherung zur Altersvorsorge. AN-Anteil 2024: 9,3 % des Bruttolohns (bis BBG). Beitragssatz gesamt: 18,6 % (je 9,3 % AN und AG).',
  },
  {
    type: 'abbr', term: 'SGB',
    short: 'Sozialgesetzbuch',
    definition: 'Gesamtwerk der deutschen Sozialgesetzgebung. Relevant: SGB VI (Rentenversicherung), SGB V (Krankenversicherung), SGB XI (Pflegeversicherung), SGB III (Arbeitsförderung).',
    link: { text: 'SGB VI – Gesetzestext (gesetze-im-internet.de)', url: 'https://www.gesetze-im-internet.de/sgb_6/' },
  },
  {
    type: 'abbr', term: 'Soli',
    short: 'Solidaritätszuschlag',
    definition: 'Zuschlag zur Einkommensteuer. Seit 2021 für ~90 % der Steuerpflichtigen abgeschafft. Gilt weiterhin für Spitzenverdiener (ab ca. 36.260 € ESt/Jahr) sowie grundsätzlich auf Kapitalertragsteuer (5,5 % auf KESt).',
  },
  {
    type: 'abbr', term: 'TER',
    short: 'Total Expense Ratio',
    definition: 'Jährliche Gesamtkostenquote eines Investmentfonds oder ETF. Umfasst Verwaltungsgebühren und sonstige laufende Kosten, wird direkt vom Fondsvermögen abgezogen. Typische Werte: 0,07–0,20 % für breite Aktien-ETF.',
  },
  {
    type: 'abbr', term: 'TMG',
    short: 'Telemediengesetz',
    definition: 'Deutsches Gesetz, das Anbieter von Telemedien (u. a. Webseiten) zur Anbieterkennzeichnung (Impressumspflicht, § 5 TMG) verpflichtet.',
  },
  {
    type: 'abbr', term: 'ZvE',
    short: 'Zu versteuerndes Einkommen',
    definition: 'Bemessungsgrundlage der Einkommensteuer. Berechnung vereinfacht: Bruttoeinkommen − Sozialversicherungsbeiträge − Werbungskostenpauschbetrag (1.230 €) − Sonderausgabenpauschbetrag (36 €) − sonstige Abzüge. Auf ZvE wird der Einkommensteuertarif (§32a EStG) angewendet.',
  },

  // ── Fachbegriffe ─────────────────────────────────────────────────────────────
  {
    type: 'term', term: '4 %-Regel',
    definition: 'Faustregel zur Entnahme aus einem Kapitalstock im Ruhestand: Entnimm jährlich maximal 4 % des Anfangsvermögens, dann reicht das Depot statistisch für mindestens 30 Jahre. Herkunft: Trinity-Studie (1998, USA-Aktienmarkt). In dieser App als Entnahmemodell verwendet: Monatliche Nettorente = Kapital × 4 % / 12 × (1 − Steuersatz).',
  },
  {
    type: 'term', term: 'Altersvorsorgedepot',
    definition: 'Staatlich gefördertes Wertpapierdepot (Altersvorsorgereformgesetz, ab 01.01.2027). Kombination aus privatem ETF-Depot und staatlicher Förderung: Grundzulage bis 540 €/Jahr + Kinderzulage 1:1-Match bis 300 €/Jahr je Kind. Sonderausgabenabzug nach §10a EStG auf max. 1.800 €/Jahr Eigenanteil + Zulage (Günstigerprüfung). Höchstbeitrag: 6.840 €/Jahr Eigenanteil; Beiträge über 1.800 €/Jahr ins Depot aber ohne Steuerabzug. Auszahlung als lebenslange Rente ab Rentenalter, versteuert als sonstige Einkünfte (§22 Nr. 5 EStG).',
    link: { text: 'justETF – Altersvorsorgedepot: Chancen & Förderung', url: 'https://www.justetf.com/de/news/etf-news/altersvorsorgedepot-avd-alles-was-du-wissen-musst.html' },
  },
  {
    type: 'term', term: 'Anlagehorizont',
    definition: 'Geplante Dauer einer Kapitalanlage bis zur Auflösung. Längere Horizonte erlauben mehr Risiko (höhere Aktienquote), da Kursschwankungen ausgeglichen werden können. Kurze Horizonte (< 10–15 Jahre) erfordern vorsichtigere Allokationen.',
  },
  {
    type: 'term', term: 'Beitragsbemessungsgrenze',
    definition: 'Einkommensgrenze in der Sozialversicherung. Einkommensanteile oberhalb der Grenze sind beitragsfrei; gleichzeitig werden auch keine höheren Rentenansprüche erworben. GRV/AV 2024 (West): 90.600 €/Jahr (7.550 €/Monat).',
  },
  {
    type: 'term', term: 'Besteuerungsanteil',
    definition: 'Anteil der gesetzlichen Rente, der der Einkommensteuer unterliegt. Gilt nur für die GRV-Rente nach §22 Nr. 1 EStG. Basiert auf dem Jahr des Rentenbeginns: 2023 → 83 %, steigt jährlich um 0,5 % bis 100 % im Jahr 2058 (JStG 2022). Der steuerpflichtige Anteil = Bruttorente × Besteuerungsanteil − Werbungskostenpauschbetrag (102 €) − Sonderausgabenpauschbetrag (36 €).',
  },
  {
    type: 'term', term: 'Break-Even-Steuersatz',
    definition: 'Im Kontext der AVD-Günstigerprüfung: Grenzsteuersatz, ab dem die Steuererstattung des Finanzamts (Sonderausgabenabzug §10a EStG) den Wert der Staatszulage übersteigt. Formel: Break-Even = Zulage / (geförderter Eigenanteil + Zulage). Basis ist max. 1.800 €/Jahr Eigenanteil (darüber kein Sonderausgabenabzug). Beispiel Single ohne Kinder: 540 / (1.800 + 540) ≈ 23,1 % – wer darüber liegt, profitiert von der Günstigerprüfung. Mit einem Kind: 840 / (1.800 + 840) ≈ 31,8 %.',
  },
  {
    type: 'term', term: 'Bruttorente',
    definition: 'Gesetzliche Rente vor Abzug von Kranken- und Pflegeversicherungsbeiträgen sowie vor Einkommensteuer. Berechnung: Entgeltpunkte × aktueller Rentenwert. Vom Bruttobetrag werden KV (7,3 %) und PV (1,8 %) abgezogen, um zur Nettorente zu gelangen.',
  },
  {
    type: 'term', term: 'Differenzsteuer',
    definition: 'Steuerberechnungsmethode für AVD-Einkünfte: Steuerlast auf das AVD-Einkommen = ESt(ZvE_GRV + AVD_Jahresbrutto) − ESt(ZvE_GRV). Verhindert eine Doppelbesteuerung und berechnet den marginalen Steuerbetrag korrekt nach dem progressiven Tarif.',
  },
  {
    type: 'term', term: 'Durchschnittsentgelt',
    definition: 'Durchschnittlicher Jahresbruttoverdienst aller Versicherten in der GRV. Dient als Referenzgröße für die Entgeltpunktberechnung. 2024: 45.358 € (vorläufig), in dieser App vereinfacht: 51.944 €. Wer genau das Durchschnittsentgelt verdient, sammelt 1,0 EP pro Jahr.',
  },
  {
    type: 'term', term: 'Dynamisierung',
    definition: 'Jährliche Erhöhung der monatlichen Sparrate, um den Kaufkraftverlust durch Inflation auszugleichen. Empfehlung: ~2 % p.a. Beispiel: 300 €/Monat Sparrate → im nächsten Jahr 306 €/Monat.',
  },
  {
    type: 'term', term: 'Einkommensteuer (§32a EStG)',
    definition: 'Deutsche Einkommensteuer auf das zu versteuernde Einkommen (ZvE). Progressiver Tarif 2024 (Grundtabelle):',
    table: {
      headers: ['ZvE-Bereich (2024)', 'Grenzsteuersatz'],
      rows: [
        ['bis 11.784 €', '0 % (Grundfreibetrag)'],
        ['11.785 – 17.005 €', '14 % – 24 % (progressiv)'],
        ['17.006 – 66.760 €', '24 % – 42 % (progressiv)'],
        ['66.761 – 277.826 €', '42 % (erste Proportionalzone)'],
        ['über 277.826 €', '45 % (Reichensteuer)'],
      ],
    },
  },
  {
    type: 'term', term: 'Entgeltpunkte',
    definition: 'Maßeinheit für erworbene Rentenansprüche. Entgeltpunkte pro Jahr = Bruttolohn / Durchschnittsentgelt (max. 1 EP bei Einkommen = Durchschnitt). Gesamtrente = Summe aller Entgeltpunkte × aktueller Rentenwert (39,32 €/Monat, 2024).',
  },
  {
    type: 'term', term: 'Entnahmerate',
    definition: 'Prozentualer Anteil des Kapitals, der jährlich entnommen wird. In dieser App: 4 % (4 %-Regel). Monatliche Entnahme = Kapital × 0,04 / 12. Höhere Entnahmeraten erhöhen das Risiko, das Kapital zu erschöpfen.',
  },
  {
    type: 'term', term: 'ETF (Exchange Traded Fund)',
    definition: 'Börsengehandelter Indexfonds, der einen Wertpapierindex passiv nachbildet. Vorteile: geringe Kosten, breite Diversifikation, hohe Liquidität. Risiken: Kursvolatilität, Währungsrisiko (bei globalen Indizes). Für die Kapitalertragsteuer gilt bei Aktien-ETF (≥ 51 % Aktienquote) eine 30 % Teilfreistellung.',
  },
  {
    type: 'term', term: 'Grundfreibetrag',
    definition: 'Steuerfreies Existenzminimum in der Einkommensteuer. 2024: 11.784 €/Jahr. Auf Einkommen bis zu dieser Grenze wird keine Einkommensteuer erhoben. Wird jährlich angepasst.',
  },
  {
    type: 'term', term: 'Grundsicherung im Alter',
    definition: 'Staatliche Mindestleistung nach SGB XII für Personen ab 65 Jahren mit geringem Einkommen/Vermögen. 2025 (Richtwert Alleinstehend): ca. 933 €/Monat (Regelsatz 563 € + durchschnittliche Kosten der Unterkunft 370 €). Liegt die Nettorente darunter, besteht ggf. Anspruch auf Aufstockung.',
  },
  {
    type: 'term', term: 'Grundzulage (AVD)',
    definition: 'Staatliche Förderung im Altersvorsorgedepot. Tier 1: 50 % auf die ersten 360 €/Jahr Eigenanteil (max. 180 €/Jahr). Tier 2: 25 % auf weitere 1.440 €/Jahr Eigenanteil (max. 360 €/Jahr). Maximale Grundzulage: 540 €/Jahr (bei 1.800 €/Jahr Eigenanteil). Mindestbeitrag für Zulage: 120 €/Jahr (10 €/Monat).',
  },
  {
    type: 'term', term: 'Grenzsteuersatz',
    definition: 'Steuersatz, der auf den letzten hinzuverdienten Euro anfällt. Durch den progressiven Einkommensteuertarif steigt der Grenzsteuersatz mit dem Einkommen. Im Gegensatz zum Durchschnittssteuersatz bestimmt er, wie viel von einer zusätzlichen Einnahme effektiv versteuert wird.',
    table: {
      headers: ['ZvE (2024)', 'Grenzsteuersatz'],
      rows: [
        ['≤ 11.784 €', '0 %'],
        ['15.000 €', '≈ 18 %'],
        ['20.000 €', '≈ 26 %'],
        ['30.000 €', '≈ 33 %'],
        ['40.000 €', '≈ 38 %'],
        ['≥ 66.761 €', '42 %'],
        ['> 277.826 €', '45 %'],
      ],
    },
  },
  {
    type: 'term', term: 'Günstigerprüfung (§10a EStG)',
    definition: 'Automatische Prüfung des Finanzamts in der Veranlagung: Ist der Sonderausgabenabzug nach §10a EStG günstiger als die direkte Zulage? Abzugsfähig: bis zu 1.800 €/Jahr Eigenanteil + voller Zulageanspruch (Grund- und Kinderzulage). Steuerersparnis = Grenzsteuersatz × (geförderter Eigenanteil + Zulage). Falls Steuerersparnis > Zulage, erstattet das Finanzamt die Differenz − Zulage wird dabei auf die Steuerschuld angerechnet, sodass kein Doppelbonus entsteht. Freibeträge (Grundfreibetrag 11.784 €, SV-Abzüge, Arbeitnehmer-Pauschbetrag 1.230 €) fließen bereits in den Grenzsteuersatz ein, der aus dem Bruttoeinkommen abgeleitet wird. Beiträge über 1.800 €/Jahr Eigenanteil können nicht abgezogen werden.',
    link: { text: '§ 10a EStG – Gesetzestext (gesetze-im-internet.de)', url: 'https://www.gesetze-im-internet.de/estg/__10a.html' },
  },
  {
    type: 'term', term: 'Inflation',
    definition: 'Allgemeiner Anstieg des Preisniveaus über Zeit. Vermindert die Kaufkraft des Geldes. Historischer Durchschnitt in Deutschland: ~2 % p.a. In dieser App: Nominalrendite − 2 % Inflation = Realrendite. Beispiel: 7 % nominale ETF-Rendite → 5 % Realrendite.',
  },
  {
    type: 'term', term: 'Kapitalertragsteuer (KESt)',
    definition: 'Abgeltungsteuer auf Kapitalerträge: 25 % + 5,5 % Soli = 26,375 %. Bei Aktien-ETF gilt 30 % Teilfreistellung → effektiv 18,4625 %. Sparerpauschbetrag: 1.000 €/Jahr (gilt für ETF-Depot, nicht für AVD). Abzug direkt durch die Bank.',
  },
  {
    type: 'term', term: 'Kinderzulage (AVD)',
    definition: 'Staatliche 1:1-Matching-Förderung für Kinder mit Kindergeldanspruch im Altersvorsorgedepot. Für jeden eingezahlten Euro Eigenanteil gibt der Staat einen Euro dazu – maximal 300 €/Jahr (25 €/Monat) je Kind. Mindestvoraussetzung: 10 €/Monat Eigenanteil (kein Anspruch darunter). Gilt nur solange Kindergeldanspruch besteht (i. d. R. bis Vollendung des 18. Lebensjahres). Die volle Kinderzulage ist ab 25 €/Monat Eigenanteil erreicht. Sie erhöht auch den Sonderausgabenabzug im Rahmen der Günstigerprüfung (§10a EStG).',
    link: { text: 'Altersvorsorgereformgesetz – Bundestag (bundestag.de)', url: 'https://www.bundestag.de/dokumente/textarchiv/2026/kw13-de-altersvorsorge-1156798' },
  },
  {
    type: 'term', term: 'Kirchensteuer (KiSt)',
    definition: 'Steuer für Mitglieder steuererhebender Religionsgemeinschaften. 8 % (Bayern, BaWü) oder 9 % (übrige Bundesländer) der Einkommensteuer. Wird in dieser App nicht berücksichtigt.',
  },
  {
    type: 'term', term: 'Krankenversicherung (KV)',
    definition: 'Gesetzliche Pflichtversicherung. AN-Anteil 2024: 8,15 % (Basisbeitrag 7,3 % + Ø Zusatzbeitrag 0,85 %) des Bruttolohns bis BBG. Rentnerbeitrag: 7,3 % der Bruttorente (kein AG-Anteil, Rentner tragen den vollen Basisbeitrag selbst).',
  },
  {
    type: 'term', term: 'Nettorendite',
    definition: 'Tatsächliche Rendite nach Abzug aller Kosten (TER, Transaktionskosten) und Steuern. Bei einem Aktien-ETF: Nominalrendite − TER − KESt (18,46 % effektiv auf Kursgewinne). Beispiel: 7 % − 0,2 % TER − ~1 % Steuereffekt ≈ 5,8 % Nettorendite.',
  },
  {
    type: 'term', term: 'Nettorente',
    definition: 'Gesetzliche Rente nach Abzug von Kranken- und Pflegeversicherungsbeiträgen sowie nach Einkommensteuer. Berechnung in dieser App: Bruttorente × (1 − KV-Beitrag 7,3 % − PV-Beitrag 1,8 %) = Nettorente (ohne Steuern, da GRV-Rente oft unter Grundfreibetrag).',
  },
  {
    type: 'term', term: 'Pflegeversicherung (PV)',
    definition: 'Gesetzliche Pflichtversicherung. AN-Anteil 2024: 1,8 % des Bruttolohns bis BBG. Rentnerbeitrag: 1,8 % der Bruttorente.',
  },
  {
    type: 'term', term: 'Realrendite',
    definition: 'Rendite nach Abzug der Inflationsrate. Formel (vereinfacht): Realrendite ≈ Nominalrendite − Inflation. Beispiel: 7 % nominale ETF-Rendite − 2 % Inflation = 5 % Realrendite. In dieser App wird standardmäßig mit 5 % Rendite (Realrendite) gerechnet.',
  },
  {
    type: 'term', term: 'Rentenformel',
    definition: 'Berechnung der monatlichen GRV-Rente: Monatsrente = Entgeltpunkte × Zugangsfaktor × Rentenartfaktor × aktueller Rentenwert. Vereinfacht (Altersrente mit Zugangsfaktor = 1): Monatsrente = EP × Rentenwert (39,32 €, 2024).',
    link: { text: 'Deutsche Rentenversicherung (drv.de)', url: 'https://www.deutsche-rentenversicherung.de' },
  },
  {
    type: 'term', term: 'Rentenlücke',
    definition: 'Differenz zwischen dem aktuellen monatlichen Nettoeinkommen und der erwarteten gesetzlichen Nettorente. Zeigt den Betrag, den private Vorsorge monatlich ausgleichen muss, um den Lebensstandard zu halten. In dieser App: Rentenlücke = Nettoeinkommen − Nettorente.',
  },
  {
    type: 'term', term: 'Rentenversicherung (RV)',
    definition: 'Gesetzliche Pflichtversicherung für Arbeitnehmer. Beitragssatz 2024: 18,6 % (je 9,3 % AN und AG). Finanzierungsprinzip: Umlageverfahren. Leistungen: Altersrente, Erwerbsminderungsrente, Hinterbliebenenrente.',
  },
  {
    type: 'term', term: 'Rentenwert',
    definition: 'Aktueller Rentenwert (aRW): monatlicher Eurobetrag für einen Entgeltpunkt. 2024: 39,32 €/Monat/EP. Wird jährlich durch die Rentenanpassungsformel fortgeschrieben (Orientierung an Lohnentwicklung und Nachhaltigkeitsfaktor).',
  },
  {
    type: 'term', term: 'Solidaritätszuschlag (Soli)',
    definition: 'Ergänzungsabgabe zur Einkommensteuer. Seit 2021 für die meisten Steuerpflichtigen abgeschafft (Freigrenze). Gilt weiterhin: auf Kapitalertragsteuer (5,5 % auf KESt ohne Freigrenzenregelung) und für Spitzenverdiener (Einkommensteuer > 36.260 €/Jahr).',
  },
  {
    type: 'term', term: 'Sonderausgabenabzug',
    definition: 'Steuermindernd abzugsfähige Aufwendungen, die weder Betriebsausgaben noch Werbungskosten sind. Relevant für AVD: §10a EStG erlaubt den Abzug von Eigenanteil (max. 1.800 €/Jahr) + voller Zulage als Sonderausgaben. Beiträge über 1.800 €/Jahr Eigenanteil sind zwar möglich (bis 6.840 €/Jahr), aber steuerlich nicht absetzbar. Pauschbetrag ohne Altersvorsorge: 36 €/Jahr.',
    link: { text: 'BMF – FAQ Reform der privaten Altersvorsorge', url: 'https://www.bundesfinanzministerium.de/Content/DE/FAQ/reform-der-privaten-altersvorsorge.html' },
  },
  {
    type: 'term', term: 'Sozialversicherungsbeiträge',
    definition: 'Pflichtbeiträge zur gesetzlichen Sozialversicherung. AN-Anteile 2024 (bis BBG 90.600 €/Jahr):',
    table: {
      headers: ['Versicherung', 'AN-Anteil 2024'],
      rows: [
        ['Krankenversicherung (KV)', '8,15 %'],
        ['Pflegeversicherung (PV)', '1,80 %'],
        ['Rentenversicherung (RV)', '9,30 %'],
        ['Arbeitslosenversicherung (AV)', '1,30 %'],
        ['Gesamt AN', '20,55 %'],
      ],
    },
  },
  {
    type: 'term', term: 'Sparplan',
    definition: 'Regelmäßige monatliche Einzahlung in ein Depot oder Investmentvehikel. Vorteil: Cost-Averaging-Effekt (günstigerer Durchschnittskurs durch regelmäßigen Kauf bei schwankenden Kursen). In dieser App: Berechnung der notwendigen monatlichen Rate (PMT) zur Erreichung eines Zielkapitals.',
  },
  {
    type: 'term', term: 'Sweetspot (AVD)',
    definition: 'Der optimale Punkt innerhalb der 50 %-Förderzone des Altersvorsorgedepots. Bis 30 €/Monat Eigenanteil (360 €/Jahr) gilt die volle 50 %-Zulage (Tier 1). Ab 31 €/Monat sinkt die Förderquote auf 25 % (Tier 2). Der Sweetspot markiert den Übergang — dort ist die Fördereffizienz am höchsten.',
  },
  {
    type: 'term', term: 'Teilfreistellung (ETF)',
    definition: 'Steuerliche Begünstigung für Investmentfonds-Erträge. Bei Aktien-ETF mit ≥ 51 % Aktienquote: 30 % der Erträge sind steuerfrei (§ 20 Abs. 1 InvStG 2018). Effektiver Steuersatz auf Kursgewinne/Ausschüttungen: 26,375 % × (1 − 30 %) = 18,4625 %.',
  },
  {
    type: 'term', term: 'Umlageverfahren',
    definition: 'Finanzierungsprinzip der gesetzlichen Rentenversicherung. Laufende Beiträge der Erwerbstätigen finanzieren direkt die aktuellen Rentenzahlungen (kein Kapitalstock). Gegenteil: Kapitaldeckungsverfahren (privates Sparen/Investieren für die eigene Rente).',
  },
  {
    type: 'term', term: 'Volatilität',
    definition: 'Statistische Schwankungsbreite der Rendite eines Wertpapiers oder Portfolios. Hohe Volatilität bedeutet starke Kursschwankungen (Risiko). Relevant: Bei kurzem Anlagehorizont (< 15 Jahre) kann ein Kurseinbruch kurz vor Rentenbeginn nicht mehr ausgesessen werden.',
  },
  {
    type: 'term', term: 'Werbungskostenpauschbetrag',
    definition: 'Pauschaler Abzug für beruflich bedingte Aufwendungen. 2024: 1.230 €/Jahr für Arbeitnehmer (§9a EStG). Für Rentner: 102 €/Jahr (§9a S. 1 Nr. 3 EStG). Wird bei der ZvE-Berechnung vor Anwendung des Steuertarifs abgezogen.',
  },
  {
    type: 'term', term: 'Zinseszins',
    definition: 'Phänomen, bei dem Zinsen auf bereits erhaltene Zinsen (und Erträge) anfallen. Führt zu exponentiellem Kapitalwachstum über lange Zeiträume. Formel: K_E = K₀ × (1+r)^n. Je länger der Anlagehorizont, desto stärker der Zinseszinseffekt.',
  },
  {
    type: 'term', term: 'Zu versteuerndes Einkommen (ZvE)',
    definition: 'Bemessungsgrundlage der Einkommensteuer nach allen zulässigen Abzügen. Vereinfachte Berechnung in dieser App: ZvE = Bruttolohn − Sozialversicherungsbeiträge (AN) − Werbungskostenpauschbetrag (1.230 €) − Sonderausgabenpauschbetrag (36 €).',
  },
  {
    type: 'term', term: 'Zulage (AVD)',
    definition: 'Staatliche Förderung im Altersvorsorgedepot, bestehend aus Grundzulage (max. 540 €/Jahr) und Kinderzulage (300 €/Jahr je Kind). Wird direkt ins Depot gebucht und erhöht das Gesamtkapital. Auszahlung erfolgt über die gesamte Rentenphase als Teil der lebenslangen Rente.',
  },
];

@Component({
  selector: 'app-glossar',
  standalone: true,
  templateUrl: './glossar.component.html',
  styleUrl: './glossar.component.scss',
})
export class GlossarComponent {
  open = signal(false);
  searchQuery = signal('');

  displayGroups = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      const abbrs = ENTRIES.filter(e => e.type === 'abbr')
        .sort((a, b) => a.term.localeCompare(b.term, 'de', { sensitivity: 'base' }));
      const terms = ENTRIES.filter(e => e.type === 'term')
        .sort((a, b) => a.term.localeCompare(b.term, 'de', { sensitivity: 'base' }));
      return [
        { label: 'Abkürzungen', entries: abbrs },
        { label: 'Fachbegriffe & Tabellen', entries: terms },
      ];
    }
    const scored = ENTRIES
      .map(e => ({ entry: e, score: this.score(e, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return [{ label: '', entries: scored.map(x => x.entry) }];
  });

  resultCount = computed(() => this.displayGroups().reduce((s, g) => s + g.entries.length, 0));

  private score(entry: GlossarEntry, q: string): number {
    const term = entry.term.toLowerCase();
    const short = (entry.short ?? '').toLowerCase();
    const def = entry.definition.toLowerCase();

    if (term === q) return 1000;
    if (term.startsWith(q)) return 800;
    if (short === q) return 750;
    if (term.includes(q)) return 600;
    if (short.startsWith(q)) return 550;
    if (short.includes(q)) return 400;
    if (def.includes(q)) return 200;
    if (this.fuzzyMatch(term, q)) return 80;
    if (this.fuzzyMatch(short, q)) return 50;
    return 0;
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let pos = 0;
    for (const ch of query) {
      const idx = text.indexOf(ch, pos);
      if (idx === -1) return false;
      pos = idx + 1;
    }
    return true;
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      this.searchQuery.set('');
    }
  }
}
