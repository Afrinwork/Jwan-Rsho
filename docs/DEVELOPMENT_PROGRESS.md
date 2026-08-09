# Development Progress

## Phase 1

Finished:

- Firebase app, auth, Firestore, and functions clients are wired into the Expo app.
- Expo Router is set up with auth routes, five tabs, protected admin routes, and redirect guards.
- Email/password login, forgot-password reset, logout, loading states, and error states are implemented.
- Auth session persistence is configured with React Native persistence for Firebase Auth.
- Roles `admin` and `user` are resolved from the `users` collection.
- Admin dashboard stays small and shows only active users, own customers, own open orders, and own total orders.
- Admin can create a user and delete a user by email or UID without exposing a public user list.

Open:

- Cloud Functions still need deployment and Firebase project secrets in the real environment.
- Customer and order management flows are intentionally not built yet beyond dashboard counts.

Known issues:

- Dashboard counts depend on Firestore collections and indexes existing in the target Firebase project.

Checks:

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`

## Phase 2 - KI 1 Daten/Firebase

Was fertig ist:

- Vollstaendige Datenmodelle fuer `Customer`, `Product`, `Order` und `OrderItem` sind angelegt.
- Zod-Schemas fuer Customer, Product, Order und OrderItem validieren Pflichtfelder, `quantity > 0` und mindestens ein Produkt pro Bestellung.
- `customerRepository`, `productRepository` und `orderRepository` sind mit Owner-Schutz und Firestore-Zugriffen implementiert.
- `orderRepository.createOrder()` unterstuetzt bestehende Kunden oder neuen Kunden in einer Firestore-Transaction.
- Order-Items werden unter `orders/{orderId}/items` geschrieben.
- `normalizeCity()` und eine klarere `geocodingService`-Schnittstelle fuer Adressaufbau und Geocoding sind vorbereitet.
- Firestore Rules erlauben den sicheren Zugriff auf `orders/{orderId}/items` nur ueber den Besitzer der Parent-Order.

Welche Dateien erstellt wurden:

- `src/types/product.ts`
- `src/types/orderItem.ts`
- `src/features/customers/validation/customerSchema.ts`
- `src/features/products/validation/productSchema.ts`
- `src/features/orders/validation/orderItemSchema.ts`
- `src/features/orders/validation/orderSchema.ts`
- `src/repositories/repositoryContext.ts`
- `src/repositories/customerRepositoryData.ts`
- `src/repositories/productRepositoryData.ts`
- `src/repositories/orderRepositoryData.ts`
- `src/repositories/productRepository.ts`
- `tests/unit/normalizeCity.test.ts`
- `tests/unit/orderValidation.test.ts`
- `tests/repositories/customerRepositoryData.test.ts`
- `tests/repositories/orderRepositoryData.test.ts`

Tests:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

Offene Punkte:

- Firestore-Composite-Indexes fuer spaetere produktive Such- und Sortierpfade koennen je nach echter Datenmenge noch noetig werden.
- UI/Form-Integration fuer die neuen Repository-Methoden bleibt bei KI 2.
- Falls echte Retry-Idempotenz ueber App-Neustarts hinweg noetig wird, sollte die UI eine stabile `orderId` oder Request-ID an `createOrder()` weitergeben.

## Phase 2 - KI 2 UI/Formulare

Was fertig ist:

- Hinzufuegen-Tab (`AddOrderScreen`) mit klarer Auswahl beim Start: "Bestehender Kunde" oder "Neuer Kunde" (`CustomerModeSelector`).
- Neuer-Kunde-Formular (Kundendaten + Adresse) via `react-hook-form` + `zod`, validiert gegen KI 1s `customerSchema` (keine eigene, doppelte Validierungslogik).
- Kundensuche fuer bestehende Kunden nach Name, Telefon, Stadt und Strasse ueber `useCustomerSearch` -> `customerRepository.searchCustomers`; nach Auswahl werden Kundendaten und Adresse nur angezeigt, keine erneute Eingabe noetig.
- Produktauswahl per `ProductPicker`-Modal (Suche, aktive Produkte, bereits verwendete Produkte ausgeblendet) und `ProductQuantityRow` (Menge, Einheit aenderbar, Entfernen mit Bestaetigungsdialog). Menge > 0 wird erzwungen, Speichern ohne Produkt ist blockiert.
- Speichern-Button mit Loading-Zustand, Disabled-Zustand und echtem Doppelklick-Schutz (`guardAsync`, unabhaengig vom React-Render-Timing). Erfolg zeigt eine klare Meldung und setzt das Formular zurueck; Fehler laufen durch `formatError` und zeigen nie rohe Firebase-Fehler.
- `orderRepository.createOrder()` wird direkt aus `useAddOrder` verwendet (kein zusaetzlicher Mock- oder Zwischen-Service, da das Repository bereits vorhanden ist).
- Wiederverwendbare Customer-Komponenten fuer spaetere Screens: `CustomerCard`, `CustomerSearchResult`, `CustomerSearch`, `CustomerAddressView`, `CustomerForm`, `CustomerAddressSection`.
- Produkt-Grund-UI (`ProductManagementSection`, `ProductListItem`, `ProductForm`) mit Anzeigen/Hinzufuegen/Bearbeiten/Aktiv-Toggle, eingebunden im Verwaltung-Tab.
- Neue geteilte UI-Bausteine: `SearchInput`, `ConfirmDialog`, `FormField`, sowie ein `loading`-Prop fuer `AppButton`.
- Helle/dunkle Farb-Token (`useThemeColors`) fuer alle neuen Order-/Customer-/Product-Screens; bestehende `colors`-Konstante bleibt unveraendert exportiert, damit Phase-1-Komponenten unveraendert funktionieren.

Welche Dateien erstellt wurden:

- `src/hooks/useThemeColors.ts`
- `src/utils/guardAsync.ts`
- `src/components/forms/FormField.tsx`
- `src/components/ui/SearchInput.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/features/orders/types/orderFormTypes.ts`
- `src/features/orders/validation/addOrderFormSchema.ts`
- `src/features/orders/hooks/useAddOrder.ts`
- `src/features/customers/hooks/useCustomerSearch.ts`
- `src/features/products/hooks/useProducts.ts`
- `src/features/customers/components/CustomerCard.tsx`
- `src/features/customers/components/CustomerSearchResult.tsx`
- `src/features/customers/components/CustomerSearch.tsx`
- `src/features/customers/components/CustomerAddressView.tsx`
- `src/features/customers/components/CustomerForm.tsx`
- `src/features/customers/components/CustomerAddressSection.tsx`
- `src/features/products/components/ProductListItem.tsx`
- `src/features/products/components/ProductPicker.tsx`
- `src/features/products/components/ProductForm.tsx`
- `src/features/products/components/ProductManagementSection.tsx`
- `src/features/orders/components/CustomerModeSelector.tsx`
- `src/features/orders/components/ExistingCustomerSection.tsx`
- `src/features/orders/components/NewCustomerSection.tsx`
- `src/features/orders/components/OrderItemsSection.tsx`
- `src/features/orders/components/ProductQuantityRow.tsx`
- `src/features/orders/components/SaveOrderButton.tsx`
- `tests/unit/addOrderFormSchema.test.ts`
- `tests/unit/guardAsync.test.ts`
- `tests/unit/formatError.test.ts`

Welche Dateien erweitert wurden:

- `src/constants/colors.ts` (Dark-Mode-Palette ergaenzt, `colors`-Export bleibt fuer bestehende Komponenten identisch)
- `src/components/ui/AppButton.tsx` (`loading`-Prop ergaenzt)
- `src/features/orders/components/AddOrderScreen.tsx` (Platzhalter durch echten Screen ersetzt)
- `src/features/management/components/ManagementScreen.tsx` (`ProductManagementSection` eingebunden, scrollbar gemacht)

Tests:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (deckt ab: neues-Kunde-Formular gueltig, Pflichtfelder fehlen, Bestellung ohne Produkt, ungueltige Menge, Auswahl bestehender Kunde, Doppelklick-Schutz, verstaendliche Fehlermeldungen)

Offene Integrationspunkte:

- Dark-Mode-Token (`useThemeColors`) sind bisher nur in den neuen Order-/Customer-/Product-Komponenten verdrahtet. Die bestehenden Phase-1-Primitives (`AppInput`, `EmptyState`, `ErrorState`, `SuccessState`, `LoadingView`, `ScreenContainer`) nutzen weiterhin die statische, helle `colors`-Konstante und sollten in einer spaeteren Aufraeum-Runde mitgezogen werden.
- Es gibt noch kein Inline-"Produkt schnell anlegen" direkt aus dem Bestellformular heraus; Produkte muessen vorher in der Verwaltung angelegt werden.
- `productRepository` bietet nur `deactivateProduct`; die Reaktivierung in `ProductManagementSection` laeuft bewusst ueber das generische `updateProduct(id, { isActive: true })`.
- Ein Bestell-weites Notizfeld (zusaetzlich zur Kunden-Notiz) ist in `createOrderInputSchema` bereits vorbereitet, aber noch nicht im Formular abgebildet.

## Phase 3

Was fertig ist:

- Staedte werden automatisch aus den Kundendaten des aktuellen Benutzers abgeleitet, ohne eigene City-Collection.
- Die Staedte-Seite zeigt Stadtname, Anzahl Kunden, Anzahl offener Bestellungen, Suche, Laenderfilter sowie Loading-, Empty- und Error-States.
- Beim Oeffnen einer Stadt erscheint eine Kundenliste mit Name, Telefon, Adresse, offener Bestellung und Status.
- Die Kundenliste unterstuetzt Suche nach Name, Telefon und Strasse sowie die Filter `alle`, `offen`, `erledigt` und `ohne offene Bestellung`.
- Produktsummen offener Bestellungen werden in der Stadtansicht oberhalb der Liste ueber eine eigene Service-Logik zusammengefasst.
- Offene Bestellungen koennen ueber `Erledigt` auf `completed` gesetzt werden; `completedAt` wird gespeichert und Listen/Summen aktualisieren sich sofort.
- Kundendetails zeigen offene Bestellung und erledigte Bestellhistorie mit Datum, Produkten, Mengen und Status.
- Kunden werden durch abgeschlossene oder alte Bestellungen niemals automatisch geloescht.
- In der Kundenliste ist Mehrfachauswahl vorbereitet: einzelnes Auswaehlen, alle offenen auswaehlen, Auswahl zuruecksetzen.

Welche Dateien erstellt oder erweitert wurden:

- `src/features/cities/types/cityTypes.ts`
- `src/features/cities/types/cityCustomerTypes.ts`
- `src/features/cities/services/cityService.ts`
- `src/features/cities/services/cityCustomerService.ts`
- `src/features/cities/services/cityProductTotalsService.ts`
- `src/features/cities/services/citySelectionService.ts`
- `src/features/cities/hooks/useCities.ts`
- `src/features/cities/hooks/useCityCustomers.ts`
- `src/features/cities/hooks/useCityCustomerSelection.ts`
- `src/features/cities/components/CityCard.tsx`
- `src/features/cities/components/CityFilters.tsx`
- `src/features/cities/components/CitySummaryHeader.tsx`
- `src/features/cities/components/CityListScreen.tsx`
- `src/features/cities/components/CityCustomerListScreen.tsx`
- `src/features/cities/components/CityCustomerCard.tsx`
- `src/features/cities/components/CityCustomerActions.tsx`
- `src/features/cities/components/CityCustomerFilters.tsx`
- `src/features/cities/components/CityProductTotals.tsx`
- `src/features/cities/components/CitySelectionBar.tsx`
- `src/features/customers/types/customerDetailsTypes.ts`
- `src/features/customers/services/customerDetailsService.ts`
- `src/features/customers/hooks/useCustomerDetails.ts`
- `src/features/customers/components/CustomerDetailsScreen.tsx`
- `src/features/customers/components/CustomerDetailsHeader.tsx`
- `src/features/customers/components/CustomerOrderCard.tsx`
- `src/features/customers/components/CustomerOrderSection.tsx`
- `src/repositories/orderRepository.ts`
- `src/repositories/orderDetailsRepository.ts`
- `app/customer/[id].tsx`
- `tests/unit/cityService.test.ts`
- `tests/unit/cityCustomerService.test.ts`
- `tests/unit/cityProductTotalsService.test.ts`
- `tests/unit/citySelectionService.test.ts`
- `tests/unit/customerDetailsService.test.ts`

Tests:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

Bekannte Probleme:

- Fuer groessere produktive Datenmengen koennen zusaetzliche Firestore-Composite-Indexes noetig werden.
- Die Mehrfachauswahl ist bewusst nur als Auswahlzustand vorbereitet; es gibt noch keine Weiterverarbeitung oder Teilen-Funktion.

Offene Punkte:

- Karten-, Kreis-, Polygon- und WhatsApp-Funktionen sind weiterhin absichtlich nicht umgesetzt.

## Phase 4 - Karte und Navigation

Was fertig ist:

- Die benoetigten Expo-kompatiblen Pakete fuer Karte und Standort waren bereits installiert: `react-native-maps`, `expo-location`, `expo-linking`.
- Der Tab `Karte` rendert jetzt einen echten `react-native-maps`-Screen statt des Platzhalters.
- Beim ersten Oeffnen fragt die App per `expo-location` nach Standortfreigabe, laedt bei Zustimmung den aktuellen Standort und positioniert die Karte sinnvoll.
- Wenn die Standortfreigabe abgelehnt wird oder das Laden fehlschlaegt, bleibt die Karte nutzbar, zeigt eine verstaendliche Meldung und faellt auf eine neutrale Startregion zurueck.
- Auf iOS wird weiterhin der Standard-Provider von `react-native-maps` genutzt, also Apple Maps.
- Ein eigener Hook `useUserLocation` kapselt Standortfreigabe, Initial-Load, Fehlertext und manuellen Retry.
- Loading-State und Error-State fuer den Kartenstart sind vorhanden.
- Kundenpins werden owner-sicher nur fuer den aktuellen Benutzer geladen.
- Standardmaessig erscheinen nur Kunden mit mindestens einer offenen Bestellung und gueltigen Koordinaten auf der Karte.
- Marker werden fortlaufend nummeriert (`1`, `2`, `3`, ...) und die Karte richtet sich bei vorhandenen Pins automatisch an den Kundenkoordinaten aus.
- Kunden ohne Koordinaten werden bewusst uebersprungen und bringen den Screen nicht zum Absturz.
- Beim Antippen eines Pins oeffnet sich ein eigenes Bottom-Sheet mit Name, Telefonnummer, kompletter Adresse, Notiz sowie der offenen Bestellung inklusive Produkte und Mengen.
- Das Bottom-Sheet bietet direkte Aktionen fuer `Bearbeiten`, `Anrufen`, `Navigation` und `Standort teilen`.
- `Anrufen` prueft vor dem Oeffnen per `Linking`, ob eine gueltige Telefonnummer vorhanden ist und ob das Geraet die `tel:`-URL oeffnen kann; Fehler werden verstaendlich angezeigt.
- `Navigation` oeffnet zuerst ein kleines Auswahlmenue fuer `Apple Maps`, `Google Maps` und `Waze`. Apple Maps ist immer die sichere Standardoption, Google Maps und Waze werden nur aktiv angeboten, wenn ihre URL auf dem Geraet verfuegbar ist.
- `Standort teilen` erzeugt einen klaren Text mit Kundenname, Adresse, Koordinaten und Apple-Maps-Link und oeffnet danach das normale iOS Share Sheet.
- Der Kunde kann direkt aus der Karte ueber einen eigenen Edit-Screen bearbeitet werden, ohne erst zur Kundenliste zurueck zu muessen.
- Im Edit-Screen koennen Name, Telefonnummer, Strasse, Hausnummer, PLZ, Stadt, Land, Region, Notiz sowie Produkte und Mengen der offenen Bestellung angepasst werden.
- Beim Speichern werden Kundendaten, offene Bestellung und Order-Items aktualisiert; danach geht es direkt zur Karte zurueck.
- Beim Wiederfokussieren des Karten-Tabs werden Marker und Detaildaten neu geladen, sodass Aenderungen sofort sichtbar sind und auch spaeter von der Staedteansicht korrekt aus denselben Firestore-Daten gelesen werden.
- Oberhalb der Karte gibt es jetzt einfache Filter fuer `Alle`, `Land`, `Stadt` und `Region`; angezeigt werden nur Werte, die in den bereits geladenen Kundendaten tatsaechlich vorkommen.
- Die Kartenlogik wurde fuer bessere Laufleistung aufgeteilt: Marker bleiben klein und memoisiert, Kundendaten werden einmal geladen, Filterung passiert lokal ohne neue Firestore-Struktur, und waehrend des Renderns laufen keine Geocoding- oder Marker-spezifischen Firebase-Abfragen.

Welche Dateien erstellt oder erweitert wurden:

- `src/features/map/types/mapTypes.ts`
- `src/features/map/hooks/useUserLocation.ts`
- `src/features/map/hooks/useMapCustomers.ts`
- `src/features/map/hooks/useMapFilters.ts`
- `src/features/map/hooks/useMapActions.ts`
- `src/features/map/hooks/useMapCustomerDetails.ts`
- `src/features/map/services/mapCustomerService.ts`
- `src/features/map/services/mapFilterService.ts`
- `src/features/map/components/CustomerMarker.tsx`
- `src/features/map/components/CustomerMapCard.tsx`
- `src/features/map/components/MapFilters.tsx`
- `src/features/map/components/MapToolbar.tsx`
- `src/features/map/components/NavigationAppSheet.tsx`
- `src/features/map/components/MapCustomerSheet.tsx`
- `src/features/map/components/MapScreen.tsx`
- `src/features/customers/validation/customerEditSchema.ts`
- `src/features/customers/services/customerEditService.ts`
- `src/features/customers/hooks/useCustomerEdit.ts`
- `src/features/customers/components/CustomerEditScreen.tsx`
- `src/features/customers/components/CustomerEditForm.tsx`
- `src/features/customers/components/CustomerEditAddressSection.tsx`
- `src/features/customers/components/CustomerEditProductRow.tsx`
- `src/features/customers/components/CustomerEditOrderItemsSection.tsx`
- `src/repositories/orderRepository.ts`
- `src/services/navigationService.ts`
- `src/services/navigationService.shared.ts`
- `src/services/phoneService.ts`
- `src/services/phoneService.shared.ts`
- `src/services/sharingService.ts`
- `src/services/sharingService.shared.ts`
- `app/customer/edit/[id].tsx`
- `tests/unit/mapCustomerService.test.ts`
- `tests/unit/mapFilterService.test.ts`
- `tests/unit/navigationService.test.ts`
- `tests/unit/phoneService.test.ts`
- `tests/unit/sharingService.test.ts`
- `tests/unit/customerEditService.test.ts`

Tests:

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

Offene Punkte:

- Es gibt bewusst noch keine Kreis-/Polygon-Auswahl.
- Ein echter Geraetetest auf dem iPhone oder iOS-Simulator steht noch aus, um Berechtigungsdialog, Pin-Interaktion, `tel:`-Oeffnung und externe Karten-Apps visuell zu bestaetigen.

## Phase 5 - Karten-Auswahl, Kreis, Polygon und Teilen

Was fertig ist:

- Keine neue Geometrie-Library installiert; Kreis- und Polygon-Pruefung sind kleine eigene Funktionen (Haversine-Distanz, Ray-Casting).
- Auswahlmodus auf der Karte ueber eine eigene `MapSelectionToolbar` mit den Werkzeugen `Einzel`, `Kreis`, `Polygon` und `Auswahl loeschen`; ein Werkzeug bleibt an, bis es erneut angetippt oder die Auswahl geloescht wird. Ohne aktives Werkzeug verhaelt sich ein Pin-Tap wie bisher (Detail-Sheet oeffnen) - Phase-4-Verhalten bleibt unveraendert.
- `Einzel`: Antippen eines Pins schaltet dessen Auswahl an/aus. Ausgewaehlte Pins werden farblich und groesser hervorgehoben (`CustomerMarker` bekam ein `selected`-Flag).
- `Kreis`: erster Kartentipp setzt den Mittelpunkt, zweiter Tipp bestimmt den Radius (Distanz zum ersten Tipp); alle sichtbaren Kunden innerhalb werden automatisch zur Auswahl hinzugefuegt. Der Kreis wird als `Circle`-Overlay aus `react-native-maps` angezeigt.
- `Polygon`: jeder Kartentipp fuegt einen Eckpunkt hinzu (Vorschau als Linie/Punkte), `Flaeche schliessen` (ab 3 Punkten) waehlt alle sichtbaren Kunden innerhalb der Flaeche aus, `Rueckgaengig` entfernt den letzten Punkt.
- Kreis- und Polygon-Auswahl arbeiten ausschliesslich auf den aktuell gefilterten (sichtbaren) Markern; bereits ausgewaehlte Kunden bleiben aber auch dann in der Auswahl, wenn ein Filter sie danach ausblendet. Bestehende Karten-Filter (Land/Stadt/Region) funktionieren unveraendert weiter.
- Unten erscheint bei aktiver Auswahl eine feste `SelectedCustomersBar` mit `X Kunden ausgewaehlt` sowie `Auswahl ansehen`, `Teilen` und `Auswahl loeschen`.
- `Auswahl ansehen` oeffnet `SelectedCustomersList`: Nummer, Name, Adresse, Telefonnummer und Status der offenen Bestellung je Kunde, mit `Entfernen`-Button pro Zeile; leere Auswahl zeigt einen sauberen Empty-State statt abzustuerzen.
- Produktsummen nur fuer die aktuelle Auswahl werden oben in der Liste angezeigt (`SelectionProductTotals`), berechnet ueber die bereits vorhandene, jetzt geteilte Summenlogik.
- Sammeltext fuer WhatsApp/Teilen gruppiert nach Stadt, nummeriert Kunden fortlaufend, listet Produkte pro Kunde und haengt eine Gesamtsumme an (`mapShareFormatterService`); `Teilen` nutzt weiterhin den vorhandenen `sharingService` (natives iOS Share Sheet, keine WhatsApp Business API). Schlaegt das Teilen fehl, erscheint eine verstaendliche Fehlermeldung in der Leiste.
- Produktsummen und Sammeltext teilen sich dieselbe einmalige Firestore-Abfrage (`getOpenOrdersWithItemsByCustomerIds`), die nur beim Oeffnen von `Auswahl ansehen` oder beim Teilen laeuft - keine Query pro Marker, keine Geometrieberechnung beim Rendern, Auswahlberechnung nur beim Abschluss von Kreis/Polygon.
- Die vorher city-spezifische Produktsummen-Logik (`buildCityProductTotals`) wurde in ein geteiltes Utility (`buildProductTotals`, Typ `ProductTotal`) verschoben; `cityProductTotalsService` delegiert jetzt nur noch dorthin, damit keine doppelte Summenlogik zwischen Staedte- und Kartenansicht existiert. Das bestehende Verhalten und die bestehenden Tests der Staedte-Ansicht bleiben unveraendert.
- Bewusste Namensabweichung von der urspruenglichen Struktur-Skizze: Die bestehende `MapToolbar.tsx` (Status-/Fehleranzeige aus Phase 4) wurde nicht umgebaut, sondern die neuen Werkzeug-Buttons leben in einer eigenen `MapSelectionToolbar.tsx`, um die bestehende Statusanzeige nicht zu vermischen.

Welche Dateien erstellt oder erweitert wurden:

- `src/types/productTotal.ts`
- `src/utils/orderItemTotals.ts`
- `src/features/map/types/mapSelectionTypes.ts`
- `src/features/map/utils/circleMath.ts`
- `src/features/map/utils/polygonMath.ts`
- `src/features/map/services/mapSelectionService.ts`
- `src/features/map/services/mapShareFormatterService.ts`
- `src/features/map/hooks/useMapSelection.ts`
- `src/features/map/hooks/useSelectionSummary.ts`
- `src/features/map/hooks/useMapCustomerSelection.ts`
- `src/features/map/components/MapSelectionToolbar.tsx`
- `src/features/map/components/CircleSelectionOverlay.tsx`
- `src/features/map/components/PolygonSelectionOverlay.tsx`
- `src/features/map/components/SelectedCustomersBar.tsx`
- `src/features/map/components/SelectedCustomersList.tsx`
- `src/features/map/components/SelectedCustomerRow.tsx`
- `src/features/map/components/SelectionProductTotals.tsx`
- `src/features/map/types/mapTypes.ts` (`phone` bei `MapCustomerMarker` ergaenzt)
- `src/features/map/services/mapCustomerService.ts` (`phone` in den Markern befuellt)
- `src/features/map/components/CustomerMarker.tsx` (`selected`-Darstellung ergaenzt)
- `src/features/map/components/MapScreen.tsx` (Auswahlmodus, Overlays, Leiste und Liste eingebunden)
- `src/features/cities/types/cityProductTotalTypes.ts` (Alias auf geteilten `ProductTotal`-Typ)
- `src/features/cities/services/cityProductTotalsService.ts` (delegiert an `buildProductTotals`)
- `tests/unit/circleMath.test.ts`
- `tests/unit/polygonMath.test.ts`
- `tests/unit/mapSelectionService.test.ts`
- `tests/unit/orderItemTotals.test.ts`
- `tests/unit/mapShareFormatterService.test.ts`
- `tests/unit/mapCustomerService.test.ts` (`phone`-Feld ergaenzt)

Tests:

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test` (61 Tests, inkl. Kreis-/Polygon-Geometrie, Einzel-/Kreis-/Polygon-Auswahl, Produktsummen, Sammeltext-Formatierung inkl. leerer Auswahl)

