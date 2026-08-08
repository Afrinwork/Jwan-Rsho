# CODEX PROMPT – PROJEKTSTRUKTUR ZUERST SAUBER AUFBAUEN

Lies zuerst vollständig die Datei:

`CODEX_MASTER_PROMPT.md`

Danach baue die Projektstruktur für die komplette App auf.

Wichtig:

Noch nicht unnötig alle Features komplett programmieren.

Zuerst muss die technische Grundlage sauber sein, damit danach jedes Feature direkt an die richtige Stelle kommt.

Die App benutzt:

* React Native
* Expo
* TypeScript
* Expo Router
* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Functions
* react-native-maps
* expo-location
* expo-secure-store
* react-hook-form
* zod
* @expo/vector-icons
* expo-linking

Die App ist nur für iPhone.

---

# 1. Grundregel

Die Struktur muss:

* einfach sein
* verständlich sein
* Feature-orientiert sein
* keine God Classes erzeugen
* keine riesigen Dateien haben
* keine doppelte Logik haben
* gut mit Codex weiterentwickelbar sein
* für kleine private App geeignet sein

Keine unnötige Enterprise-Architektur.

Nicht 10 Schichten zwischen Screen und Firebase bauen.

---

# 2. Gewünschte Hauptstruktur

Erstelle ungefähr diese Struktur:

```text
project-root/

app/
  _layout.tsx
  index.tsx

  (auth)/
    _layout.tsx
    login.tsx
    forgot-password.tsx

  (tabs)/
    _layout.tsx
    cities.tsx
    add.tsx
    map.tsx
    management.tsx
    settings.tsx

  city/
    [city].tsx

  customer/
    [id].tsx
    edit/
      [id].tsx

  order/
    [id].tsx

  admin/
    index.tsx
    users.tsx
    create-user.tsx

src/

  components/
    ui/
    layout/
    feedback/
    forms/

  features/

    auth/
      components/
      hooks/
      services/
      types/
      validation/

    cities/
      components/
      hooks/
      services/
      types/

    customers/
      components/
      hooks/
      services/
      types/
      validation/

    orders/
      components/
      hooks/
      services/
      types/
      validation/

    products/
      components/
      hooks/
      services/
      types/
      validation/

    map/
      components/
      hooks/
      services/
      types/
      utils/

    management/
      components/
      hooks/

    admin/
      components/
      hooks/
      services/
      types/
      validation/

    settings/
      components/
      hooks/
      services/
      types/

  firebase/
    config.ts
    auth.ts
    firestore.ts
    functions.ts

  repositories/
    authRepository.ts
    customerRepository.ts
    orderRepository.ts
    productRepository.ts
    countryRepository.ts
    regionRepository.ts
    userRepository.ts

  services/
    geocodingService.ts
    navigationService.ts
    sharingService.ts
    secureStorageService.ts

  store/
    authStore.ts
    appStore.ts

  hooks/
    useCurrentUser.ts
    useAppTheme.ts

  types/
    user.ts
    customer.ts
    order.ts
    product.ts
    country.ts
    region.ts
    common.ts

  utils/
    normalizeCity.ts
    formatAddress.ts
    formatError.ts
    date.ts

  constants/
    routes.ts
    app.ts
    colors.ts
    spacing.ts

  validation/
    commonSchemas.ts

  errors/
    AppError.ts
    errorMessages.ts

  config/
    env.ts

functions/
  src/
    index.ts
    admin/
      createUser.ts
      deleteUser.ts
      deleteUserData.ts
    shared/
      authGuard.ts
      firestoreHelpers.ts

tests/
  unit/
  repositories/
  security/
  integration/

assets/
  images/
  icons/

firebase/
  firestore.rules
  firestore.indexes.json

docs/
  CODEX_MASTER_PROMPT.md
  PROJECT_STRUCTURE.md
  DEVELOPMENT_PROGRESS.md
```

---

# 3. App-Ordner

Der `app/` Ordner ist ausschließlich für Expo Router.

Dort keine große Business-Logik schreiben.

Route-Dateien sollen möglichst klein sein.

Beispiel:

`app/(tabs)/cities.tsx`

soll nur den eigentlichen Feature-Screen laden.

Beispiel:

```tsx
import { CityListScreen } from '@/src/features/cities/components/CityListScreen';

export default function CitiesRoute() {
  return <CityListScreen />;
}
```

Keine Firebase Query direkt in Route-Dateien.

---

# 4. Auth Routing

Benutzer ohne Login:

nur:

* Login
* Passwort vergessen

Benutzer mit Login:

→ App Tabs

Admin:

→ gleiche App Tabs wie normaler Benutzer

plus Zugriff auf Admin-Bereich.

Kein Registrieren-Screen.

---

# 5. Root Layout

