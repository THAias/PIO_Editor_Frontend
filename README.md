# PIO_Editor_Frontend
[Englische version](./README_EN.md)
## Einführung

PIO_Editor_Frontend stellt das Frontend der Webanwendung PIO-ULB-Editor dar. Das Frontend ist die zweite Haupt
Komponente, die die Benutzeroberfläche bereitstellt. Das Layout des PIO-ULB-Editors wurde in einem iterativen Prozess anhand von
durch Benutzertests entwickelt und kontinuierlich verbessert, um die Benutzerfreundlichkeit zu optimieren. Das Frontend ist gebaut in
React mit TypeScript. Das Frontend besteht im Wesentlichen aus Frontend UI Komponenten, dem Redux Store und dem UUID
Dienst. Die einzelnen relevanten Komponenten und Konzepte werden im Folgenden erläutert.


|               |                                                                                                                                                                                                                                                      Description                                                                                                                                                                                                                                                       |
|:-------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| UI-Components | <p align="left"> Die Benutzeroberfläche (UI) unserer Anwendung wurde mit React und Ant Design entwickelt, um ein modernes, benutzerfreundliches und konsistentes Benutzererlebnis zu gewährleisten. <br /> Die Benutzeroberfläche nutzt vorgefertigte Oberflächenkomponenten aus der Ant Design Bibliothek für die Dateneingabe. <br /> Thematisch zusammenhängende Eingabefelder werden in einem Ant Design Formular zusammengefasst. Dies ermöglicht eine unabhängige Datenverarbeitung durch jedes Formular selbst. |
|     Redux     |                            <p align="left"> Redux ist ein prädiktiver Zustandscontainer für JavaScript-Anwendungen, der insbesondere mit React verwendet wird. Er zentralisiert den Anwendungszustand <br /> in einem einzigen Speicher, was die Verwaltung, Nachvollziehbarkeit und Wartbarkeit des Zustands vereinfacht. Durch die Verwendung reiner Funktionen (Reducer) <br /> und Aktionen wird der Zustand auf vorhersehbare Weise geändert, was das Debuggen und Testen erleichtert.                            |
| UUID-Service  |                                                                                                                                                          <p align="left"> Der UUID-Service speichert alle zuvor angelegten FHIR-Ressourcen und deren UUIDs, so dass <br /> eingegebene Daten immer der richtigen Ressource zugeordnet werden können.                                                                                                                                                          |


-----------------------------------------------------------------
## Voraussetzung
Um das Frontend schnell zu starten, muss der Benutzer alle Abhängigkeiten installieren, die in der package.json aufgeführt sind
Öffnen Sie das Terminal und installieren Sie alle Abhängigkeiten mit:
```
npm install
```

-----------------------------------------------------------------
## Quick Start

Das Frontend interagiert mit dem Backend-Repo. Stellen Sie sicher, dass der Backend-Service mit Docker bereitgestellt wird.
Im Backend-Repo finden Sie die Anleitung zum Starten von Docker.

Nachdem Sie das Backend gestartet haben, öffnen Sie das Terminal, wechseln Sie in das Root-Verzeichnis und starten Sie den Frontend-Server mit:

```
npm run start
```
Sobald der Server erfolgreich gestartet wurde, wird der Webserver lokal auf Port 3000 gehostet. Das Frontend startet auf der Login-Seite.
Nachdem sich der Benutzer mit seinem Vor- und Nachnamen angemeldet hat, kann er:
- eine neue PIO-Datei von Grund auf erstellen, indem er auf „PIO-ULB erstellen“ klickt
- eine bestehende PIO-Datei öffnen, indem er auf „PIO-ULB importieren“ klickt
- ein Beispiel-PIO mit vorausgefüllten Formularen erstellen, indem Sie auf „Demo öffnen“ klicken
- Kehrt der Benutzer zur Startseite zurück, kann er mit der geöffneten PIO-Datei fortfahren, indem er auf „Zurück zum PIO-ULB“ klickt.
- In der oberen rechten Ecke kann der Benutzer das Adressbuch öffnen, um Adressdaten zu verwalten.

-----------------------------------------------------------------
## Nutzvolle Skripte

Alle nachstehenden Skripte sind in der package.json aufgeführt.

```
npm run start
```
Führt eine hübschere Formatierung durch und startet die Entwicklungsumgebung mit bestimmten Umgebungsvariablen.

```
npm run build
```
Führt den TypeScript-Compiler ohne Ausgabe aus und erstellt eine Produktionsversion der Anwendung mit angepassten Umgebungsvariablen.

```
npm run build-local
```
Führt den TypeScript-Compiler ohne Ausgabe aus und erstellt eine lokale Build-Version der Anwendung mit spezifischen Umgebungsvariablen.

```
npm run start:localVersion
```
Führt eine hübschere Formatierung durch und startet die Entwicklungsumgebung mit lokalen Umgebungsvariablen.

```
npm run prettier:fix
```
Formatiert den Code in den angegebenen Verzeichnissen mit Prettier.

```
npm run prettier:check
```
Überprüft den Code in den angegebenen Verzeichnissen auf Prettier-Formatierung.

```
npm run lint
```
Prüft und korrigiert den TypeScript- und JavaScript-Code in den angegebenen Verzeichnissen mit TypeScript und ESLint.

```
npm run test:ci
```

Führt Jest-Tests im CI-Modus mit Code-Coverage-Berichten durch.

```
npm run test:sec
```

Führt ESLint aus und erstellt einen JSON-Bericht zur Sicherheitsanalyse.

```
npm run prepare
```

Initialisiert Husky für Git-Hooks.

-----------------------------------------------------------------
## Dokumentation

Denn Ziel ist die Erfassung relevanter Daten, die Bereitstellung verständlicher Eingabefelder und die formularbasierte Verarbeitung
der Daten ist die Kernaufgabe der Datenverarbeitung ist die Kernaufgabe des Frontends.

Bei Bedarf verfügen Eingabefelder über eine Validierung und prüfen das Vorhandensein von Pflichtfeldern, beispielsweise zusätzlich zu den Formularen, die das Ganze enthalten
Neben der Logik für die SubTree-Verarbeitung gibt es auch Wrapper-Komponenten, die mehrere Eingabefelder in einer Komponente bündeln.
Diese Wrapper stellen Module dar, die von Benutzern im Frontend mehrfach erstellt werden können (z. B. Allergien, Ärzte,
Adressen).

Sogenannte Akkordeon-Menüs rendern dann den Inhalt der Wrapper mehrfach.
Ein weiterer Aspekt bei der Entwicklung war der Umgang mit Referenzen. FHIR ermöglicht den Aufbau eines Informationsnetzwerks
durch Referenzieren von Ressourcen mithilfe von UUIDs.

Beispielsweise kann es vorkommen, dass Benutzer den zuständigen Arzt auswählen müssen
Das Diagnoseformular, in dem Ärzte in einer anderen Form erstellt werden. Damit Benutzer nicht hin und her springen müssen, wenn die
Wenn der diagnostizierende Arzt noch nicht erstellt wurde, können Sie über das Dropdown-Menü im Diagnoseformular einen neuen Arzt hinzufügen
vor Ort. vor Ort.

Diese Informationen – etwa die der Ärzte – müssen in beiden Formen synchron gehalten werden.
die mit Hilfe des zentralen Redux Stores realisiert wurde.