Bekannte Probleme:

- Ein echter Geraetetest auf dem iPhone/iOS-Simulator fuer Kartentipps (Kreis/Polygon zeichnen), Marker-Hervorhebung und das native Share Sheet steht noch aus.
- Bei sehr grossen Auswahlmengen laedt `Auswahl ansehen`/`Teilen` die offenen Bestellungen aller ausgewaehlten Kunden in einer Abfrage; das ist fuer die Groessenordnung dieser App unkritisch, sollte bei stark wachsender Kundenzahl aber im Auge behalten werden.

Nicht umgesetzt (bewusst, laut Auftrag):

- Automatische Routenoptimierung, eigene Navigationsroute, Live-Tracking, Fahrer-Tracking, Push-Benachrichtigungen, komplexe Kartencluster, Offline-Kartendownload.

## Phase 6 - Admin, Verwaltung und Einstellungen

Was fertig ist:

- Das kleine Admin-Dashboard ist weiterhin strikt nur fuer Admins erreichbar; normale Benutzer werden durch das Auth-Gate aus dem `/admin`-Bereich herausgehalten.
- Das Dashboard bleibt bewusst klein und zeigt nur `aktive Benutzer`, `eigene Kunden`, `eigene offene Bestellungen` und `eigene Gesamtbestellungen`.
- Die beiden Aktionen `Benutzer anlegen` und `Benutzer endgueltig loeschen` sind direkt im kleinen Dashboard vorhanden, ohne grosses Admin-Panel oder Benutzerliste.
- Der Create-User-Flow verwendet weiterhin sicher eine Firebase Cloud Function statt irgendeines Admin-SDK-Zugriffs im Expo-Client.
- Das Formular zum Benutzer-Anlegen enthaelt jetzt `vollstaendiger Name`, `E-Mail`, `Passwort` und `Passwort wiederholen`.
- Die Validierung deckt jetzt die geforderten Regeln ab: gueltige E-Mail, Name erforderlich, Passwort mindestens 8 Zeichen und identische Passwoerter.
- Beim Absenden ruft die App weiter die Cloud Function `createUser` auf; dort werden Admin-Rolle, Firebase-Auth-Benutzer und Firestore-Profil mit `role = user` und `isActive = true` verarbeitet.
- Das endgueltige Benutzerloeschen laeuft jetzt per E-Mail mit Sicherheitsdialog im Admin-Bereich.
- Die Delete-Cloud-Function verhindert weiterhin das Loeschen des eigenen Admin-Kontos und entfernt jetzt auch die `orders/{orderId}/items`-Subcollections vor dem Loeschen der Orders selbst.
- Produkte unter `Verwaltung` unterstuetzen jetzt Hinzufuegen, Bearbeiten, Aktiv/Inaktiv, sicheres Loeschen nur wenn noch nicht verwendet, sowie Sortierreihenfolge.
- Jeder Benutzer verwaltet weiterhin ausschliesslich die eigenen Produkte ueber owner-gebundene Repository-Zugriffe.
- Laender unter `Verwaltung` sind jetzt als eigener Bereich vorhanden mit Hinzufuegen, Bearbeiten, Aktiv/Inaktiv, optionalem ISO-Code und Sortierung.
- Fuer Laender gibt es bewusst kein blindes endgueltiges Loeschen; die bevorzugte sichere Aktion ist Deaktivieren.
- Regionen unter `Verwaltung` sind jetzt als eigener Bereich vorhanden mit Hinzufuegen, Bearbeiten, Aktiv/Inaktiv sowie den Feldern `Name`, `Land` und optionale `Stadt`.
- Der Einstellungen-Screen ist jetzt als einfacher, echter Screen vorhanden und deckt Profil, E-Mail-Anzeige, Passwort-Reset, Theme, bevorzugte Navigations-App, Share-Optionen, App-Infos und Logout ab.
- App-Infos zeigen klein und ohne Charts `App-Version`, `eigene Kunden`, `eigene Gesamtbestellungen` und `offene Bestellungen`.
- User-Praeferenzen werden ueber `userPreferences` gespeichert und beim App-Start in den lokalen App-Store hydratisiert.
- Share- und Navigationsoptionen aus den Einstellungen wirken jetzt auf Karten-Navigation und Share-Texte.
- Admin-Funktionen nutzen jetzt die gewuenschte geteilte Guard-Struktur mit `authGuard.ts` und `adminGuard.ts`.
- Firestore Rules wurden expliziter auf `users`, `customers`, `orders`, `products`, `countries`, `regions` und `userPreferences` zugeschnitten, ohne Admin automatisch Zugriff auf private Kundendaten anderer Benutzer zu geben.
- Fehlerbehandlung wurde fuer typische Admin-/Verwaltungsfaelle verbessert: doppelte E-Mail, Benutzer nicht gefunden, Self-Delete, Server nicht erreichbar, kein Internet, doppelte Produkte, doppelte Laender, doppelte Regionen und ungueltige Formulare.

