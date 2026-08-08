 MASTER PROMPT FÜR CODEX – PRIVATE IPHONE BESTELL-APP

## 1. Ziel der App

Baue eine private iPhone-App zur Verwaltung von Kunden und Bestellungen.

Die App soll einfach, schnell, stabil und leicht wartbar sein.

Wichtige Ziele:

* nur für iPhone
* Entwicklung hauptsächlich unter Windows
* React Native
* Expo
* TypeScript
* Firebase als Backend
* mehrere Benutzerkonten
* ein Admin-Konto
* jeder Benutzer sieht nur seine eigenen Daten
* Daten bleiben dauerhaft gespeichert
* App soll nicht crashen
* keine God Classes
* keine unnötig komplizierte Architektur
* keine unnötigen Packages
* erste stabile Version soll möglichst innerhalb einer Woche fertig werden

Baue keine Funktionen, die für Version 1 nicht notwendig sind.

---

# 2. Plattform

Die App wird nur für Apple iPhone gebaut.

Keine Android-Version.

Keine Web-Version.

Technologien:

* React Native
* Expo
* TypeScript
* Expo Router
* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Functions
* Firebase Admin SDK
* react-native-maps
* expo-location
* expo-secure-store
* react-hook-form
* zod
* Zustand nur wenn wirklich nötig
* @expo/vector-icons
* expo-linking
* iOS Share Sheet
* Git
* GitHub
* EAS Build
* TestFlight
* Apple Developer Account

---

# 3. Entwicklung unter Windows

Die App wird hauptsächlich unter Windows entwickelt.

Workflow:

1. Projekt auf Windows erstellen.
2. VS Code benutzen.
3. Codex benutzen.
4. React Native + Expo benutzen.
5. Änderungen lokal testen.
6. Git benutzen.
7. Änderungen zu GitHub pushen.
8. iOS Builds mit EAS Build erstellen.
9. Apple Developer Account verbinden.
10. App zu TestFlight hochladen.
11. Auf echtem iPhone testen.
12. Fehler beheben.
13. erneut EAS Build erstellen.
14. finale Version zu App Store Connect hochladen.

Kein eigener Mac soll für tägliche Entwicklung notwendig sein.

---

# 4. Backend

Die App braucht kein eigenes Spring Boot oder Node.js Backend.

Firebase übernimmt das Backend.

Verwende:

## Firebase Authentication

Für:

* Login
* Benutzerkonten
* Passwort
* Session

## Cloud Firestore

Für:

* Benutzerprofile
* Kunden
* Bestellungen
* Produkte
* Länder
* Regionen
* Einstellungen

## Firebase Cloud Functions + Admin SDK

Nur für sichere Admin-Funktionen:

* Benutzer erstellen
* Benutzer endgültig löschen
* alle Daten eines Benutzers löschen

Admin-Zugangsdaten oder Admin SDK niemals direkt in der iPhone-App speichern.

---

# 5. Benutzerrollen

Es gibt genau zwei Rollen:

* admin
* user

Es gibt nur ein Admin-Konto.

Der Admin benutzt die App ganz normal wie jeder andere Benutzer.

Der Admin hat eigene:

* Kunden
* Bestellungen
* Produkte
* Karte
* Einstellungen

Zusätzlich sieht der Admin:

* Benutzerverwaltung
* kleines Admin-Dashboard

Normale Benutzer sehen diesen Bereich nicht.

---

# 6. Keine öffentliche Registrierung

Es gibt keinen Registrieren-Button.

Normale Benutzer dürfen sich nicht selbst registrieren.

Der Admin erstellt die Konten.

Der Admin gibt ein:

* vollständiger Name
* E-Mail
* Passwort

Danach kann sich der Benutzer auf seinem eigenen iPhone anmelden.

---

# 7. Login

Login-Screen:

* E-Mail
* Passwort
* Passwort anzeigen/verbergen
* Login
* Passwort vergessen

Keine Social-Logins.

Kein:

* Google
* Apple
* Facebook

Nach erfolgreichem Login:

→ Startseite Städte

---

# 8. Daten bleiben gespeichert

Alle wichtigen Daten werden in Firestore gespeichert.

Wenn Benutzer:

