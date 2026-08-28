# DBPredictor — Plan de Mejora Profesional

> Extensión VS Code para análisis de seguridad en tiempo real de mutaciones de base de datos (Prisma, Supabase, Drizzle + PostgreSQL).
> Documento de seguimiento: seguimiento de cada mejora desde el análisis hasta la resolución.

---

## Metadata

| Campo               | Valor                                    |
| ------------------- | ---------------------------------------- |
| **Fecha de inicio** | 2026-04-30                               |
| **Estado**          | En progreso                              |
| **Repositorio**     | `C:/Proyectos/hitboxts/DBPredictor/`     |
| **Extensión**       | `hitboxts` (nombre interno del proyecto) |

---

## Hallazgos por Prioridad

### 🔴 HIGH — Seguridad y testing crítico

| ID       | Problema                                      | Archivo                            | Descripción                                                            | Status      |
| -------- | --------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- | ----------- |
| **H-01** | SSL `rejectUnauthorized: false` en producción | `src/config/SSLConfig.ts`          | Deshabilita verificación de certificados SSL, permitiendo ataques MITM | ✅ Resuelto |
| **H-02** | Sin tests unitarios en `SimulationRunner`     | `src/core/db/SimulationRunner.ts`  | Código crítico de seguridad (prevención SQL injection) sin coverage    | ✅ Resuelto |
| **H-03** | Sin tests unitarios en `ConnectionManager`    | `src/core/db/ConnectionManager.ts` | Gestión de conexiones de base de datos sin tests                       | ✅ Resuelto |

### 🟡 MEDIUM — Calidad y arquitectura

| ID       | Problema                                        | Archivo                                     | Descripción                                                            | Status      |
| -------- | ----------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| **M-01** | ESLint apunta a `tsconfig.test.json` incorrecto | `eslint.config.mjs:12`                      | No valida el código fuente real en `src/`                              | ✅ Resuelto |
| **M-02** | Tipos duplicados extension ↔ webview            | `src/shared/types.ts`                       | Centralización de tipos para evitar drift y facilitar el mantenimiento | ✅ Resuelto |
| **M-03** | Regex SQL injection demasiado restrictivo       | `src/core/db/SimulationRunner.ts:54`        | Ahora permite esquemas (puntos) y mejora los mensajes de alerta        | ✅ Resuelto |
| **M-04** | Sin reporte de coverage de tests                | Configuración de test                       | Integración con `c8` para medir cobertura de tests                     | ✅ Resuelto |
| **M-05** | Worker timeout no limpia correctamente          | `src/core/db/SimulationRunner.ts:27-32`     | Ahora fuerza `disconnect()` y hace auto-reconnect                      | ✅ Resuelto |
| **M-06** | Build no ejecuta type checking                  | `package.json` scripts `compile`/`watch`    | `tsc --noEmit` añadido al flujo de compilación                         | ✅ Resuelto |
| **M-07** | Lógica duplicada en `getCallChain()`            | `SupabaseDetector.ts`, `DrizzleDetector.ts` | Extraído a `src/utils/ast.ts`                                          | ✅ Resuelto |
| **M-08** | Silent failures en manejo de errores            | `ConnectionManager.ts`, `extension.ts`      | Mejora en la propagación y visualización de errores al usuario         | ✅ Resuelto |

### 🟢 LOW — Mantenibilidad y documentación

