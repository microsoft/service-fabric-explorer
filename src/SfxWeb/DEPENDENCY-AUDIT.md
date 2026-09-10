# SfxWeb Dependency & Config Audit

Snapshot of stale / deprecated / outdated packages and config that drifted out of
sync during the Angular → v22 upgrade. Captured 2026-07-31; status updated 2026-08-04.
RxJS 7 and the dead test/build tooling are now cleared.

## 1. Dead test tooling — cleared 2026-08-04

| Package | Note |
|---|---|
| `karma`, `karma-chrome-launcher`, `karma-coverage-istanbul-reporter`, `karma-jasmine`, `karma-jasmine-html-reporter` | Removed; tests use `@angular/build:unit-test` with Vitest |
| `jasmine-core`, `@types/jasmine` | Removed; specs use Vitest globals |
| `jasmine-spec-reporter` | Removed |
| `source-map-support` | Removed as a direct dependency; still required transitively by `@angular/build` |

## 2. Redundant build tooling — dead items cleared 2026-08-04

| Package / config | Note |
|---|---|
| `@angular-devkit/build-angular` | Removed; all targets use `@angular/build:*` |
| `webpack-bundle-analyzer` + scripts `analyze` / `build:stats` | Removed; esbuild does not emit webpack `stats.json` |
| `@cypress/webpack-preprocessor` | Removed as a direct dependency with the unused custom TypeScript preprocessor. Coverage v4 still uses webpack transitively for its own supported instrumentation path. |

This cleanup removed 348 installed packages and reduced `npm audit` from 43 to 37
findings. Build and Vitest are green (13 files, 95 tests).

## 3. EOL / deprecated runtime libraries — reviewed 2026-08-04

| Package | Current → Latest | Note |
|---|---|---|
| `rxjs` | 7.8.2 | Upgrade verified by build and all 95 Vitest tests |
| `adal-angular` + `@types/adal-angular` | 1.0.x | Retained intentionally. ADAL is retired, but the requested auth behavior remains unchanged. |
| `moment` | 2.30.1 | Retained for now. `vis-timeline` declares Moment as a peer and uses its mutable date API internally; current `vis-timeline` 8.5.2 still has the same requirement. Removing Moment requires replacing or forking the timeline library, not just changing the app's single import. The patch remains active. |
| `@microsoft/applicationinsights-web` | 3.4.3 | Upgraded from legacy v2.8.18 and reviewed against the official v3 breaking-change guide. Migrated the remaining v1-style `trackException(error)` call to `trackException({ exception: error })`; event and page-view calls already use v2 object APIs. No removed config, extension, snippet, utility-export, or IE8 dependency applies. Application typecheck, optimized build, and Vitest pass. |

## 4. Outdated majors — cleared 2026-08-04

| Package | Current → Latest | Note |
|---|---|---|
| `jquery` | Removed | No imports or workspace configuration used it. |
| `highcharts` | 11.4.8 → 13.0.0 | Migrated module loading to v12+ side-effect imports, explicitly initialized core first, and updated tooltip formatter contexts from `this.point` to `this`. Typecheck, build, unit tests, and Cypress chart coverage pass. |
| `@cypress/schematic` | Removed | The installed schematic had no runtime or configuration use. |
| `@cypress/code-coverage` | 3.14.7 → 4.0.3 | Migrated public configuration from `env` to `expose`, registered tasks directly in `setupNodeEvents`, and disabled deprecated `Cypress.env()` compatibility. |
| `nyc` | 15.1.0 → 18.0.0 | Upgraded with Cypress coverage v4. |
| `vis-data` / `vis-timeline` | 7.x → 8.0.4 / 8.5.2 | Upgraded together for v8 peer compatibility. Added the required HammerJS ambient declarations and pinned their supported UUID peer to patched 11.1.1; existing ESM imports and CSS path remain valid. |
| `xml2js` | Removed | Unused; application XML parsing uses the browser `DOMParser`. |
| `start-server-and-test` | 2.1.5 → 3.0.11 | CLI contract is unchanged; local and CI runtimes use supported Node 24. |
| `@types/nouislider` | Removed | noUiSlider 15's bundled declarations typecheck the application. |
| `jsdom` | 29.1.1 → 30.0.1 | Newly surfaced major upgraded on the supported Node 24 runtime; all unit tests pass. |

These migrations reduced the optimized initial bundle from 3.09 MB to 2.93 MB and
reduced `npm audit` from 37 findings to 24 development-only findings (22 high,
2 moderate). `npm audit --omit=dev` reports zero production vulnerabilities.

## 5. Stale config — cleared 2026-08-04

- **`package.json` scripts**: removed obsolete Karma browser flags and webpack analysis scripts.
- **TypeScript**: uses `module: "preserve"` and `target: "ES2022"`; replaced the deprecated template-check option with the current `strictTemplates` setting and removed legacy compiler flags.
- **Browser targets**: retained the existing `.browserslistrc` to preserve the project's broader compatibility policy. Angular warns for targets outside its tested support matrix and ignores targets without ES module support.
- **Polyfills**: configured `@angular/localize/init` and `zone.js` directly in `angular.json`; removed the legacy polyfill bootstrap file.
- **Angular workspace**: removed the empty default configuration and no-op options, recalibrated the optimized initial bundle budget to 3.3 MB warning / 3.6 MB error, and reduced CommonJS exemptions to dependencies that still produce build warnings. `vis-data` no longer needs an exemption after v8; `moment` remains until the timeline dependency is replaced.
- **Overrides**: removed the no-op `serialize-javascript` override and the obsolete `pacote/tar` pin; upstream now resolves `tar` 7.5.x directly.

## 6. Sfx-Proxy

| Package | Current → Latest |
|---|---|
| `express` | 4.22.2 → 5.2.1 (major) |
| `body-parser` | 1.20.6 → 2.3.0 (bundled into express 5) |

## 7. Correct as-is (do NOT "fix" these)

`@angular/*` remains on the **22.0.x** minor line (22.1 is a separate minor follow-up) · `typescript` **6.0.3** (Angular 22 requires TypeScript 6.0.x; 7 is unsupported) · `eslint` **9.x** (angular-eslint 22 does not support 10) · `@types/node` **24** (matches Node 24 runtime) · `zone.js` **0.15.1** (Angular-pinned) · `eslint.config.js` (already modern flat config).

## Suggested sequencing

1. ~~Finish **RxJS 7** → green Vitest.~~ Completed 2026-08-04.
2. ~~**Remove dead test/build tooling** (§1–2).~~ Completed 2026-08-04; the active Cypress webpack preprocessor remains.
3. ~~**Config cleanups** (§5).~~ Completed 2026-08-04.
4. ~~**Outdated majors** (§4).~~ Completed 2026-08-04.
5. Larger, separate efforts: **replace/fork vis-timeline to remove Moment** and **Express 5**. ADAL is intentionally retained.