* App schließt
* iPhone ausschaltet
* App später erneut öffnet
* sich auf neuem iPhone anmeldet

sollen seine Daten wieder vorhanden sein.

Beispiel:

Ahmed meldet sich an.

Er hat:

* 100 Kunden
* 25 offene Bestellungen
* eigene Produkte

Ahmed schließt App.

Am nächsten Tag:

Ahmed öffnet App.

Daten werden wieder geladen.

Nichts darf einfach verschwinden.

---

# 9. Datentrennung

Sehr wichtig.

Jeder Datensatz gehört einem Benutzer.

Jeder Datensatz bekommt:

`ownerId`

Beispiel:

Ahmed:

`ownerId = uid_ahmed`

Ali:

`ownerId = uid_ali`

Ahmed darf niemals Daten von Ali sehen.

Ali darf niemals Daten von Ahmed sehen.

Diese Regel muss in Firestore Security Rules geschützt werden.

Nicht nur im Frontend.

---

# 10. App-Navigation

Benutze Expo Router.

Bottom Navigation mit fünf Hauptbereichen:

1. Städte
2. Hinzufügen
3. Karte
4. Verwaltung
5. Einstellungen

Verwende keine zweite komplizierte Navigation zusätzlich.

Expo Router soll das Hauptsystem sein.

Unterseiten können Stack Navigation benutzen.

Navigation soll einfach und logisch bleiben.

---

# 11. Städte-Seite

Die Städte-Seite ist die Startseite nach dem Login.

Oben:

* Titel Städte
* Suchfeld
* Länderfilter
* optional nur offene Bestellungen

Darunter:

Stadt-Karten.

Beispiel:

Hamburg

12 Kunden

8 offene Bestellungen

Köln

7 Kunden

4 offene Bestellungen

Städte werden automatisch aus Kundenadressen erzeugt.

Keine eigene Städteverwaltung.

---

# 12. Stadt öffnen

Beim Klick auf eine Stadt:

zeige Kunden dieser Stadt.

Oben:

* Stadtname
* Kundenanzahl
* offene Bestellungen
* Suchfeld
* Produktsummen

Beispiel:

Hamburg

Käse: 20 kg

Labneh: 10 kg

Oliven: 15 kg

Summen sollen automatisch berechnet werden.

---

# 13. Kundenliste

Jede Kundenkarte zeigt:

* Name
* Telefonnummer
* Straße
* Hausnummer
* PLZ
* Stadt
* aktuelle Bestellung
* Status

Aktionen:

* Kunde öffnen
* Kunde bearbeiten
* anrufen
* Navigation öffnen
* neue Bestellung hinzufügen
* Bestellung erledigen

Suche:

* Name
* Telefonnummer
* Stadt
* Straße

---

# 14. Kunde-Daten

Ein Kunde besitzt:

* id
* ownerId
* fullName
* phone
* street
* houseNumber
* postalCode
* city
* normalizedCity
* country
* region optional
* latitude
* longitude
* note optional
* isActive
* createdAt
* updatedAt

---

# 15. Neue Bestellung

Beim Tab Hinzufügen:

zuerst wählen:

* bestehender Kunde
* neuer Kunde

---

# 16. Neuer Kunde

Felder:

## Kundendaten

* vollständiger Name
* Telefonnummer
* Notiz optional

## Adresse

* Straße
* Hausnummer
* PLZ
* Stadt
* Land
* Region optional

Danach:

Adresse geocodieren.

Koordinaten speichern.

Nicht jedes Mal neu geocodieren.

---

# 17. Bestehender Kunde

Suche nach:

* Name
* Telefonnummer
* Stadt
* Straße

Nach Auswahl:

Kundendaten automatisch laden.

Adresse nicht erneut eingeben.

Nur Produkte und Mengen auswählen.

---

# 18. Produkte

Produkte werden nicht fest in den Code geschrieben.

Der Benutzer kann Produkte verwalten.

Produkt besitzt:

* id
* ownerId
* name
* normalizedName
* defaultUnit
* isActive
* sortOrder
* createdAt
* updatedAt

Beispiele:

* جبنة بلدية
* جبنة مشللة
* مسنرة
* لبنة
* زيتون

---

# 19. Bestellung

Eine Bestellung besitzt:

