const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["functions/**", "node_modules/**", "scaffold-temp/**", "__sdk54router/**", "__sdk54ref/**", ".expo/**"],
  },
];