Welche Dateien erstellt oder erweitert wurden:

- `src/features/admin/types/adminFormTypes.ts`
- `src/features/admin/validation/createUserSchema.ts`
- `src/features/admin/hooks/useCreateUser.ts`
- `src/features/admin/components/CreateUserForm.tsx`
- `src/features/admin/validation/deleteUserSchema.ts`
- `src/features/admin/hooks/useDeleteUser.ts`
- `src/features/admin/components/DeleteUserForm.tsx`
- `src/features/admin/components/DeleteUserScreenBody.tsx`
- `src/features/admin/services/adminService.ts`
- `src/types/admin.ts`
- `functions/src/admin/deleteUser.ts`
- `functions/src/admin/deleteUserData.ts`
- `functions/src/shared/authGuard.ts`
- `functions/src/shared/adminGuard.ts`
- `functions/src/shared/firestoreHelpers.ts`
- `src/features/products/validation/productSchema.ts`
- `src/features/products/components/ProductForm.tsx`
- `src/features/products/components/ProductListItem.tsx`
- `src/features/products/components/ProductManagementSection.tsx`
- `src/features/products/hooks/useProducts.ts`
- `src/repositories/productRepository.ts`
- `src/types/country.ts`
- `src/features/countries/validation/countrySchema.ts`
- `src/repositories/countryRepositoryData.ts`
- `src/repositories/countryRepository.ts`
- `src/features/countries/hooks/useCountries.ts`
- `src/features/countries/components/CountryForm.tsx`
- `src/features/countries/components/CountryListItem.tsx`
- `src/features/countries/components/CountryManagementSection.tsx`
- `src/types/region.ts`
- `src/features/regions/validation/regionSchema.ts`
- `src/repositories/regionRepositoryData.ts`
- `src/repositories/regionRepository.ts`
- `src/features/regions/hooks/useRegions.ts`
- `src/features/regions/components/RegionForm.tsx`
- `src/features/regions/components/RegionListItem.tsx`
- `src/features/regions/components/RegionManagementSection.tsx`
- `src/types/userPreferences.ts`
- `src/repositories/userPreferencesRepository.ts`
- `src/features/settings/hooks/useUserPreferences.ts`
- `src/features/settings/hooks/useSettings.ts`
- `src/features/settings/components/SettingsScreen.tsx`
- `src/features/settings/components/SettingsSection.tsx`
- `src/features/settings/components/SettingsChoiceRow.tsx`
- `src/features/settings/components/SettingsToggleRow.tsx`
- `src/features/settings/components/SettingsBootstrap.tsx`
- `src/store/appStore.ts`
- `src/store/authStore.ts`
- `src/repositories/userRepository.ts`
- `src/errors/errorMessages.ts`
- `src/utils/formatError.ts`
- `src/repositories/userPreferencesRepository.ts`
- `src/features/management/components/ManagementScreen.tsx`
- `firebase/firestore.rules`
- `functions/tsconfig.json`
- `functions/src/firebase-types.d.ts`
- `tests/unit/createUserSchema.test.ts`
- `tests/unit/deleteUserSchema.test.ts`
- `tests/unit/productSchema.test.ts`
- `tests/unit/countrySchema.test.ts`
- `tests/unit/regionSchema.test.ts`