`app/_layout.tsx`

soll nur zentrale Dinge machen:

* App initialisieren
* Auth Status prüfen
* Splash/Ladezustand
* Theme
* Navigation Root

Keine Kunden- oder Bestelllogik dort.

---

# 6. Tab Navigation

Unter:

`app/(tabs)/_layout.tsx`

genau fünf Haupttabs:

1. Städte
2. Hinzufügen
3. Karte
4. Verwaltung
5. Einstellungen

Icons über:

`@expo/vector-icons`

Navigation einfach halten.

Keine doppelte Bottom-Navigation.

---

# 7. Features

Jedes große Thema bekommt eigenen Feature-Ordner.

Zum Beispiel:

```text
src/features/orders/
```

Dort gehören:

* UI Komponenten
* Hooks
* Feature-spezifische Services
* Typen
* Validierung

Nicht alles in global `components/` werfen.

---

# 8. Components

Globale Komponenten nur, wenn sie wirklich mehrfach verwendet werden.

Zum Beispiel:

```text
src/components/ui/
```

enthält:

* AppButton
* AppInput
* LoadingView
* EmptyState
* ErrorState
* ConfirmDialog
* SearchInput
* ScreenContainer

Feature-Komponenten bleiben im Feature.

---

# 9. Auth Struktur

```text
src/features/auth/
  components/
    LoginScreen.tsx
    LoginForm.tsx
    PasswordField.tsx

  hooks/
    useLogin.ts
    useAuthSession.ts

  services/
    authService.ts

  validation/
    loginSchema.ts

  types/
    authTypes.ts
```

---

# 10. City Struktur

```text
src/features/cities/
  components/
    CityListScreen.tsx
    CityCard.tsx
    CitySummaryHeader.tsx
    CityFilters.tsx
    CityCustomerList.tsx

  hooks/
    useCities.ts
    useCityCustomers.ts

  services/
    cityService.ts

  types/
    cityTypes.ts
```

Städte nicht in Firestore separat speichern.

Sie werden aus Kunden gruppiert.

---

# 11. Customer Struktur

```text
src/features/customers/
  components/
    CustomerCard.tsx
    CustomerDetailsScreen.tsx
    CustomerForm.tsx
    CustomerAddressSection.tsx
    CustomerActions.tsx
    CustomerSearch.tsx

  hooks/
    useCustomer.ts
    useCustomers.ts
    useCustomerForm.ts

  services/
    customerService.ts

  validation/
    customerSchema.ts

  types/
    customerTypes.ts
```

---

# 12. Order Struktur

```text
src/features/orders/
  components/
    AddOrderScreen.tsx
    ExistingCustomerSection.tsx
    NewCustomerSection.tsx
    OrderItemsSection.tsx
    ProductQuantityRow.tsx
    OrderSummary.tsx
    OrderHistory.tsx

  hooks/
    useAddOrder.ts
    useOrders.ts
    useOpenOrders.ts
    useOrderTotals.ts

  services/
    orderService.ts

  validation/
    orderSchema.ts

  types/
    orderTypes.ts
```

Wichtig:

AddOrderScreen darf nicht 500 Zeilen lang werden.

Teile Sections auf.

---

# 13. Map Struktur

Sehr wichtig.

```text
src/features/map/
  components/
    MapScreen.tsx
    CustomerMarker.tsx
    CustomerMapCard.tsx
    MapFilters.tsx
    MapToolbar.tsx
    CircleSelectionOverlay.tsx
    PolygonSelectionOverlay.tsx
    SelectedCustomersBar.tsx

  hooks/
    useMapCustomers.ts
    useMapSelection.ts
    useUserLocation.ts

  services/
    mapSelectionService.ts

  utils/
    circleMath.ts
    polygonMath.ts

  types/
    mapTypes.ts
```

Kartenlogik nicht komplett in `MapScreen.tsx`.

`MapScreen.tsx` soll hauptsächlich UI zusammensetzen.

---

# 14. Map Selection Service

Separater Service:

```text
mapSelectionService.ts
```

Aufgaben:

* prüfen ob Kunde in Kreis liegt
* prüfen ob Kunde in Polygon liegt
* Kunden anhand Auswahl zurückgeben

Keine Firestore Queries in diesem Service.

Keine UI darin.

Nur Geometrie.

---

# 15. Navigation Service

```text
src/services/navigationService.ts
```

Verantwortlich für:

* Apple Maps öffnen
* Google Maps öffnen
* Waze öffnen
* prüfen ob URL geöffnet werden kann

Map Screen baut keine URLs selbst zusammen.

---

# 16. Sharing Service

```text
src/services/sharingService.ts
```

Aufgaben:

* Nachricht erzeugen
* Kunden nummerieren
* Produktsummen erzeugen
* iOS Share Sheet öffnen

