# Release Checklist

## Build Status

- Status: `NOT READY`
- App Name: `Rsho Orders`
- Bundle Identifier: `com.rsho.cheeseorders`
- Version: `1.0.0`
- iOS Build Number: `1`
- EAS Profiles vorhanden: `development`, `preview`, `production`
- EAS CLI lokal pruefbar: `npx eas-cli --version` -> `eas-cli/21.7.0`
- EAS Login Stand am 8. August 2026: `Not logged in`

## Tests

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit -p functions/tsconfig.json`
- Ergebnis: lokal gruen

## Security

- `.env` und `.env.*` sind in `.gitignore`
- `.env.example` enthaelt nur erlaubte Expo-Clientwerte
- Keine Firebase Admin Credentials im Expo-Projekt gefunden
- Keine Service-Account-Dateien im Repo gefunden
- Firebase Client Config nutzt nur `EXPO_PUBLIC_*` Werte

## Firebase

- Firestore Rules vorhanden und getestet
- Functions TypeScript Check gruen
- Firebase Projekt in `.firebaserc`: `demo-rsho-test`
- Reale Deploy-/Smoke-Tests gegen produktive Firebase-Umgebung noch offen

## EAS

- `eas.json` vorbereitet
- `development`: internal + development client
- `preview`: internal
- `production`: store + autoIncrement
- Noch offen:
  - Expo Login
  - iOS Preview Build
  - iOS Production Build
  - TestFlight Upload

## iPhone Test

- Noch nicht ausgefuehrt
- Muss auf echtem iPhone getestet werden:
  - Login
  - Keyboard
  - Formulare
  - Safe Areas
  - Bottom Tabs
  - Dark Mode
  - Karte
  - GPS
  - Telefon
  - Share Sheet
  - externe Navigation
  - Performance

## TestFlight

- Noch nicht gestartet
- Reihenfolge:
  1. `npx eas-cli login`
  2. `npx eas-cli build --platform ios --profile preview`
  3. Preview Build auf echtem iPhone testen
  4. `npx eas-cli build --platform ios --profile production`
  5. Upload zu App Store Connect / TestFlight pruefen
  6. TestFlight Smoke Test ausfuehren

## Bekannte Probleme

- Kein aktiver Expo-/EAS-Login in dieser Umgebung
- Kein echter iPhone-Test erfolgt
- Kein Preview-Build erfolgt
- Kein TestFlight-Smoke-Test erfolgt
- Splash-Asset ist vorhanden, aber die visuelle Splash-Pruefung kann erst im echten iOS-Build bestaetigt werden

## Statusbewertung

### BLOCKER

- Kein Expo-/EAS-Login, daher kein iOS Preview Build moeglich
- Kein echter iPhone-Test erfolgt
- Kein TestFlight Build / Upload erfolgt
- Kein TestFlight Smoke Test erfolgt

### HOCH

- Reale Firebase-/Cloud-Function-Pruefung gegen die spaetere Produktivumgebung steht noch aus

### MITTEL

- Splash Screen wurde lokal nicht visuell ueber einen echten iOS-Build bestaetigt

### NIEDRIG

- Die Grossdatenpruefung mit 500 Kunden ist simuliert und ersetzt kein echtes Performance-Profiling auf realer Hardware
