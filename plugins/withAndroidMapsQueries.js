const { withAndroidManifest } = require("@expo/config-plugins");

// Android 11+ hides other apps' packages by default (package visibility).
// Without declaring these <queries> intents, Linking.canOpenURL() for
// comgooglemaps:// and waze:// would always report "not installed" even
// when the apps are present — the Android equivalent of iOS's
// LSApplicationQueriesSchemes.
const SCHEMES_TO_QUERY = ["comgooglemaps", "waze", "geo"];

function withAndroidMapsQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const queries = manifest.queries?.[0] ?? {};
    const existingIntents = queries.intent ?? [];

    const schemeIntents = SCHEMES_TO_QUERY.map((scheme) => ({
      action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
      data: [{ $: { "android:scheme": scheme } }],
    }));

    manifest.queries = [{ ...queries, intent: [...existingIntents, ...schemeIntents] }];

    return config;
  });
}

module.exports = withAndroidMapsQueries;