Tests:

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npx tsc --noEmit -p functions/tsconfig.json`

Bekannte Probleme:

- Die Functions-TypeScript-Pruefung laeuft aktuell ueber eine kleine lokale Stub-Typdatei, weil im Workspace noch kein echtes separates Functions-Package mit `firebase-admin` und `firebase-functions` installiert ist.
- Ein echter End-to-End-Test gegen deployte Cloud Functions fehlt weiterhin, da die reale Firebase-Umgebung und Secrets laut Phase 1 noch separat bereitgestellt werden muessen.

Offene Punkte:

- Die Einstellungen bieten aktuell bewusst Passwort-Reset per E-Mail an, aber noch keinen direkten Passwort-Aendern-Flow mit altem/neuem Passwort.
- Fuer Laender und Regionen gibt es bewusst Deaktivieren statt hartem Loeschen; eine spaetere sichere Verwendungspruefung gegen bestehende Kundenbeziehungen kann noch ausgebaut werden.

## Phase 7 - Abschluss, Stabilitaet, Sicherheit und iOS Release

Was fertig ist:

- Die vorhandenen End-to-End-Flows fuer Admin, normale Benutzer, Karte, Verwaltung und Einstellungen wurden noch einmal gegen den aktuellen Code-Stand geprueft.
- Alle bestehenden technischen Checks laufen weiterhin gruen: Expo Doctor, App-TypeScript, Lint, Tests und Functions-TypeScript.
- Ein konkretes Stabilitaets-/Persistenzproblem in den Benutzereinstellungen wurde behoben: App-Praeferenzen werden jetzt beim Logout, beim Benutzerwechsel und bei fehlenden gespeicherten Preferences sauber auf sichere Defaults zurueckgesetzt.
- Dadurch bleiben beim App-Neustart oder nach erneutem Anmelden keine Theme-, Sharing- oder Navigationsoptionen eines vorherigen Benutzers versehentlich im In-Memory-Store haengen.
- Die Session-Persistenz selbst bleibt weiterhin ueber Firebase Auth mit React-Native-Persistence aktiv.
- Fehlertexte fuer Auth-, Firestore- und Cloud-Function-Netzwerkfehler wurden erweitert, damit Offline-/Backend-Fehler keine rohen technischen Codes in der UI zeigen.
- Karten- und Share-Aktionen nutzen jetzt ebenfalls die zentrale Fehlerformatierung, sodass Anruf-, Navigation-, Share- und Kartenladefehler verstaendlich bleiben und keine normale Fehlersituation den Screen zerlegt.
- Der Sammeltext fuer Karten-Teilen wurde bereinigt: keine kaputten Sonderzeichen, keine leeren `undefined`-/`null`-Werte im Text, Nummerierung und Produktsummen bleiben stabil.
- Karten-/Auswahl-/Share-Logik wurde mit zusaetzlichen Tests auf leere Werte, fehlende Adressen/Telefonnummern und groessere Datenmengen abgesichert.
- Eine simulierte Grossdaten-Pruefung mit 500 Kunden/Markern wurde auf den zentralen Service-Pfaden fuer Karte, Filter, Staedte und Auswahl ergaenzt, um Crashs bei groesseren Listen auszuschliessen.
- Die Release-Konfiguration wurde fuer iOS geschliffen: finaler App-Name `Rsho Orders`, iOS-Build-Nummer `1`, finaler Bundle Identifier `com.rsho.cheeseorders` und klare Standortberechtigungstexte in `app.json`.
- Das Repo behandelt Environment-Dateien jetzt sauber weiter: `.env` bleibt ignoriert, `.env.example` dokumentiert nur die erlaubten Expo-Clientwerte, und es wurden keine Firebase-Admin-Credentials oder Service-Account-Dateien im Expo-Projekt gefunden.
- `eas.json` ist auf die drei einfachen Profile `development`, `preview` und `production` vorbereitet; `production` ist explizit auf Store-Distribution gesetzt.
- Die lokale EAS-CLI ist ueber `npx eas-cli` verfuegbar und `eas-cli/21.7.0` laeuft grundsaetzlich in diesem Workspace.
- Ein echter EAS-Build, echter iPhone-Test und TestFlight-Upload konnten noch nicht ausgefuehrt werden, weil die CLI aktuell nicht in einen Expo-Account eingeloggt ist (`npx eas-cli whoami` -> `Not logged in`).

Welche Dateien erstellt oder erweitert wurden:

- `src/store/appStore.ts`
- `src/features/settings/hooks/useUserPreferences.ts`
- `tests/unit/appStore.test.ts`
- `src/utils/formatError.ts`
- `src/errors/errorMessages.ts`
- `src/features/map/hooks/useMapCustomers.ts`
- `src/features/map/hooks/useUserLocation.ts`
- `src/features/map/hooks/useMapActions.ts`
- `src/features/map/hooks/useMapCustomerSelection.ts`
- `src/features/map/services/mapCustomerService.ts`
- `src/features/map/services/mapShareFormatterService.ts`
- `src/validation/commonSchemas.ts`
- `src/features/customers/validation/customerSchema.ts`
- `src/features/orders/validation/orderItemSchema.ts`
- `tests/unit/formatError.test.ts`
- `tests/unit/loginSchema.test.ts`
- `tests/unit/customerSchema.test.ts`
- `tests/unit/addOrderFormSchema.test.ts`
- `tests/unit/mapShareFormatterService.test.ts`
- `tests/unit/mapLargeData.test.ts`
- `app.json`
- `eas.json`
- `.env.example`

Tests:

- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit -p functions/tsconfig.json`
- `npx eas-cli --version`
- `npx eas-cli whoami`

Bekannte Probleme:

- Ein echter kompletter Geraete-Durchlauf auf iPhone bzw. iOS-Simulator inklusive App-Schliessen, Neuoeffnen, Login, Karteninteraktion, nativer Telefon-/Share-/Maps-Apps und spaeterem TestFlight-Upload konnte in dieser lokalen CLI-Umgebung nicht visuell ausgefuehrt werden.
- Die Cloud-Functions-Pruefung bleibt lokal eine TypeScript-Pruefung; ein echter Lauf gegen deployte Functions und reale Firebase-Daten ist weiterhin separat noetig.
- Die simulierte Grossdaten-Pruefung deckt die zentralen reinen Datenpfade ab, ersetzt aber kein echtes Performance-Profiling auf einem iPhone mit realen Firestore-Antwortzeiten.
- Der Preview-/Development-Build ueber EAS wurde noch nicht gestartet, weil aktuell kein Expo-Login in dieser Umgebung vorhanden ist.
- Der Test auf einem echten iPhone und der spaetere TestFlight-Smoke-Test konnten deshalb ebenfalls noch nicht stattfinden.

Offene Punkte:

- Vor dem echten iOS-Release sollte der komplette Ablauf noch einmal manuell auf einem iPhone oder iOS-Simulator durchgetestet werden, speziell Datenpersistenz ueber App-Neustart, Admin-Loeschflow, Kartenaktionen und Logout/Login mit mehreren Benutzern.

## Phase 8 - Sicherheitstests: zwei Benutzer, Admin-Sicherheit, Firestore Rules

Was fertig ist:

- Neue Test-Infrastruktur mit der Firebase Local Emulator Suite (nur Firestore) und `@firebase/rules-unit-testing`, damit Security Rules automatisiert und deterministisch geprueft werden koennen, statt nur manuell. `npm test` bleibt unveraendert schnell und infrastrukturfrei (`tests/unit`, `tests/repositories`); ein neues `npm run test:security` startet den Firestore-Emulator ueber `firebase emulators:exec`, laesst `tests/security/**/*.test.ts` dagegen laufen und faehrt den Emulator danach automatisch wieder herunter. Der Emulator laeuft mit einer `demo-`-Projekt-ID komplett offline, ohne echte Firebase-Credentials.
- **Aufgabe 3 (zwei Benutzer):** `tests/security/multiTenantIsolation.test.ts` bildet den Kern des Zwei-Benutzer-Tests auf Datenebene automatisiert nach: User A legt Kunde und Bestellung unter der eigenen `ownerId` an; ein zweiter, unabhaengig authentifizierter Kontext fuer User B kann weder einzelne Dokumente lesen noch eine nach `ownerId` gefilterte Liste von User A abfragen (die Query wird von der Regel komplett abgelehnt, nicht nur leer gefiltert); beim Zuruecklesen ueber einen erneuten User-A-Kontext ("zurueck einloggen") sind Kunde und Bestellung unveraendert vorhanden. Ein echter Geraete-Durchlauf mit zwei realen Logins/Logouts in der laufenden App bleibt trotzdem als manueller Test offen, da dieses Repo keine UI-Test-Harness fuer Expo Router/React Native besitzt.
- **Aufgabe 4 (Admin-Sicherheit), clientseitiger Teil:** Die Redirect-Logik aus `AuthGate.tsx` wurde in eine reine Funktion `resolveAuthRedirect()` (`src/components/layout/authGateRules.ts`) ausgelagert und mit `tests/unit/authGateRules.test.ts` abgedeckt: nicht angemeldete Benutzer landen auf Login, angemeldete Benutzer auf einer Auth-Seite werden weitergeleitet, ein normaler Benutzer wird aus jeder Route unter `/admin/*` (Dashboard, Benutzer anlegen, Benutzer loeschen liegen alle unter dem Segment `admin`) automatisch zurueck zu den Staedten geschickt, ein Admin darf bleiben. Verhalten der App bleibt unveraendert, nur testbar gemacht.
- **Aufgabe 4, Firestore-Rules-Teil:** mit abgedeckt durch die Aufgabe-5-Tests (siehe unten): fremder Benutzer kann `users/{uid}` weder lesen noch schreiben noch loeschen; nicht angemeldeter Zugriff ist blockiert.
- **Aufgabe 5 (Firestore Security Rules):** `tests/security/firestoreRules.test.ts` prueft systematisch alle Collections (`users`, `customers`, `orders`, `orders/{id}/items`, `products`, `countries`, `regions`, `userPreferences`) mit denselben Fallgruppen: fremde Daten lesen/aendern/loeschen verboten, `ownerId` beim Erstellen oder Aendern faelschen verboten, nicht angemeldeter Zugriff verboten. Zusaetzlich bestaetigt ein eigener Test je Collection, dass ein Benutzer mit `role = admin` im eigenen Profil dadurch **keinen** automatischen Lesezugriff auf fremde Kunden-/Bestell-/Produkt-/Laender-/Regionendaten bekommt (Admin-Sonderrechte laufen bewusst nur ueber Cloud Functions mit Admin SDK, nicht ueber gelockerte Client-Regeln).
- **Gefundene und behobene Sicherheitsluecke:** Die bisherige Regel fuer `users/{userId}` erlaubte `update`, wenn nur `request.auth.uid == userId` stimmte, ohne einzuschraenken, welche Felder geaendert werden. Ein normaler Benutzer konnte damit ueber die Firestore-Client-SDK sein eigenes Profil auf `role: "admin"` setzen (Privilege Escalation) oder ein deaktiviertes eigenes Konto (`isActive: false`) selbst wieder aktivieren. Beides wurde zuerst mit einem gezielten Test bewiesen (Test schlug gegen die alte Regel real fehl), danach in `firebase/firestore.rules` gefixt: `update` verlangt jetzt zusaetzlich, dass `role` und `isActive` gegenueber dem bestehenden Dokument unveraendert bleiben. Der einzige bestehende Client-Schreibpfad (`userRepository.updateOwnProfile()`) aendert ohnehin nur `fullName`, der Fix ist also verhaltenskompatibel.

Welche Dateien erstellt oder erweitert wurden:

- `firebase.json` (Firestore-Emulator-Konfiguration ergaenzt)
- `.firebaserc` (neu, `demo-rsho-test`-Projekt fuer den Emulator)
- `firebase/firestore.rules` (Privilege-Escalation-Luecke bei `users`-Update geschlossen)
- `package.json` (`@firebase/rules-unit-testing`, `firebase-tools` als devDependencies; `test`-Script auf `tests/unit`+`tests/repositories` eingegrenzt; neues `test:security`-Script)
- `tests/security/testEnv.ts`
- `tests/security/firestoreRules.test.ts`
- `tests/security/multiTenantIsolation.test.ts`
- `src/components/layout/authGateRules.ts`
- `src/components/layout/AuthGate.tsx` (nutzt jetzt die ausgelagerte, testbare Regel-Funktion)
- `tests/unit/authGateRules.test.ts`

Nachtrag (gleiche Phase, nach Rueckfrage beim Nutzer): die drei zuvor offen gelassenen Cloud-Function-Luecken wurden auf ausdruecklichen Wunsch doch behoben, inklusive echtem Functions-Emulator-Test:

- **Custom-Claims-Luecke gefixt:** `requireAdmin()` (`functions/src/shared/adminGuard.ts`) liest die Rolle jetzt per Admin SDK aus `users/{uid}.role` in Firestore statt aus einem nie gesetzten Auth-Token-Custom-Claim. Dadurch funktionieren `createUser`, `deleteUser` und `deleteUserData` jetzt tatsaechlich fuer echte Admins.
- **Doppeltes `initializeApp()` gefixt:** ein neues `functions/src/shared/firebaseAdmin.ts` initialisiert die Admin-App genau einmal (Guard via `getApps().length`); `createUser.ts`, `deleteUser.ts` und `deleteUserData.ts` importieren es nur noch fuer den Seiteneffekt, statt selbst `initializeApp()` aufzurufen (vorher haette das Laden aller drei Functions ueber `index.ts` einen "default app already exists"-Fehler ausgeloest).
- **Functions lauffaehig gemacht:** neues `functions/package.json` mit echten `firebase-admin`/`firebase-functions`-Abhaengigkeiten (der alte Stub `functions/src/firebase-types.d.ts` wurde entfernt) und einem `esbuild`-Build (`npm --prefix functions run build`), das die `@/shared/*`-Pfad-Aliases zu `functions/lib/index.js` buendelt.
- **Echter Functions-Emulator-Test:** `firebase.json` emuliert jetzt zusaetzlich `auth` und `functions`; ein neues `npm run test:functions` baut die Functions, startet Firestore-, Auth- und Functions-Emulator zusammen und laesst `tests/integration/adminFunctions.test.ts` (7 Tests) mit echten signierten Client-Sessions dagegen laufen: normaler Benutzer wird von `createUser`/`deleteUser`/`deleteUserData` abgewiesen (`permission-denied`), Admin kann sich nicht selbst loeschen (`failed-precondition`), Admin kann `createUser` erfolgreich aufrufen, Admin-`deleteUser` entfernt Auth-Konto, Profil und alle sieben abhaengigen Collections (Kunden, Bestellungen, OrderItems, Produkte, Laender, Regionen, Preferences), und `deleteUserData` raeumt nur die Datencollections auf, laesst Auth-Konto und Profil aber bewusst unangetastet.
- Admin-Dashboard-Zaehlung „aktive Benutzer" bleibt bewusst als bekannter, dokumentierter Punkt offen (siehe Test-Kommentar in `firestoreRules.test.ts`) - das ist eine reine Admin-Dashboard-Frage (Cloud Function statt Client-Query), keine Sicherheitsluecke, und wurde vom Nutzer nicht explizit zur Behebung freigegeben.

Weitere Dateien dafuer:

- `functions/package.json`
- `functions/src/shared/firebaseAdmin.ts`
- `functions/src/shared/adminGuard.ts` (Firestore-Rollen-Lookup, jetzt async)
- `functions/src/admin/createUser.ts`, `functions/src/admin/deleteUser.ts`, `functions/src/admin/deleteUserData.ts` (nutzen die geteilte Admin-Init, `await requireAdmin(request)`)
- `firebase.json` (Auth- + Functions-Emulator ergaenzt)
- `package.json` (`firebase-admin` als root-Dev-Dependency fuer Testaufbau, neues `test:functions`-Script)
- `tests/integration/functionsTestEnv.ts`
- `tests/integration/adminFunctions.test.ts`

Tests:

- `npx tsc --noEmit` (App und `-p functions/tsconfig.json`)
- `npm run lint`
- `npm test` (82 Tests)
- `npm run test:security` (62 Tests gegen den Firestore-Emulator)
- `npm run test:functions` (7 Tests gegen Firestore-, Auth- und Functions-Emulator zusammen)
- `npx expo-doctor`

Offene Punkte:

- Ein echter Zwei-Benutzer-Durchlauf auf einem iPhone/Simulator (Login, Daten anlegen, Logout, zweiter Login, zurueck zum ersten Benutzer) bleibt als manueller Test offen; die Emulator-Tests decken die Datenisolation bereits automatisiert ab, aber keinen echten UI-Login-Wechsel.
- Admin-Dashboard „aktive Benutzer"-Zaehlung ist weiterhin blockiert (siehe oben) und noch nicht behoben.
- Naechster notwendiger Schritt fuer TestFlight ist ein erfolgreicher Expo-/EAS-Login, danach ein `preview`-Build fuer iOS, anschliessend der Test auf einem echten iPhone und erst danach ein `production`-Build fuer TestFlight.

## Phase 9 - Code-Audit: Packages, Checks, Firestore Indexes

Was fertig ist:

- **Aufgabe 14 (Packages):** alle Eintraege in `package.json` durchgesehen. Keine echten Duplikate oder veralteten/experimentellen Libraries gefunden. Ein paar Pakete ohne direkten `import` in `src`/`app` (`@react-navigation/bottom-tabs`, `expo-constants`, `expo-font`, `react-native-safe-area-context`, `react-native-screens`) wurden bewusst **nicht** entfernt: es sind native Pflicht-Abhaengigkeiten von Expo Router/React Navigation (Tabs, Icon-Fonts, Safe-Area), deren Entfernen ohne echten Geraete-/Native-Build-Test die Navigation zerstoeren koennte. Keine neuen Packages fuer die App selbst hinzugefuegt; die einzigen neuen Abhaengigkeiten dieser und der vorherigen Phase (`@firebase/rules-unit-testing`, `firebase-tools`, `firebase-admin` als Dev-Dependencies, `firebase-admin`/`firebase-functions`/`esbuild` in `functions/`) dienen ausschliesslich dem jetzt bestehenden Test-Setup, nicht der App zur Laufzeit.
- **Aufgabe 15 (Expo-Pruefung):** `npx expo-doctor` laeuft weiterhin mit 20/20 bestandenen Checks.
- **Aufgabe 16 (TypeScript):** zwei echte `tsc`-Fehler gefunden und sauber behoben, keiner davon mit `any` oder `@ts-ignore` versteckt:
  - Der Aufgabe-8-Refactor (`resolveAuthRedirect`) hatte den Rueckgabetyp auf generisches `string` verbreitert und damit Expo Routers getypte Routen verletzt; jetzt exakt auf `typeof routes.login | typeof routes.cities | null` typisiert.
  - `CityCard.tsx` baute die Stadtroute bisher ueber einen fragilen `routes.admin.replace("/admin", "/city")`-String-Hack, der nicht mehr durch die getypten Routen abgedeckt war; direkt auf `` `/city/${city.normalizedName}` `` vereinfacht (gleiches Muster wie an anderer Stelle bereits fuer `/customer/edit/${id}` verwendet).
  - `npx tsc --noEmit` (App) und `npx tsc --noEmit -p functions/tsconfig.json` sind beide fehlerfrei; eine Codebase-weite Suche nach `: any`, `as any`, `@ts-ignore` und `@ts-expect-error` in `src`, `app` und `functions/src` ergab keine Treffer.
