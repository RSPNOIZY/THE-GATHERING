# Changelog

All notable changes to the "queryguard" extension will be documented in this file.

## [1.2.1] - 2026-05-07

### Added

- Upgraded to TypeScript 6.0.3 for better performance and type safety.
- Added explicit support for Node.js 20 in CI/CD pipeline.

### Fixed

- **Critical Security Fixes**: Resolved 4 vulnerabilities (RCE and DoS) in dependencies (`esbuild`, `diff`, `serialize-javascript`).
- Fixed ESLint configuration and resolved all linting warnings in the test suite.
- Corrected `tsconfig.json` deprecation warnings for `baseUrl`.

## [1.2.0] - 2026-05-01

### Added

- Export history to CSV/JSON (via Clipboard).
- Improved Blast Radius visualization with detailed bar charts.
- Enhanced cascade tree navigation and styling.
- New "History" tab for better session tracking.

### Fixed

- Safety transaction logic for `ROLLBACK` during simulations.
- UI state persistence when switching between Analysis and History.

## [1.1.2] - 2026-04-17

### Fixed

- Fixed navigation issue in the History tab where background updates would force users back to the Analysis tab.
- Corrected Webview UI state management to allow stable history browsing.

## [1.1.1] - 2026-04-15

### Added

- Initial release of QueryGuard.
- Support for Prisma, Supabase, and Drizzle.
- Real-time row impact estimation.
- Recursive cascade deletion analysis.
- Safe simulation environment.
- Visual Blast Radius chart in Webview.