* id
* ownerId
* customerId
* status
* note
* orderedAt
* completedAt
* createdAt
* updatedAt

Status:

* open
* completed
* cancelled

---

# 20. Bestellpositionen

Eine Bestellung hat mehrere Positionen.

Beispiel:

جبنة بلدية – 3 kg

لبنة – 2 kg

زيتون – 4 kg

Jede Position besitzt:

* id
* productId
* productNameSnapshot
* quantity
* unit
* sortOrder

Menge muss größer als 0 sein.

Bestellung kann nicht ohne Produkt gespeichert werden.

---

# 21. Bestellung erledigen

Wenn Benutzer auf Erledigt klickt:

setze:

`status = completed`

und:

`completedAt`

Danach:

* Bestellung verschwindet aus offenen Bestellungen
* Kunde bleibt gespeichert
* Adresse bleibt gespeichert
* Kunde bleibt im Verlauf
* Pin verschwindet nur dann aus Standardkarte, wenn keine offene Bestellung mehr existiert

Kunde darf nicht automatisch gelöscht werden.

---

# 22. Karte

Verwende:

`react-native-maps`

und:

`expo-location`

Karte zeigt standardmäßig Kunden mit offenen Bestellungen.

Pins anzeigen.

Filter:

* Land
* Stadt
* Region

Wenn möglich:

Pins nummerieren.

---

# 23. Klick auf Kartenpin

Beim Klick:

zeige Bottom Sheet oder Detail-Karte.

Anzeigen:

* Name
* Telefonnummer
* Adresse
* Produkte
* Mengen
* Notiz

Buttons:

* Bearbeiten
* Löschen
* Anrufen
* Standort teilen
* Navigation

---

# 24. Bearbeiten von der Karte

Wenn Benutzer auf Bearbeiten klickt:

direkt Edit-Screen oder Sheet öffnen.

Bearbeitbar:

* Name
* Telefonnummer
* Straße
* Hausnummer
* PLZ
* Stadt
* Land
* Region
* Produkte
* Mengen
* Notiz

Nach Speichern:

* Karte aktualisieren
* Pin aktualisieren
* Stadt aktualisieren
* Bestellung aktualisieren

Keine unnötigen Umwege.

---

# 25. Navigation mit Karten-Apps

Die App soll keine eigene Route berechnen.

Nur externe Apps öffnen.

Unterstützen:

* Apple Maps
* Google Maps
* Waze

Verwende Expo Linking.

Wenn App nicht installiert:

sauber behandeln.

Apple Maps als Standard.

---

# 26. Auswahl auf Karte

Sehr wichtig.

Benutzer soll Kunden auf der Karte auswählen können.

Unterstützen:

* einzelne Pins auswählen
* Kreis zeichnen
* Polygon zeichnen
* Auswahl löschen

---

# 27. Kreis-Auswahl

Benutzer setzt einen Kreis.

Alle Kunden innerhalb des Kreises werden ausgewählt.

Danach anzeigen:

„8 Kunden ausgewählt“

Benutzer kann:

* einzelne entfernen
* weitere hinzufügen
* Auswahl löschen
* teilen

---

# 28. Polygon-Auswahl

Benutzer zeichnet ein Polygon.

Alle Kunden innerhalb des Polygons werden ausgewählt.

Geometrie nicht direkt in der UI berechnen.

Eigener kleiner Service.

Zum Beispiel:

`MapSelectionService`

Funktionen:

* isPointInsideCircle
* isPointInsidePolygon
* getSelectedCustomers

---

# 29. Teilen / WhatsApp

Keine WhatsApp Business API.

App erzeugt normalen Text.

Dann iOS Share Sheet öffnen.

Beispiel:

Hamburg

1. Ahmad Ali
   Musterstraße 12

• جبنة بلدية: 2 kg
• لبنة: 1 kg

2. Sara Ali
   Hauptstraße 8

• زيتون: 3 kg

Gesamt:

جبنة بلدية: 2 kg
لبنة: 1 kg
زيتون: 3 kg

Danach kann Benutzer WhatsApp auswählen.

---

# 30. Verwaltung

Normale Benutzer sehen:

## Produkte

* hinzufügen
* bearbeiten
* deaktivieren
* löschen
* Reihenfolge ändern

## Länder

