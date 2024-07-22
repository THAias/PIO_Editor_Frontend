//Service that provides helper texts for the application

export const helperTextPatientInsuranceForm = {
    insuranceNumber:
        "Die Nummer einer gesetzlichen Versicherung muss mit einem Buchstaben beginnen und ist 10-stellig (z.B. U381946284). Private Versicherungen vergeben individuelle Nummern.",
};

export const helperTextBarthelForm = {
    barthelScore:
        "Mit diesem Index geben Sie an inwieweit die Person fähig ist ihren Alltag selbstständig zu bewältigen.",
};

export const helperTextBreathForm = {
    respiratorySupportValue:
        "Hier können Sie angeben, ob die Person physikalische (maschinelle oder ähnliche) Unterstützung bei der Atmung benötigt (z.B.: Sauerstoffzugabe, CPAP). Medikamentöse Unterstützung soll hier nicht erfasst werden. Auch für rehabilitative Maßnahmen ( z.B. TriFlow Training ) ist dieser Abschnitt nicht geeignet, dafür sollten die pflegerischen Maßnahmen genutzt werden.",
};

export const helperTextLibertyForm = {
    deprivationOfLiberty:
        "Freiheitsentziehende Maßnahmen sind Einschränkungen oder Kontrollen, die eine Person daran hindern, sich frei zu bewegen. Sie werden genutzt, um Verhalten oder Sicherheit zu regulieren, jedoch nur unter strengen Regeln und Bedingungen.",
};

export const helperTextIsolationForm = {
    isolation:
        "Räumliche Isolation ist notwendig, um die Verbreitung von Krankheiten zu stoppen, indem infizierte Personen von anderen getrennt werden, um die Gesundheit der Öffentlichkeit zu schützen.",
    isolationDate: "Angaben zum Zeitraum der Isolation",
    isolationFurtherNotes:
        "Hier können weitere Hinweise, z.B über die Rahmenbedingungen der Isolation, angegeben werden.",
};

export const helperTextOrientationForm = {
    orientationTime:
        "Hier können Sie angeben, inwieweit die Person zeitliche Abfolgen verstehen und sich im Zeitverlauf orientieren kann.",
    orientationPerson:
        "Hier können Sie angeben, inwieweit die Person andere Menschen, deren Standort und die aktuelle Zeit erkennen kann.",
    orientationPlace:
        "Hier können Sie angeben, inwieweit die Person sich in einem bestimmten Raum oder Ort orientieren und die eigene Position im Bezug zur Umgebung verstehen kann.",
    orientationSituation:
        "Hier können Sie angeben, inwieweit sich die Person in einer gegebenen Situation oder Umgebung orientieren und diese verstehen kann.",
};

export const helperTextUrinaryFecalForm = {
    urinaryContinenceValue:
        "Dokumentation einer Harninkontinenz. Angelehnt an die Richtlinien zur Beurteilung des Pflegegrades.\n- Ständig kontinent: Keine unwillkürlichen Harnabgänge.\n- Überwiegend kontinent: Maximal einmal täglich unwillkürlicher Harnabgang oder Tröpfcheninkontinenz.\n- Überwiegend inkontinent: Mehrmals täglich unwillkürliche Harnabgänge, aber gesteuerte Blasenentleerung ist noch teilweise möglich.\n- Komplett inkontinent: Die Person ist komplett harninkontinent. Gesteuerte Blasenentleerung ist nicht möglich.",
    urinaryDrainageValue: "Anatomie der Harnableitung.",
    fecalContinenceValue:
        "Dokumentation einer Stuhlinkontinenz. Angelehnt an die Richtlinien zur Beurteilung des Pflegegrades.\n- Ständig kontinent: Keine unwillkürlichen Stuhlabgänge.\n- Überwiegend kontinent: Die Person ist überwiegend stuhlkontinent, gelegentlich unwillkürliche Stuhlabgänge oder nur geringe Stuhlmengen, sogenannte Schmierstühle.\n- Überwiegend inkontinent: Die Person ist überwiegend stuhlinkontinent, selten gesteuerte Darmentleerung möglich.\n- Komplett inkontinent: Die Person ist komplett stuhlinkontinent, gesteuerte Darmentleerung ist nicht möglich.",
    fecalDrainageValue:
        "Hier kann angegeben werden, über welchen Weg die Stuhlableitung stattfindet. Der natürliche Weg sind das Rektum und der Anus. Künstlich geschaffene Strukturen sind Stomata wie z.B. Colostoma oder Ileostoma.",
};

export const helperTextVitalBodyForm = {
    oxygenSaturationValue:
        "Beachten Sie, dass die Sauerstoffsättigung für diese Angabe mit einem Pulsoximeter gemessen werden muss.",
};

export const helperTextDegreeOfDisabilityForm = {
    mark: "Hier können Sie detailliertere Angaben zur Behinderung machen.",
};

