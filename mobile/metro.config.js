const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer CJS/react-native entries over raw ESM (.mjs) builds in package "exports"
// maps — some deps (e.g. zustand) ship import.meta in their ESM build, which
// breaks Metro's web bundle since it's served as a classic (non-module) script.
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;