| ID       | Problema                                        | Archivo                                    | Descripción                                                                   | Status       |
| -------- | ----------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | ------------ |
| **L-01** | Magic numbers sin constantes nombradas | `ImpactEngine.ts`, `db.worker.ts`, etc. | Valores hardcodeados sin contexto semántico | ✅ Resuelto |
| **L-02** | Código mixto español/inglés | Múltiples archivos | Estandarización de comentarios y logs a inglés | ✅ Resuelto |
| **L-03** | Sin Prettier (solo ESLint para formato) | Raíz del proyecto | Integración de Prettier para consistencia de estilo | ✅ Resuelto |
| **L-04** | Sin `.editorconfig` | Raíz del proyecto | Configuración IDE inconsistente | ✅ Resuelto |
| **L-05** | README incompleto | `README.md` | Se agregó referencia de configuración, troubleshooting y arquitectura | ✅ Resuelto |
| **L-06** | CHANGELOG en español | `CHANGELOG.md` | Ya se encontraba en inglés (verificado) | ✅ Resuelto |
| **L-07** | Directorio `docs/` vacío | `docs/` | Se limpió la estructura del directorio | ✅ Resuelto |
| **L-08** | Directorio `context/` vacío/incompleto | `context/` | Directorios eliminados | ✅ Resuelto |
| **L-09** | CI sin cache de `webview-ui/node_modules` | `.github/workflows/ci.yml` | Cache implementado en CI | ✅ Resuelto |
| **L-10** | Paquetes ESLint duplicados | `package.json` | Limpieza de dependencias de ESLint redundantes | ✅ Resuelto |
| **L-11** | `vscode.mock.ts` — `positionAt()` returns dummy | `test/unit/SupabaseDetector.test.ts:13-15` | Se eliminó duplicación de MockDocument y se proveyó una implementación real | ✅ Resuelto |
| **L-12** | Sin custom error classes                        | `src/shared/errors.ts`                     | Implementación de `QueryGuardError` para errores tipados                      | ✅ Resuelto  |
| **L-13** | `.gitignore` incompleto                         | `.gitignore`                               | Se agregaron exclusiones para archivos de macOS (`._*`)                       | ✅ Resuelto |
| **L-14** | Sin integración tests en CI                     | `.github/workflows/ci.yml`                 | Tests ahora se ejecutan en cada push/PR                                       | ✅ Resuelto  |

---

## Hallazgos positivos (mantener)

| ID       | Descripción                                                  | Archivo                        |
| -------- | ------------------------------------------------------------ | ------------------------------ |
| **P-01** | Estructura de carpetas limpia siguiendo convenciones VS Code | —                              |
| **P-02** | Credenciales en `SecretStorage`, no plaintext                | `src/config/SecretsManager.ts` |
| **P-03** | Logger con sanitización de datos sensibles                   | `src/utils/logger.ts`          |
| **P-04** | `.gitignore` correctamente configurado                       | `.gitignore`                   |

---

## Roadmap de implementación propuesto

### Fase 1 — Seguridad y tests (crítico)

- [x] H-01: Corregir SSL configuration
- [x] H-02: Tests para SimulationRunner
- [x] H-03: Tests para ConnectionManager

### Fase 2 — Testing y tooling

- [x] M-04: Integrar coverage con c8
- [x] M-01: Corregir ESLint config
- [x] M-06: Agregar type checking al build
- [x] L-14: Integrar tests en CI
- [x] L-03: Agregar Prettier

### Fase 3 — Arquitectura y Robustez

- [x] M-02: Shared types package
- [x] M-08: Manejo de errores profesional
- [x] L-12: Custom error classes
- [x] M-03: Mejorar regex SQL injection
- [x] M-07: Extraer getCallChain() a util
- [x] M-05: Corregir cleanup en timeout

### Fase 4 — Consistencia y DX
- [x] L-01: Constants para magic numbers
- [x] L-02: Estandarizar comentarios a inglés
- [x] L-04: Agregar .editorconfig
- [x] L-10: Limpiar deps duplicados
- [x] L-11: Mejorar mock de vscode
- [x] L-13: Mejorar .gitignore

### Fase 5 — Documentación
- [x] L-05: Mejorar README
- [x] L-06: CHANGELOG en inglés
- [x] L-07: Poblar docs/ o eliminarlo
- [x] L-08: Limpiar context/ o eliminarlo
- [x] L-09: Cache en CI para webview-ui

---

## Changelog del documento

| Fecha      | Cambio                                                 |
| ---------- | ------------------------------------------------------ |
| 2026-04-30 | Creación del documento de seguimiento                  |
| 2026-04-30 | Resolución de H-01, H-02, H-03, M-01, M-04, M-06, L-14 |
| 2026-04-30 | Resolución de M-02, M-03, M-08, L-02, L-03, L-12       |

---

_Documento generado automáticamente — actualizar `Status` de cada hallazgo según se avance._
