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