* hinzufügen
* bearbeiten
* deaktivieren

## Regionen

* hinzufügen
* bearbeiten
* deaktivieren

Admin sieht zusätzlich:

## Benutzer

* Benutzer anzeigen
* Benutzer erstellen
* Benutzer löschen

---

# 31. Admin-Dashboard

Sehr klein halten.

Admin Dashboard zeigt:

* Anzahl Benutzer
* aktive Benutzer
* eigene Kundenanzahl
* eigene offene Bestellungen

Buttons:

* Benutzer anlegen
* Benutzerverwaltung

Keine komplexen Statistiken.

---

# 32. Benutzer erstellen

Admin gibt ein:

* Name
* E-Mail
* Passwort

App ruft sichere Firebase Cloud Function auf.

Cloud Function:

1. prüft ob aktueller Benutzer Admin ist
2. erstellt Auth-Konto
3. erstellt Firestore User Profil
4. setzt role = user
5. gibt Erfolg zurück

Nie Admin SDK direkt im Client.

---

# 33. Benutzer endgültig löschen

Admin kann Benutzer löschen.

Vorher Dialog:

„Dieses Konto und alle Daten werden endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.“

Dann:

Cloud Function:

1. Admin-Recht prüfen
2. Kunden löschen
3. Bestellungen löschen
4. Bestellpositionen löschen
5. Produkte löschen
6. Länder löschen
7. Regionen löschen
8. Einstellungen löschen
9. Benutzerprofil löschen
10. Firebase Auth Konto löschen

Admin darf nicht versehentlich sein eigenes Konto löschen.

---

# 34. Einstellungen

Normaler Benutzer:

* Name
* E-Mail
* Passwort ändern
* Hellmodus
* Dunkelmodus
* Systemmodus
* bevorzugte Navigations-App
* Logout

Zusätzlich:

* App-Version
* Kundenanzahl
* Bestellanzahl

---

# 35. Firestore Collections

Nutze ungefähr:

`users`

`customers`

`orders`

`products`

`countries`

`regions`

`userPreferences`

Bestellpositionen:

`orders/{orderId}/items`

Keine unnötigen Collections.

---

# 36. Firestore Security Rules

Sehr wichtig.

Nur angemeldete Benutzer.

Lesen:

nur wenn ownerId zum aktuellen Benutzer gehört.

Schreiben:

nur wenn ownerId zum aktuellen Benutzer gehört.

ownerId darf später nicht manipuliert werden.

Admin-Funktionen nur über sichere Cloud Functions.

---

# 37. Packages

Benutze nur notwendige Packages.

## Basis

* expo
* react
* react-native
* typescript

## Navigation

* expo-router
* react-native-screens
* react-native-safe-area-context

## Firebase

* firebase

## Formulare

* react-hook-form
* zod
* @hookform/resolvers

## Karte

* react-native-maps
* expo-location

## Speicherung

* expo-secure-store

## Icons

* @expo/vector-icons

## Linking

* expo-linking

## Status

* zustand nur wenn globale Zustände wirklich notwendig sind

Keine unnötigen Packages installieren.

---

# 38. Keine doppelten Navigationssysteme

Nicht gleichzeitig Expo Router komplett und manuelles React Navigation Setup parallel bauen.

Expo Router ist Hauptsystem.

Expo Router verwendet React Navigation intern.

Halte Routing einfach.

---

# 39. Ordnerstruktur

Nutze ungefähr:

src/

app/

* _layout.tsx
* index.tsx
* login.tsx

app/(tabs)/

* _layout.tsx
* cities.tsx
* add.tsx
* map.tsx
* management.tsx
* settings.tsx

features/

auth/
cities/
customers/
orders/
products/
map/
admin/
settings/

components/

services/

repositories/

hooks/

store/

types/

utils/

firebase/

tests/

---

# 40. Feature-Aufbau

Beispiel Cities:

features/cities/

* CityListScreen.tsx
* CityCard.tsx
* useCities.ts
* cityService.ts
* cityTypes.ts

Beispiel Orders:

features/orders/

* AddOrderScreen.tsx
* OrderItemsSection.tsx
* ProductQuantityRow.tsx
* useAddOrder.ts
* orderRepository.ts
* orderValidation.ts

Keine riesigen Dateien.

