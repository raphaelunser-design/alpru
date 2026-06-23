import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".cache/**",
    ".codex-screens/**",
    ".alpivo-launcher/**",
    "public/map/**",
    "public/ski-geo/**",
    "src/app/karte/**",
    "src/app/map/3d*/**",
    "src/app/map/real-spike/**",
    "src/app/map/terrain-lab/**",
    "src/components/ski-map/**",
    "src/lib/ski-geo/**",
    "tmp-*",
    "tmp-*.*",
    "tmp_*.mjs",
    "tmp_*.html",
    "*.csv",
    "*.html",
    "tmp-cdp-profile*/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