Keine WhatsApp API.

---

# 17. Firebase Struktur

```text
src/firebase/
  config.ts
  auth.ts
  firestore.ts
  functions.ts
```

`config.ts`

nur Firebase Initialisierung.

`auth.ts`

gemeinsame Auth Helfer.

`firestore.ts`

gemeinsame Firestore Instanz.

`functions.ts`

Cloud Functions Client.

Keine Kundenlogik hier.

---

# 18. Repositories

Repositories sind einzige zentrale Stelle für Datenzugriffe.

Zum Beispiel:

```text
customerRepository.ts
```

enthält:

* getCustomers
* getCustomerById
* createCustomer
* updateCustomer
* deleteCustomer

Jede Query immer mit aktuellem:

`ownerId`

wenn erforderlich.

---

# 19. Order Repository

```text
orderRepository.ts
```

enthält:

* getOpenOrders
* getOrdersByCustomer
* createOrder
* completeOrder
* cancelOrder
* deleteOrder

Bestellpositionen korrekt behandeln.

---

# 20. Auth Repository

```text
authRepository.ts
```

enthält:

* login
* logout
* resetPassword
* getCurrentUser

Kein Registrieren für normale Nutzer.

---

# 21. Admin Repository / Functions

Admin-Benutzerverwaltung nicht direkt über Firebase Auth Client lösen.

Frontend ruft Cloud Function.

Zum Beispiel:

```text
src/features/admin/services/adminService.ts
```

enthält:

* createUser
* deleteUser
* loadUsers

Cloud Functions liegen unter:

```text
functions/src/admin/
```

---

# 22. Cloud Functions

Erstelle:

```text
createUser.ts
```

prüft:

* Benutzer eingeloggt
* Benutzer role = admin

Dann:

* neuen Auth Benutzer erstellen
* Firestore User Dokument erstellen

Erstelle:

```text
deleteUser.ts
```

prüft:

* Admin
* Ziel ist nicht Admin selbst

Dann:

* alle User-Daten löschen
* Auth User löschen

---

# 23. Typen

Globale Models sauber definieren.

Zum Beispiel:

```text
src/types/customer.ts
```

Customer:

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
* region
* latitude
* longitude
* note
* isActive
* createdAt
* updatedAt

Keine `any` Types verwenden, wenn vermeidbar.

---

# 24. Firestore Collections

Nutze:

```text
users
customers
orders
products
countries
regions
userPreferences
```

Order Items:

```text
orders/{orderId}/items
```

Keine unnötigen Collections.

---

# 25. Auth Store

Nutze nur kleinen globalen Store.

Zum Beispiel Zustand:

```text
authStore.ts
```

enthält nur:

* currentUser
* authLoading
* isAdmin
* setUser
* clearUser

Keine Kundenlisten oder kompletten Bestellungen dort speichern, wenn nicht nötig.

---

# 26. Lokale Speicherung

Sensitive lokale Werte:

`expo-secure-store`

Zum Beispiel:

* bestimmte App Preferences
* sichere lokale Session-Helfer

Firebase Authentication übernimmt grundsätzlich die Auth Session.

Keine Passwörter lokal speichern.

---

# 27. Formulare

Benutze:

* react-hook-form
* zod
* @hookform/resolvers

Jedes größere Formular hat eigenes Schema.

Zum Beispiel:

```text
customerSchema.ts
orderSchema.ts
loginSchema.ts
createUserSchema.ts
```

---

# 28. Error Handling

Zentrale Fehlerstruktur:

```text
src/errors/
  AppError.ts
  errorMessages.ts
```

Firebase Fehler zuerst übersetzen.

UI bekommt verständlichen Text.

Nicht technische Fehlercodes anzeigen.

---

# 29. Loading / Empty / Error

Baue globale UI Komponenten:

```text
LoadingView
EmptyState
ErrorState
```

Damit Screens nicht jedes Mal unterschiedliche Logik bauen.

---

# 30. Größenregel

Sehr wichtig.

Eine Datei soll möglichst unter:

**100 Zeilen**

bleiben.

Wenn größer:

aufteilen.

Einzelne sinnvolle Ausnahmen sind erlaubt.

Aber keine:

* 400-Zeilen Screens
* 600-Zeilen Hooks
* 800-Zeilen Services

---

# 31. Keine God Components

Beispiel falsch:

```text
MapScreen.tsx
```

macht:

* Firebase Queries
* Map Rendering
* Polygon Berechnung
* Teilen
* Navigation
* Editieren
* Dialoge
* State Management

Das ist verboten.

Aufteilen.

---

# 32. Keine Barrel-Dateien überall

Nicht überall unnötige:

`index.ts`

Dateien erzeugen.

Nur verwenden, wenn es wirklich die Imports verbessert.

