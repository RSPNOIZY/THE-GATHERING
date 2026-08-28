# 🌍 NOIZYLAB Translations & Localization

> Making NOIZYLAB accessible to all humans, everywhere.

---

## Supported Languages

| Flag | Language | Status | Maintainer |
|------|----------|--------|------------|
| 🇺🇸 | English | ✅ Complete | Core Team |
| 🇪🇸 | Español | 🔄 In Progress | — |
| 🇫🇷 | Français | 🔄 In Progress | — |
| 🇩🇪 | Deutsch | 🔄 In Progress | — |
| 🇯🇵 | 日本語 | 🔄 In Progress | — |
| 🇨🇳 | 中文 | 🔄 In Progress | — |
| 🇧🇷 | Português | 🔄 In Progress | — |
| 🇷🇺 | Русский | 🔄 In Progress | — |
| 🇮🇳 | हिन्दी | 🔄 In Progress | — |
| 🇸🇦 | العربية | 🔄 In Progress | — |

---

## How to Contribute Translations

1. Fork the repo: `https://github.com/Noizyfish/NOIZYLAB`
2. Create a folder: `locales/<lang>/` (e.g., `locales/es/`)
3. Translate key docs:
   - `README.md`
   - `AUTORUN_README.md`
   - `TEAM_ENABLEMENT_PLAN.md`
   - UI strings in `ui/` components
4. Submit a PR with `[i18n]` prefix.

---

## Translation Guidelines

- **Clarity over literal**: Prioritize understanding over word-for-word.
- **Technical terms**: Keep code, CLI commands, and paths in English.
- **Tone**: Friendly, professional, inclusive.
- **Accessibility**: Use simple language; avoid idioms that don't translate.

---

## UI Localization

For React/webview components:
- Place JSON files in `locales/<lang>/ui.json`.
- Use a simple key-value structure:
  ```json
  {
    "welcome": "Bienvenido a NOIZYLAB",
    "deploy": "Desplegar",
    "mtu_check": "Verificar MTU"
  }
  ```
- Load via i18n library (e.g., `react-i18next`).

---

## Compliance & Inclusivity

- All team members must have access to docs in their preferred language.
- Critical operational docs (safety, rollback, incident response) will be prioritized for translation.
- Use auto-translate tools (DeepL, Google Translate) as a starting point, then human-review.

---

**The United Nations of Code welcomes all contributors.** 🌍🚀