---

# 41. Größenregel

Eine Datei möglichst unter 100 Zeilen.

Wenn Datei größer wird:

aufteilen.

Ausnahmen nur wenn sinnvoll.

Keine Datei mit 500–1000 Zeilen.

---

# 42. God Classes verboten

Keine Klasse oder Datei darf gleichzeitig:

* Firebase
* UI
* Navigation
* Geocoding
* Formulare
* Teilen
* Kartenlogik
* Benutzerlogik

machen.

Verantwortlichkeiten trennen.

---

# 43. Funktionen klein halten

Funktionen möglichst unter 25–30 Zeilen.

Wenn zu lang:

aufteilen.

Klare Funktionsnamen.

Gut:

`loadOpenOrders`

`createCustomer`

`completeOrder`

`buildShareMessage`

`deleteUserCompletely`

`getCustomersInsidePolygon`

Schlecht:

`doStuff`

`handleData`

`process`

`manager`

---

# 44. Fehlerbehandlung

App darf nicht wegen normaler Fehler crashen.

Behandle:

* kein Internet
* Firebase Fehler
* Login falsch
* ungültige Daten
* Adresse nicht gefunden
* Daten fehlen
* Benutzer wurde gelöscht
* Navigation-App fehlt
* Firestore nicht erreichbar

Benutzerfreundliche Fehlermeldungen.

Keine technischen Firebase Codes anzeigen.

---

# 45. Keine gefährlichen Dinge

Keine:

* Admin Secrets im Client
* Service Account JSON im Client
* Firebase Admin SDK in React Native
* Passwörter in Firestore Klartext speichern
* API Keys unnötig hardcoden
* Force-Casts
* ungeprüfte undefined Werte
* Daten anderer Benutzer laden

---

# 46. Ladezustände

Jeder wichtige Screen braucht:

* loading
* success
* empty
* error

Buttons beim Speichern deaktivieren.

Doppelklick darf keine doppelte Bestellung erzeugen.

---

# 47. Performance

App soll flüssig bleiben.

Dafür:

* FlatList statt riesigem ScrollView
* nur notwendige Daten laden
* Firestore Queries filtern
* ownerId immer mitfiltern
* Koordinaten nur einmal speichern
* keine unnötigen Re-Renders
* useMemo/useCallback nur wenn sinnvoll
* Kartenberechnungen aus UI raus
* Pins bei vielen Kunden clustern, wenn notwendig
* keine unnötigen Animationen
* keine großen Bilder

---

# 48. Lokale Speicherung

Login-Session kann lokal gespeichert werden.

Verwende:

`expo-secure-store`

Aber wichtige Kundendaten bleiben in Firestore.

Kein eigenes Offline-System in Version 1.

Firestore Caching kann verwendet werden, wenn problemlos.

---

# 49. Tests

Nicht tausende Tests.

Aber wichtige Logik testen:

* Login
* Rollenprüfung
* ownerId Trennung
* Bestellung validieren
* Menge > 0
* Produktsummen
* Stadt-Normalisierung
* Bestellung erledigen
* Kunde bleibt erhalten
* Share Text
* Kreis-Auswahl
* Polygon-Auswahl
* Admin Rechte
* normaler Benutzer kann Admin-Funktion nicht nutzen

---

# 50. Reihenfolge für eine Woche

Ziel: funktionierende Version in ungefähr einer Woche.

## Tag 1

* Expo Projekt
* TypeScript
* Expo Router
* Firebase Setup
* Login
* Auth Session
* Bottom Tabs
* Rollen

## Tag 2

* Kundenmodell
* Produktmodell
* Bestellung
* Firestore Repositories
* neuer Kunde
* bestehender Kunde
* Bestellung speichern

## Tag 3

* Städte automatisch gruppieren
* Kundenlisten
* Suche
* offene Bestellungen
* erledigte Bestellungen
* Produktsummen

## Tag 4

* Map
* Pins
* Kundendetails
* Editieren
* Anrufen
* Apple Maps
* Google Maps
* Waze

## Tag 5

* Kreis-Auswahl
* Polygon-Auswahl
* Kundenauswahl
* Teilen
* WhatsApp/iOS Share

## Tag 6