export const helperTextDeviceForm = {
    udi: "Hierbei handelt es sich um eine Nummer zur Identifizierung von Medizinprodukten.",
};

export const helperTextOrganizationForm = {
    nameSelected:
        "Hier können Sie bereits hinterlegte Einträge aus dem Adressbuch auswählen und anzeigen. Hier vorgenommene Änderungen wirken sich auch auf das Adressbuch aus.",
};

export const helperTextPatientLocationForm = {
    class: "Hier können Sie auswählen, wo sich die Person aktuell bzw. normalerweise aufhält.",
    type: "Hier können Sie auswählen, in welchem Wohnverhältnis sich die Person aktuell bzw. normalerweise befindet.",
};

export const helperTextAddressWrapper = {
    postOfficeBoxRadio: 'Sofern es sich bei der Adresse um ein Postfach handelt, können Sie hier mit "ja" bestätigen',
};

export const helperTextAllergyWrapper = {
    allergyType:
        'Die Begriffe "Allergie" und "Unverträglichkeit" werden oft uneindeutig verwendet. Obwohl Immuntests Hinweise liefern können, sind sie nicht perfekt für bestimmte Substanzen. Sollten Sie sich unsicher über die art der Reaktion sein, lassen Sie den „Typ“-Eintrag frei oder wählen „Keine Angabe“ aus. Sie können weitere Informationen bei der Freitextbeschreibung ergänzen.',
    timePeriod:
        "Klinisch relevanter Zeitraum als Zeitintervall mit Datumsangaben, bis wann der Patient/ die Patientin die Allergie/Unverträglichkeit hatte.",
    allergyCriticality:
        "Hier wählen Sie aus wie hoch das Risiko ist, dass die Allergie/Unverträglichkeit eine schwerwiegende oder lebensbedrohliche Situation hervorruft.",
};

export const helperTextMedicalProblemWrapper = {
    medicalProblemPeriod:
        "Hier können Sie angeben, in welchem Zeitraum bzw. ab wann der/die PatientIn die Diagnose/Erkrankung hatte bzw. hat. Um anzugeben, dass die Diagnose/Erkrankung aktuell besteht, kann das aktuelle Datum als Enddatum angegeben werden.",
};

export const helperTextNameWrapper = {
    prefix: "Sie können bei Bedarf weitere Namensoptionen für den Titel oder den Geburtsnamen über das + hinzufügen.",
};

export const helperTextNursingMeasuresWrapper = {
    timeInstance: "Zeitpunkt (Tageszeit), Dauer und Einheit für einzelne Maßnahmen",
    durationValue:
        "Hier können Sie angeben, wie lange eine Maßnahme durchgeführt werden soll. Dazu geben Sie eine Ziffer ein und wählen die entsprechende Einheit (Stunden, Tage, Wochen).",
    frequency:
        "Hier können Sie angeben, wie oft eine Maßnahme durchgeführt werden soll. Wenn Sie angeben möchten, dass eine Maßnahme innerhalb von 2 Wochen 3 mal durchgeführt werden soll, geben Sie folgendes an:\n3 [mal pro] 2 [Wochen]",
};

export const helperTextOrganizationWrapper = {
    BSNR:
        "Hierbei handelt es sich um die Betriebsstättennummer. Jede Betriebsstätte und jede Nebenbetriebsstätte nach den Definitionen des Bundesmantelvertrages-Ärzte erhalten " +
        "jeweils eine solche Nummer. Sie ermöglicht die Zuordnung ärztlicher Leistungen zum Ort der Leistungserbringung. Die Nummer ist neunstellig.",
    IK:
        "Hierbei handelt es sich um ein Institutionskennzeichen. Diese neunstellige Ziffernfolge regelt den Zahlungsverkehr mit leistungserbringenden Personen " +
        "und wird zu Abrechnung mit den Trägern derSozialversicherungen genutzt.",
    KZVA: "Hierbei handelt es sich um die Abrechnungsnummer von Zahnarztpraxen.",
    PRN: "Hierbei handelt es sich um eine Telematik-ID. Sie gewährleistet eine eindeutige elektronische Identitätserkennung von Leistungserbringenden und medizinischen Institutionen in der Telematik-Infrastruktur.",
};

export const helperTextPractitionerWrapper = {
    organization: "Einrichtung, in der die behandelnde Person arbeitet",
    ZANR: "Hierbei handelt es sich um eine Zahnarztnummer. Sie gilt lebenslang.",
    EFN: "Hierbei handelt es sich um eine Fortbildungsnummer.",
    ANR: "Hierbei handelt es sich um eine Arztnummer. Sie gilt lebenslang.",
};

export const helperTextRiskWrapper = {
    riskValue: "Hier geben Sie die Risiken der Person zum Zeitpunkt der Überleitung an.",
};