- **Aufgabe 17 (Lint):** `npm run lint` liefert 0 Fehler. Die einzige verbleibende Meldung ist eine Warnung in der von Expo generierten, per `.gitignore` ausgeschlossenen Datei `.expo/types/router.d.ts` und wird bei jedem `expo start`/`tsc`-Lauf neu erzeugt - keine echte Codequalitaetsfrage.
- **Aufgabe 18 (Tests):** komplette Suite laeuft gruen (82 + 62 + 7 = 151 Tests). Alle geforderten Themenbereiche sind mit eigenen Tests abgedeckt: Auth (`loginSchema`, `authGateRules`), Roles (`authGateRules`, `firestoreRules`, `adminFunctions`), ownerId (`firestoreRules`, `customerRepositoryData`), Customer Validation (`customerSchema`), Order Validation (`orderValidation`, `addOrderFormSchema`), Order Totals (`orderItemTotals`, `cityProductTotalsService`), City Normalization (`normalizeCity`), Share Formatter (`sharingService`, `mapShareFormatterService`), Circle Selection (`circleMath`, `mapSelectionService`), Polygon Selection (`polygonMath`, `mapSelectionService`), Admin Guard (`adminFunctions`, `firestoreRules`, `authGateRules`), User Deletion (`adminFunctions`, Kaskaden-Test).
- **Aufgabe 19 (Firebase Functions separat):** TypeScript-Build laeuft ueber `esbuild` sauber durch (`functions/lib/index.js`, Pfad-Aliases korrekt aufgeloest, keine "default app already exists"-Fehler beim Laden). Admin Guard, `createUser`, `deleteUser` **und** `deleteUserData` sind jetzt mit echten Functions-Emulator-Tests abgedeckt (`tests/integration/adminFunctions.test.ts`, 7 Tests: normale Nutzer werden von allen drei Functions abgewiesen, Admin-Selbstloeschung verhindert, Admin-`createUser` erfolgreich, Admin-`deleteUser` mit vollstaendiger Kaskade, Admin-`deleteUserData` raeumt nur Daten auf ohne Auth/Profil anzutasten). Keine Service-Account-Credentials im Client (`src/firebase/config.ts` nutzt ausschliesslich `EXPO_PUBLIC_*`-Env-Variablen, kein Admin SDK im Expo-Bundle). Keine Secrets in Git: `.gitignore` deckt bereits `service-account*.json`, `google-services.json`, `GoogleService-Info.plist`, `.env*`, `functions/lib/` und `node_modules/` (greift auch fuer `functions/node_modules`) ab; eine Codebase-Suche nach API-Key-Mustern und `BEGIN PRIVATE KEY` fand nichts.
- **Aufgabe 20 (Firestore Indexes):** alle Repository-Queries systematisch durchgegangen (jede `where`/`orderBy`-Kombination in `src/repositories/*`). Sieben Composite-Indexe und ein Collection-Group-Field-Override waren noetig und wurden in `firebase/firestore.indexes.json` ergaenzt (vorher leer):
  - `customers`: `ownerId ASC, fullName ASC` und `ownerId ASC, normalizedCity ASC, fullName ASC`
  - `orders`: `ownerId ASC, status ASC, orderedAt DESC`, `ownerId ASC, orderedAt DESC` und `ownerId ASC, customerId ASC, orderedAt DESC`
  - `products`: `ownerId ASC, sortOrder ASC, name ASC`
  - `countries`: `ownerId ASC, sortOrder ASC, name ASC`
  - `regions`: `ownerId ASC, country ASC, name ASC`
  - Field-Override: `items.productId` mit `COLLECTION_GROUP`-Scope (fuer die produktuebergreifende Verwendungspruefung in `productRepository`, die per `collectionGroup("items")` laeuft)
  - Reine Mehrfach-Gleichheitsfilter ohne `orderBy` (z. B. Eindeutigkeitspruefungen fuer Namen) brauchen laut Firestore keinen Composite-Index und wurden bewusst nicht ergaenzt. Die lokale Emulator-Suite erzwingt fehlende Indexe nicht (das passiert nur in echtem Firestore), die Pruefung war daher ausschliesslich Code-Review der Query-Formen, nicht test-getrieben.

- Bei der abschliessenden Pruefung sind zwei weitere, echte `tsc`-Fehler aufgetaucht (nicht durch diese Phase verursacht, aber hier gefixt, da Aufgabe 16 null verbleibende Fehler verlangt): `functions/tsconfig.json` hatte noch `"ignoreDeprecations": "6.0"` stehen, was die inzwischen installierte TypeScript-Version nicht mehr akzeptiert (die Root-`tsconfig.json` war an dieser Stelle bereits bereinigt) - entfernt. Danach kam ein echter `esModuleInterop`-Fehler beim Typcheck von `firebase-functions`s eigenen Typdeklarationen zum Vorschein - `esModuleInterop` und `skipLibCheck` in `functions/tsconfig.json` ergaenzt (Standard fuer Node/Firebase-Functions-Projekte).
- Zwei bisher ungetrackte Verzeichnisse `__sdk54router/` und `__sdk54ref/` (eigene Mini-Projekte mit eigener `package.json`/`node_modules`, offenbar Referenzmaterial aus einer parallelen Session fuer eine Expo-SDK-Migration) liessen `npm run lint` mit 17 fremden Fehlern durchfallen, weil sie nicht Teil dieser App sind. Nicht geloescht (nicht meine Dateien, gehoeren erkennbar zu einer anderen laufenden Aufgabe), sondern sauber in `eslint.config.js` von der Lint-Pruefung ausgeschlossen, analog zu den bereits vorhandenen `functions/**`/`scaffold-temp/**`-Ausschluessen.
- `npx expo-doctor` zeigt jetzt 18/18 statt vorher 20/20 bestandene Checks - das ist keine Regression, sondern eine durch parallele Aenderungen (u. a. `ios`/`android`-Skripte auf `expo run:ios`/`expo run:android` umgestellt) veraenderte, weiterhin vollstaendig gruene Check-Anzahl.

Welche Dateien erstellt oder erweitert wurden:

- `src/components/layout/authGateRules.ts` (Rueckgabetyp praezisiert)
- `src/features/cities/components/CityCard.tsx` (Routen-Hack entfernt)
- `firebase/firestore.indexes.json`
- `functions/tsconfig.json` (`ignoreDeprecations` entfernt, `esModuleInterop`/`skipLibCheck` ergaenzt)
- `eslint.config.js` (`__sdk54router/**`, `__sdk54ref/**` von der Lint-Pruefung ausgeschlossen)

Tests:

- `npx tsc --noEmit` (App und Functions, beide 0 Fehler)
- `npm run lint` (0 Fehler)
- `npm test` (82), `npm run test:security` (62), `npm run test:functions` (7) - alle gruen
- `npx expo-doctor` (18/18, siehe Hinweis oben zur veraenderten Check-Anzahl)

Offene Punkte:

- Die neuen Composite-Indexe in `firebase/firestore.indexes.json` sind nur ein Manifest; sie muessen einmalig per `firebase deploy --only firestore:indexes` gegen das echte Firebase-Projekt ausgerollt werden, sobald dieses eingerichtet ist (siehe weiterhin offene Punkte aus Phase 1).

## Phase 10 - Ein Adressfeld, echte Laender-Auswahl, Beispiel-Katalog

Auf Nutzerwunsch (WhatsApp-Liste mit 12 Produkten und Vertriebslaendern) umgesetzt, nach Rueckfrage zur genauen Auswirkung auf das Adressfeld:

Was fertig ist:

- **Adressfeld zusammengelegt:** `Customer.street` + `houseNumber` + `postalCode` (3 separate Pflichtfelder) sind zu einem einzigen Feld `address` (Freitext, z. B. "Musterstrasse 12, 12345") verschmolzen. `city`, `country` und das optionale `region` bleiben eigene Felder, damit der bestehende Staedte-Tab (Gruppierung nach Stadt) und die Kartenfilter (Land/Stadt/Region) unveraendert weiterfunktionieren. Betroffen waren `Customer`-Typ, `customerSchema`, `customerRepositoryData`, `geocodingService`, beide Kundenformulare (neu/bearbeiten), alle Anzeige-Stellen (Kundendetails, Kartenkarte, Staedte-Kundenkarte, Teilen-Text) und die Kundensuche - insgesamt rund 20 Dateien.
- Bewusst **kein Migrationscode** fuer bereits gespeicherte Kunden mit altem Feldschema: Die App ist noch nicht auf TestFlight/produktiv, ein sauberer Schnitt ohne Kompatibilitaetsschicht wurde als einfachste, richtige Loesung gewaehlt.
- **Echte Laender-Auswahl:** `country` ist in beiden Kundenformularen keine Freitexteingabe mehr, sondern ein neues `CountrySelectField` (Chip-Auswahl), das die echten, in der Verwaltung gepflegten `countries`-Eintraege des Benutzers laedt. Kein Land in der Verwaltung angelegt heisst kein Land waehlbar - klarer Hinweistext statt Freitext-Ausweichloesung.
- **Beispiel-Katalog:** Die vom Nutzer genannten 12 Produkte (Baladi Kaese, Musanara, Meshalel, Labneh, Qishta, Shanglish, Duberke, Oliven, Olivenoel, Paprikamark, Tomatenmark, Makdos) und 6 Laender (Deutschland, Daenemark, Niederlande, Belgien, Frankreich, Schweden, aus der Textnachricht zu den Vertriebslaendern) liegen jetzt als Daten in `seedCatalog.ts`. Ein neuer Button "Beispiel-Katalog laden" in der Verwaltung legt sie ueber die bestehenden `productRepository`/`countryRepository`-Pfade fuer den eingeloggten Benutzer in Firestore an; bereits vorhandene Eintraege (Namensvergleich, gross-/kleinschreibungsunabhaengig) werden uebersprungen, der Button ist also gefahrlos mehrfach klickbar.
- Wichtige Einschraenkung, dem Nutzer mitgeteilt: von dieser CLI-Umgebung aus kann nicht direkt in die echte Firebase-Datenbank des Nutzers geschrieben werden (kein echtes Projekt/keine Credentials hier konfiguriert, nur die lokale Emulator-Suite fuer Tests). Der Katalog wird deshalb erst gespeichert, wenn der Nutzer den Button in der echten App antippt, dort mit seinem eigenen Login.