* Admin Dashboard
* Benutzer erstellen
* Benutzer löschen
* Produkte
* Länder
* Regionen
* Einstellungen

## Tag 7

* Fehler beheben
* Security Rules prüfen
* Tests
* Performance
* echte iPhone Tests
* EAS Build
* TestFlight

Wenn eine Funktion zu komplex wird:

vereinfache sie.

Nicht neue Features hinzufügen.

---

# 51. Nicht in Version 1

Nicht bauen:

* Android
* Web
* Chat
* KI
* Rechnungen
* Zahlungen
* Abonnements
* Push Notifications
* automatische Routenoptimierung
* Live Tracking
* komplexe Statistiken
* eigenes Server Backend
* Microservices
* Offline Sync Engine
* Social Login
* Bilder Upload
* Videos

---

# 52. UI Design

Design:

* modern
* sauber
* Apple-ähnlich
* große Buttons
* gute Abstände
* klar lesbar
* wenig Farben
* einfach

Unterstützen:

* Light Mode
* Dark Mode

Keine komplizierten UI Libraries.

---

# 53. Codex Arbeitsweise

Vor jeder Aufgabe:

1. Lies diese Datei komplett.
2. Prüfe bestehende Dateien.
3. Prüfe ob Funktion schon existiert.
4. Vermeide doppelte Logik.
5. Plane nur den nächsten kleinen Schritt.
6. Implementiere.
7. Teste.
8. Refactore.
9. Prüfe Dateigröße.
10. Erst dann weiter.

Nicht alles gleichzeitig neu bauen.

---

# 54. Nach jedem Feature prüfen

Prüfe:

* kann App crashen?
* Datei über 100 Zeilen?
* Funktion zu groß?
* God Class?
* doppelte Logik?
* Firebase direkt in UI?
* ownerId korrekt?
* Admin Rechte korrekt?
* Loading State?
* Empty State?
* Fehler behandelt?
* Navigation sauber?
* unnötiges Package?
* unnötige Re-Renders?
* doppelte Firestore Requests?
* Doppelklick möglich?
* Datenverlust möglich?

Wenn Problem vorhanden:

direkt beheben.

---

# 55. Definition fertig

Version 1 ist fertig wenn:

* Admin kann sich einloggen
* Admin kann App normal benutzen
* Admin sieht kleines Dashboard
* Admin kann Benutzer erstellen
* Admin kann Benutzer endgültig löschen
* normale Benutzer können sich einloggen
* keine Registrierung vorhanden
* Benutzer können auf eigenem iPhone einloggen
* jeder sieht nur eigene Daten
* Daten bleiben nach App-Neustart erhalten
* Kunden erstellen funktioniert
* bestehenden Kunden wiederverwenden funktioniert
* Produkte funktionieren
* Bestellungen funktionieren
* Mengen funktionieren
* Städte automatisch erscheinen
* Kunden nach Stadt funktionieren
* Produktsummen funktionieren
* offene Bestellungen funktionieren
* erledigte Bestellungen funktionieren
* Karte funktioniert
* Pins funktionieren
* Kundendetails auf Karte funktionieren
* Bearbeiten auf Karte funktioniert
* Anrufen funktioniert
* Apple Maps funktioniert
* Google Maps funktioniert
* Waze funktioniert
* Kreis-Auswahl funktioniert
* Polygon-Auswahl funktioniert
* Teilen funktioniert
* Produkte verwalten funktioniert
* Länder verwalten funktioniert
* Regionen verwalten funktioniert
* Security Rules funktionieren
* keine bekannten Crashs vorhanden
* wichtige Tests laufen
* EAS iOS Build erfolgreich
* App auf TestFlight
* App auf echtem iPhone getestet

---

# 56. Wichtigste Regel

Wenn du zwischen einer komplizierten und einer einfachen Lösung wählen kannst:

nimm die einfache Lösung.

Die App soll nicht technisch beeindruckend wirken.

Die App soll zuverlässig funktionieren.

Priorität:

1. keine Crashs
2. keine Datenverluste
3. Sicherheit
4. einfache Bedienung
5. schnelle App
6. sauberer Code
7. schnelle Fertigstellung

Keine unnötige Perfektion.

Keine unnötige Architektur.

Keine unnötigen Features.

Ziel ist eine stabile private iP