Wir wollen keinen versteckten Import-Dschungel.

---

# 33. Import Aliases

Konfiguriere saubere Aliases.

Zum Beispiel:

```text
@/src/features/...
@/src/components/...
@/src/services/...
@/src/types/...
```

Keine Imports wie:

```text
../../../../../../services/test
```

---

# 34. Environment Variablen

Firebase Konfiguration sauber über Expo Environment Variablen.

Zum Beispiel:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

Keine Firebase Admin Credentials im Expo Client.

---

# 35. Konfigurationsdateien

Projekt soll mindestens sauber konfigurieren:

* package.json
* tsconfig.json
* app.json oder app.config.ts
* eas.json
* eslint config
* prettier config wenn verwendet
* firebase.json
* firestore.rules
* firestore.indexes.json

Keine unnötigen Tools installieren.

---

# 36. TypeScript

Strict TypeScript aktivieren.

Zum Beispiel:

```json
"strict": true
```

Keine unnötigen:

```ts
any
```

Keine ungeprüften Casts.

---

# 37. Expo-Kompatibilität

Bevor Package installiert wird:

prüfen:

* funktioniert mit aktueller Expo Version?
* funktioniert für iOS?
* braucht Development Build?
* funktioniert EAS Build?

Nicht irgendein altes React-Native-Package installieren.

---

# 38. Expo Go

Expo Go nur für Funktionen benutzen, die darin unterstützt werden.

Wenn native Funktion ein Development Build benötigt:

sauber EAS Development Build konfigurieren.

Projekt nicht verbiegen, nur damit alles in Expo Go läuft.

---

# 39. iOS Konfiguration

App ist nur für iPhone.

Konfiguration entsprechend halten.

Permissions sauber definieren für:

* Standort

Keine unnötigen Berechtigungen.

---

# 40. Git Struktur

Erstelle `.gitignore`.

Nicht committen:

* node_modules
* lokale Environment Dateien
* Firebase Admin Credentials
* Service Account Keys
* Build Outputs

GitHub soll nur Source Code und sichere Config enthalten.

---

# 41. Dokumentation

Erstelle:

```text
docs/PROJECT_STRUCTURE.md
```

Darin kurz erklären:

* welche Ordner es gibt
* was wo hingehört
* welche Datei wofür zuständig ist
* was NICHT wo hingehört

Erstelle auch:

```text
docs/DEVELOPMENT_PROGRESS.md
```

Dort nach jedem größeren Feature dokumentieren:

* fertig
* offen
* bekannte Probleme
* Tests

---

# 42. Keine Platzhalter-Architektur

Nicht 100 leere Dateien erstellen.

Erstelle nur die Ordner und Dateien, die für aktuelle Grundstruktur sinnvoll sind.

Leere Feature-Ordner dürfen existieren.

Aber keine 200 Fake-Dateien.

---

# 43. Erste Basis-Implementierung

Nachdem Struktur erstellt wurde, implementiere nur die technische Basis:

1. Expo Router funktioniert.
2. Login Route funktioniert.
3. Tab Navigation funktioniert.
4. Firebase Initialisierung funktioniert.
5. Auth State funktioniert.
6. Rollenmodell funktioniert.
7. Protected Routes funktionieren.
8. Admin Route ist geschützt.
9. Error/Loading Komponenten funktionieren.
10. TypeScript Build läuft.

Danach stoppen.

Nicht direkt die komplette App in einem Schritt bauen.

---

# 44. Prüfungen danach

Nach der Struktur:

Führe mindestens aus:

```text
npm install
npx expo-doctor
npx tsc --noEmit
```

Wenn ESLint konfiguriert:

```text
npm run lint
```

Fehler beheben.

Nicht einfach Fehler ignorieren.

---

# 45. Danach Bericht geben

Nach Abschluss kurz dokumentieren:

* welche Ordner erstellt wurden
* welche Packages installiert wurden
* welche Basis funktioniert
* welche Tests/Checks erfolgreich waren
* welche Punkte als nächstes kommen

---

# 46. Sehr wichtige Regel

Ab diesem Zeitpunkt muss jede neue Funktion in diese Struktur integriert werden.

Nicht später neue parallele Architekturen anfangen.

Kein:

```text
src-new/
newArchitecture/
final/
final2/
utils2/
services-new/
```

Bestehende Struktur weiterverwenden.

---

# 47. Ziel

Nach diesem Schritt soll das Projekt so vorbereitet sein, dass wir danach schnell nacheinander bauen können:

* Login
* Kunden
* Produkte
* Bestellungen
* Städte
* Karte
* Kreis/Polygon
* Teilen
* Admin
* Einstellungen

ohne später das ganze Projekt neu strukturieren zu müssen.

Erstelle die Struktur jetzt sauber, klein und produktionsnah.