Welche Dateien erstellt oder erweitert wurden:

- `src/types/customer.ts`, `src/features/customers/validation/customerSchema.ts`, `src/repositories/customerRepositoryData.ts`
- `src/services/geocodingService.ts`
- `src/features/countries/components/CountrySelectField.tsx` (neu)
- `src/features/customers/components/CustomerAddressSection.tsx`, `CustomerEditAddressSection.tsx`, `CustomerAddressView.tsx`, `CustomerDetailsHeader.tsx`, `CustomerDetailsScreen.tsx`
- `src/features/customers/services/customerEditService.ts`, `src/features/customers/hooks/useCustomerEdit.ts`
- `src/features/orders/validation/addOrderFormSchema.ts`
- `src/features/map/services/mapCustomerService.ts`, `src/features/map/components/CustomerMapCard.tsx`, `src/features/map/hooks/useMapActions.ts`
- `src/features/cities/components/CityCustomerCard.tsx`, `src/features/cities/services/cityCustomerService.ts`, `src/features/cities/types/cityCustomerTypes.ts`
- `src/repositories/customerRepository.ts` (Suche nutzt jetzt `address` statt `street`)
- `src/features/management/data/seedCatalog.ts`, `src/features/management/services/seedCatalogService.ts`, `src/features/management/hooks/useSeedCatalog.ts`, `src/features/management/components/SeedCatalogSection.tsx` (alle neu)
- `src/features/management/components/ManagementScreen.tsx` (Seed-Katalog-Sektion eingebunden)
- `tests/unit/seedCatalogService.test.ts` (neu)
- `tests/unit/customerSchema.test.ts`, `tests/unit/addOrderFormSchema.test.ts`, `tests/unit/customerEditService.test.ts`, `tests/unit/mapCustomerService.test.ts`, `tests/unit/mapLargeData.test.ts`, `tests/unit/cityCustomerService.test.ts`, `tests/unit/citySelectionService.test.ts`, `tests/unit/cityService.test.ts`, `tests/repositories/customerRepositoryData.test.ts`, `tests/repositories/orderRepositoryData.test.ts` (Fixtures auf `address` umgestellt)

Tests:

- `npx tsc --noEmit` (0 Fehler)
- `npm run lint` (0 Fehler)
- `npm test` (85 Tests, alle gruen)
- `npx expo-doctor` (18/18)

Offene Punkte:

- Der Beispiel-Katalog muss noch einmal in der echten App (mit echtem Firebase-Projekt) angetippt werden, damit die Daten tatsaechlich in Firestore landen.
- „Staedte-Wahl" wurde bewusst nicht als eigene Auswahl-Komponente gebaut (Stadt bleibt Freitext wie zuvor); falls eine Autovervollstaendigung aus bereits verwendeten Staedten gewuenscht ist, ist das ein eigener, kleiner Folgeschritt.

## Phase 11 - Fix: Firestore-Fehler wurden immer als generische Meldung angezeigt

Beim Live-Debugging mit dem Nutzer (echtes Projekt `rsho-orders` zeigte ueberall "Etwas ist schiefgelaufen") wurde ein echter Bug gefunden:

- `src/utils/formatError.ts` hat Firestore-Fehlercodes bisher mit einem `"firestore/"`-Praefix in der Map erwartet (z. B. `"firestore/permission-denied"`). Der reale Firestore-Web-SDK-Code (`FirestoreError.code`, verifiziert direkt im installierten `@firebase/firestore`-Paket) hat aber **keinen** Praefix, z. B. nur `"permission-denied"`, `"failed-precondition"`, `"unavailable"`. Dadurch griff die Zuordnung fuer **jeden** Firestore-Fehler nie, und die App zeigte immer nur die nichtssagende Standardmeldung - egal ob Regeln fehlten, Indexe fehlten oder etwas ganz anderes das Problem war.
- Behoben: Praefix aus den Map-Schluesseln entfernt (`permission-denied`, `failed-precondition`, `unavailable`, `deadline-exceeded`, `cancelled`, `not-found`). Auth- (`auth/...`) und Functions-Codes (`functions/...`) waren bereits korrekt, da diese SDKs ihre Codes tatsaechlich so praefixen.
- Zusaetzlich wurden im echten Firebase-Projekt `rsho-orders` gemeinsam mit dem Nutzer alle 8 in `firebase/firestore.indexes.json` vorbereiteten Composite-Indexe manuell ueber die Firebase-Konsole angelegt (die CLI-basierte Bereitstellung war von dieser Umgebung aus nicht moeglich, da kein authentifizierter `firebase login` verfuegbar ist).

Welche Dateien erweitert wurden:

- `src/utils/formatError.ts`
- `tests/unit/formatError.test.ts` (Codes ohne Praefix, zwei neue Faelle fuer `failed-precondition` und `permission-denied` ergaenzt)

Tests:

- `npx tsc --noEmit` (0 Fehler)
- `npm test` (88 Tests, alle gruen)

Offene Punkte:

- Der Nutzer muss die App nach diesem Fix erneut testen; falls jetzt noch ein Fehler auftaucht, sollte er dank der korrigierten Zuordnung eine spezifischere, hilfreichere Meldung zeigen statt der generischen.
- Composite-Indexe fuer das echte Projekt `rsho-orders` wurden nur manuell in der Konsole angelegt, nicht ueber `firebase deploy`; kuenftige neue Indexe (falls noch mehr Abfragen dazukommen) muessen ebenso manuell nachgezogen werden, solange kein authentifizierter CLI-Zugang eingerichtet ist.

## Phase 12 - Live-Debugging mit dem Nutzer: Karten-UI, Verwaltungs-Karten, Bestell-Regel-Bug

Beim gemeinsamen Testen mit dem Nutzer (echtes Geraet, echtes Projekt `rsho-orders`) kamen mehrere echte Probleme zum Vorschein und wurden direkt behoben:

- **Firestore-Regeln des echten Projekts waren veraltet/anders**: Die in der Konsole deployten Regeln nutzten ueberall das Feld `userId` statt `ownerId` (Mismatch zum kompletten App-Code, der ausschliesslich `ownerId` schreibt). Dadurch schlug praktisch jede Lese-/Schreiboperation fehl. Der Nutzer hat die korrekte, bereits getestete Regel-Datei aus diesem Repo manuell in der Konsole eingefuegt und veroeffentlicht.
- **Karten-Screen (`MapScreen.tsx`) war nicht scrollbar** und hat die eigentliche Karte auf quasi 0 Hoehe zusammengequetscht, wenn Filter/Werkzeuge viel Platz brauchten. Jetzt steckt der ganze Screen in einer `ScrollView`, die Karte hat eine feste Hoehe (440) statt `flex: 1`, und die doppelte Kundenzahl-Anzeige (einmal als Stat-Kachel oben, einmal als Extra-Karte weiter unten) wurde auf die eine Anzeige oben reduziert.
- **"Auswahl loeschen"-Button in `MapSelectionToolbar.tsx` lief ausser Kontrolle**: `flex: 1` neben drei Werkzeug-Chips ohne `flexWrap` hat den Button auf eine derart schmale Spalte gequetscht, dass der Text buchstabenweise umgebrochen ist. Jetzt eigene volle Zeile fuer den Button, Werkzeug-Chips duerfen umbrechen.
- **Produkt-/Laender-/Regionen-Listenkarten liefen ueber den Bildschirmrand**: zu viele Aktionen (Pfeile, Bearbeiten, Loeschen, Schalter) in einer einzigen Zeile ohne Umbruch haben Inhalte abgeschnitten und den Titel unsichtbar gemacht. Alle drei (`ProductListItem`, `CountryListItem`, `RegionListItem`) wurden auf ein zweizeiliges Karten-Layout umgestellt: oben Titel (mit Platzhalter-Icon bei Produkten) + Schalter, darunter die Aktionen in eigener Zeile.
- **Bild-Upload-Feature angefangen, dann auf Nutzerwunsch wieder verworfen**: `expo-image-picker` + Firebase Storage (Client, Regeln, `firebase.json`) sowie `Product.imageUrl`/`imagePath` wurden aufgebaut, dann komplett zurueckgebaut, nachdem der Nutzer sich stattdessen fuer die einfache Platzhalter-Icon-Loesung entschieden hat. `react-native-svg` (echter, unabhaengiger Fix fuer eine fehlende Peer-Dependency von `@fluentui/react-native-icons`) wurde behalten.
- **Echter, subtiler Regel-Bug beim Anlegen eines neuen Kunden gefunden und behoben**: `orderRepository.createOrder()` legt Kunde, Bestellung und Bestellpositionen in **einer** Firestore-Transaktion an. Die alte Regel fuer `orders/{orderId}/items/{itemId}` hat den Besitzer per `get()` der uebergeordneten Bestellung geprueft - die aber im selben Moment innerhalb derselben Transaktion gerade erst angelegt wird und aus Sicht der Regel-Auswertung (Stand vor Transaktionsbeginn) noch nicht existiert. Das fuehrte zu `permission-denied` bei jedem "neuer Kunde"-Vorgang. Fix: Bestellpositionen tragen jetzt selbst ein `ownerId`-Feld; `create`/`update` pruefen das direkt am Dokument (`validOwnerWrite()`), nur `read`/`delete` (die immer eine bereits existierende Bestellung voraussetzen) nutzen weiter `get()`. Mit einem gezielten Test abgesichert, der genau die reale Transaktion (Bestellung + Position gleichzeitig anlegen) nachstellt.

Welche Dateien erstellt oder erweitert wurden:

- `src/features/map/components/MapScreen.tsx`, `MapToolbar.tsx`, `MapSelectionToolbar.tsx`
- `src/features/products/components/ProductListItem.tsx`
- `src/features/countries/components/CountryListItem.tsx`
- `src/features/regions/components/RegionListItem.tsx`
- `src/repositories/orderRepositoryData.ts`, `src/repositories/orderRepository.ts`
- `firebase/firestore.rules`
- `tests/repositories/orderRepositoryData.test.ts`
- `tests/security/firestoreRules.test.ts`
- `tests/unit/authGateRules.test.ts` (an umbenannte `routes.overview` angepasst, Drift durch parallele Aenderung)
- `react-native-svg` als Dependency ergaenzt (fehlende Peer-Dependency von `@fluentui/react-native-icons`, von `expo-doctor` aufgedeckt)

