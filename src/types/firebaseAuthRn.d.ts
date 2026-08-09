// @firebase/auth's own package "exports" map only advertises getReactNativePersistence
// under the "react-native" condition. Metro resolves that at runtime and this really is
// callable, but TypeScript's bundler resolution picks the platform-neutral declaration
// file for this package, which omits it. This augmentation adds the real, documented
// signature back so the app can call it without an `any` cast or a suppressed error.
export {};

declare module "@firebase/auth" {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