Tests:

- `npx tsc --noEmit` (0 Fehler)
- `npm run lint` (0 Fehler)
- `npm test` (88 Tests)
- `npm run test:security` (64 Tests, inkl. neuem Transaktions-Regressionstest)
- `npm run test:functions` (7 Tests)
- `npx expo-doctor` (18/18)

Nachtrag: nach dem ersten Deploy der obigen Regel meldete die App im selben "neuer Kunde"-Ablauf weiterhin `permission-denied`. Zweite, verwandte Ursache gefunden und behoben:

- `orderRepository.createOrder()` liest vor dem eigentlichen Anlegen per `transaction.get(orderRef)` nach, ob zufaellig schon eine Bestellung mit dieser (frisch generierten) ID existiert - ein Duplikat-Schutz. Fuer eine brandneue ID existiert das Dokument aber nie, und die alte Regel `allow read: if isOwner(resource.data.ownerId)` wertet bei einem nicht existierenden Dokument `resource` als `null` aus; der Zugriff auf `.data.ownerId` darauf wirft einen Auswertungsfehler, den Firestore als `permission-denied` behandelt ("Null value error"). Betraf nicht nur `orders`, sondern strukturell jede Sammlung mit demselben Regel-Muster.
- Fix: alle fuenf owner-gebundenen Lese-Regeln (`customers`, `orders`, `products`, `countries`, `regions`) pruefen jetzt zuerst `resource == null` (Dokument existiert nicht -> Lesen ist unbedenklich erlaubt, es gibt nichts zu schuetzen) und erst danach den eigentlichen Besitzer-Vergleich.
- Mit zwei weiteren Tests abgesichert: einer prueft gezielt das Lesen eines nicht existierenden `orders`-Dokuments in einer Transaktion, der andere simuliert den kompletten echten `createOrder()`-Ablauf (neuer Kunde + neue Bestellung + Produkte, alles in einer Transaktion) End-to-End gegen den Emulator.

Tests (aktualisiert):

- `npm test` (88 Tests)
- `npm run test:security` (66 Tests)

Offene Punkte:

- Der Nutzer muss die finale, oben im Chat geteilte `firebase/firestore.rules`-Datei erneut in der Konsole veroeffentlichen (jetzt mit beiden Fixes: Bestellpositionen-Block und `resource == null`-Absicherung bei allen fuenf Lese-Regeln), damit die Fixes auch im echten Projekt wirken.

Nachtrag 2: Nach den beiden Regel-Fixes kam beim selben "neuer Kunde"-Test ein **anderer** Fehler, diesmal generisch statt "kein Zugriff" - also ein neues, unabhaengiges Problem. Da `formatError()` den echten Fehler bisher komplett hinter einer freundlichen Meldung versteckt hat, wurde vorher blind geraten; das wurde behoben, bevor weitergesucht wurde:

- `src/utils/formatError.ts` loggt jetzt den rohen Fehler zusaetzlich per `console.error("[formatError] raw error:", error)` (nur wenn `__DEV__`, faellt im Node-Test-Runner sicher auf "immer loggen" zurueck, da dort kein `__DEV__` existiert). Der Nutzer hat daraufhin den echten Fehler aus dem Metro-Terminal geschickt.
- **Echter, dritter Bug gefunden**: `Function Transaction.set() called with invalid data. Unsupported field value: undefined (found in field note in document orders/...)`. Ursache: `buildOrderCreateData()` schreibt `note: parsed.note?.trim()` direkt in die Firestore-Schreiboperation. Das Bestell-Notizfeld hat aber (siehe Phase 2) noch gar kein UI-Feld, ist also immer `undefined`, nicht leer - und die Firestore-Web-SDK wirft bei jedem `undefined`-Feldwert in `setDoc`/`transaction.set()` sofort einen Fehler, statt das Feld stillschweigend wegzulassen.
- Dieselbe Fehlerklasse (`optionalField?.trim()` direkt in die Schreib-Daten geschrieben, ohne auf `undefined` zu pruefen) systematisch in allen anderen `*RepositoryData.ts`-Create-Funktionen gesucht und behoben, bevor sie dort ebenfalls zuschlaegt: `customerRepositoryData.ts` (`region`, `note`, `latitude`, `longitude` - Letzteres besonders relevant, weil Geocoding bei fehlgeschlagener/uebersprungener Adresssuche `undefined` liefert), `countryRepositoryData.ts` (`isoCode`), `regionRepositoryData.ts` (`city`/`normalizedCity`). Alle betroffenen Felder werden jetzt nur noch in das Schreib-Objekt aufgenommen, wenn tatsaechlich ein Wert vorhanden ist (`...(value ? { field: value } : {})`), statt sie mit `undefined` mitzuschreiben.
- Mit zwei neuen Tests abgesichert, die pruefen, dass die betroffenen Felder beim Fehlen komplett aus dem Ergebnisobjekt fehlen (nicht nur `undefined` sind, was in JS/TS einen Unterschied macht, den Firestore aber nicht toleriert).

Welche Dateien zusaetzlich erweitert wurden:

- `src/utils/formatError.ts` (Debug-Logging)
- `src/repositories/orderRepositoryData.ts`, `customerRepositoryData.ts`, `countryRepositoryData.ts`, `regionRepositoryData.ts`
- `tests/repositories/orderRepositoryData.test.ts`, `customerRepositoryData.test.ts`

Tests (aktualisiert):

- `npm test` (90 Tests)

Offene Punkte:

- Der Nutzer muss die App neu starten (nicht nur neu laden) und den kompletten "neuer Kunde + Bestellung"-Ablauf erneut testen; falls dabei noch ein Fehler auftaucht, zeigt das Metro-Terminal dank des neuen Loggings jetzt den echten Fehler direkt an.

Nachtrag 3: "neuer Kunde" funktionierte danach nachweislich (Kunde korrekt mit `ownerId` in Firestore sichtbar), aber "bestehender Kunde auswählen und Bestellung speichern" lieferte weiterhin `permission-denied`, diesmal ohne Detailtext ("Missing or insufficient permissions."). Wurzelursache gefunden, unabhängig von allen bisherigen Fixes:

- Ganz am Anfang der Session (erstes Metro-Log) stand bereits die Warnung `Auth (12.17.0): You are initializing Firebase Auth for React Native without providing AsyncStorage. Auth state will default to memory persistence...`. `src/firebase/auth.ts` rief `initializeAuth(firebaseApp)` bisher ohne `persistence`-Option auf. Dadurch lebt die Anmeldesitzung nur im Arbeitsspeicher; bei jedem Metro-Reload/Fast-Refresh während der Entwicklung (und generell bei jedem App-Neustart in Produktion) kann die Sitzung intern verschwinden, ohne dass die UI das sichtbar macht - der naechste Firestore-Zugriff schlägt dann mit `permission-denied` fehl, weil `request.auth` auf Server-Seite nicht mehr existiert, obwohl die App optisch weiter eingeloggt wirkt. Erklaert das unregelmaessige "mal geht's, mal nicht"-Verhalten ueber die ganze Session hinweg.
- Fix: `src/firebase/auth.ts` nutzt jetzt `initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) })` mit `@react-native-async-storage/async-storage` (war bereits eine Abhaengigkeit). Faellt bei bereits initialisierter Auth-Instanz (Fast-Refresh) weiterhin auf `getAuth()` zurueck, wie zuvor.
- `getReactNativePersistence` ist im `@firebase/auth`-Paket nur ueber die `"react-native"`-Exportbedingung erreichbar; Metro loest das zur Laufzeit korrekt auf, TypeScript waehlt beim Typecheck aber die plattformneutrale Deklarationsdatei, die diese Funktion nicht kennt. Statt eines `any`-Casts oder `@ts-ignore` wurde eine kleine, praezise typisierte Modul-Erweiterung (`src/types/firebaseAuthRn.d.ts`) ergaenzt, die exakt die reale, dokumentierte Signatur nachtraegt.

Welche Dateien zusaetzlich erstellt/erweitert wurden:

- `src/firebase/auth.ts`
- `src/types/firebaseAuthRn.d.ts` (neu)

Tests:

- `npx tsc --noEmit` (0 Fehler)
- `npm run lint` (0 Fehler)
- `npm test` (90 Tests)
- `npx expo-doctor` (18/18)

Offene Punkte:

- Der Nutzer muss sich nach diesem Fix einmal **komplett neu einloggen** (nicht nur die App neu laden), damit die Sitzung erstmals mit Persistenz gespeichert wird, und danach erneut "bestehender Kunde auswählen und Bestellung speichern" testen.

Nachtrag 4: Direkt nach dem Neustart erschien im Log `[formatError] raw error: [Error: Bitte melde dich erneut an.]`, ausgeloest aus `useUserPreferences` -> `userPreferencesRepository.getPreferences()`. Kein neuer Datenfehler, sondern ein Timing-Nebeneffekt des Persistenz-Fixes selbst:

- `SettingsBootstrap` (gemountet in `AppProviders`, oberhalb von `AuthGate`) laedt Nutzereinstellungen sobald `useCurrentUser()` einen Benutzer liefert. Direkt nach App-Start/Fast-Refresh kann der Zustand-Store kurzzeitig noch einen (alten) Benutzer zeigen, waehrend die frisch initialisierte Firebase-Auth-Instanz ihre Sitzung noch asynchron aus dem Speicher wiederherstellt (`auth.currentUser` ist in diesem kurzen Fenster noch `null`). Das ist ein normaler, erwarteter Uebergangszustand, wurde bisher aber wie ein echter Fehler behandelt.
- Fix: `useUserPreferences.ts` faengt genau den Fehlercode `auth/unauthenticated` jetzt gezielt ab (Praeferenzen werden auf Standardwerte zurueckgesetzt, kein Fehlerbanner) statt ihn als Fehler anzuzeigen. Sobald die Auth-Sitzung kurz danach wirklich bereit ist, feuert derselbe Hook durch seine eigene Abhaengigkeit auf `user` automatisch erneut und laedt die echten Einstellungen nach - kein Datenverlust, nur kein unnoetiger roter Banner mehr fuer einen Zustand, der sich von selbst aufloest.

Tests:

- `npx tsc --noEmit` (0 Fehler)
- `npm test` (91 Tests)

Offene Punkte:

- Der eigentliche offene Test bleibt: "bestehender Kunde auswaehlen und Bestellung speichern" nach dem kompletten Neu-Login noch einmal bestaetigen.
