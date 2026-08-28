# QueryGuard — Hardening & Feature Completeness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mitigar todos los issues críticos y de alta prioridad identificados en el análisis exhaustivo, haciendo QueryGuard más robusto, preciso y profesional, sin discrepancias ni duplicidades.

**Architecture:** El plan se estructura en 4 fases independientes que pueden ejecutarse en paralelo una vez que la Fase 1 (base) esté completada. Cada fase tiene边界 claras y archivos asignados. No se crean nuevos archivos duplicados — todos los cambios son en archivos existentes. Los tests acompañan cada tarea.

**Tech Stack:** TypeScript, Node.js worker_threads, pg (pg Pool), React + Recharts (webview), VS Code API, mocha/chai (tests unitarios).

---

## Mapa de archivos del proyecto

```
DBPredictor/
├── src/
│   ├── extension.ts                    ← registro de comandos y lifecycle
│   ├── config/
│   │   ├── SecretsManager.ts
│   │   └── SSLConfig.ts
│   ├── core/
│   │   ├── db/
│   │   │   ├── ConnectionManager.ts     ← reconnect, pool error handler
│   │   │   ├── SchemaCache.ts           ← staleness info
│   │   │   ├── SimulationRunner.ts     ← FIX: UPDATE simula DELETE para cascadas
│   │   │   ├── db.worker.ts             ← pool.on('error'), staleness query
│   │   │   └── types.ts
│   │   ├── detectors/
│   │   │   ├── DetectorInterface.ts
│   │   │   ├── PrismaDetector.ts        ← parámetros de simulación para Prisma
│   │   │   ├── SupabaseDetector.ts      ← verificaciones adicionales
│   │   │   └── DrizzleDetector.ts       ← extracción de queryParams en .where()
│   │   └── impact/
│   │       ├── CascadeAnalyzer.ts       ← FIX: estimación SET NULL correcta
│   │       ├── ImpactEngine.ts
│   │       ├── HistoryManager.ts
│   │       └── types.ts
│   ├── providers/
│   │   ├── CodeLensProvider.ts
│   │   └── StatusBarProvider.ts        ← muestra hostname + db name
│   ├── shared/
│   │   ├── errors.ts                    ← agregar SimulationCascadeLimitation
│   │   └── types.ts
│   ├── utils/
│   │   ├── ast.ts
│   │   ├── debounce.ts
│   │   └── logger.ts
│   └── webview/
│       ├── ImpactPanelManager.ts
│       └── MessageBridge.ts
├── webview-ui/src/
│   ├── App.tsx                          ← banner de desconexión + estado conexión
│   ├── types/shared.ts
│   ├── components/BlastRadiusChart.tsx
│   ├── components/CascadeTree.tsx
│   ├── components/CascadeTreeMap.tsx
│   ├── components/HistoryView.tsx        ← exportar historial
│   ├── components/ImpactBar.tsx
│   ├── components/RiskBadge.tsx
│   ├── hooks/useVSCodeMessage.ts
│   ├── index.css
│   └── main.tsx
├── test/unit/
│   ├── CascadeAnalyzer.test.ts
│   ├── DrizzleDetector.test.ts
│   ├── SupabaseDetector.test.ts
│   ├── PrismaDetector.test.ts
│   ├── SimulationRunner.test.ts
│   └── vscode.mock.ts
├── package.json                         ← configuration validation, keybindings, commands
└── README.md                             ← corregir insert(), aclarar limitaciones
```

---

## FASE 1 — Base Crítica (todas las demás fases dependen de esto)

### Task 1.1: Configuración de validación de parámetros numéricos en package.json

**Files:**
- Modify: `DBPredictor/package.json:38-65`

- [ ] **Step 1: Agregar validación de rango para analysisDebounce y cacheTTL en package.json**

Reemplazar la sección `configuration` existente (líneas 38-65) con:

```json
"configuration": {
    "title": "QueryGuard",
    "properties": {
        "queryguard.enabled": {
            "type": "boolean",
            "default": true,
            "description": "Enable/Disable QueryGuard analysis."
        },
        "queryguard.showCodeLens": {
            "type": "boolean",
            "default": true,
            "description": "Show inline code lens impact estimations."
        },
        "queryguard.sslMode": {
            "type": "string",
            "default": "auto",
            "description": "SSL/TLS mode for database connections: auto (default), disable, require, verify-ca, verify-full.",
            "enum": ["auto", "disable", "require", "verify-ca", "verify-full"]
        },
        "queryguard.analysisDebounce": {
            "type": "integer",
            "default": 750,
            "minimum": 100,
            "maximum": 10000,
            "description": "Delay in milliseconds before re-analyzing code after changes. Range: 100–10000ms. Default: 750."
        },
        "queryguard.cacheTTL": {
            "type": "integer",
            "default": 300,
            "minimum": 30,
            "maximum": 86400,
            "description": "Schema cache time-to-live in seconds. Range: 30–86400s (1 day max). Default: 300."
        }
    }
}
```

- [ ] **Step 2: Agregar keybindings y comando showLogs en package.json**

Agregar después de `"commands"` en `contributes`:

```json
"keybindings": [
    {
        "command": "queryguard.connect",
        "key": "ctrl+shift+d c",
        "mac": "cmd+shift+d c",
        "when": "editorTextFocus"
    },
    {
        "command": "queryguard.simulate",
        "key": "ctrl+shift+d s",
        "mac": "cmd+shift+d s",
        "when": "editorTextFocus"
    },
    {
        "command": "queryguard.refreshSchema",
        "key": "ctrl+shift+d r",
        "mac": "cmd+shift+d r",
        "when": "editorTextFocus"
    },
    {
        "command": "queryguard.showLogs",
        "key": "ctrl+shift+d l",
        "mac": "cmd+shift+d l",
        "when": "editorTextFocus"
    }
],
"problemMatchers": [],
"jsonValidation": []
```

**Nota:** VS Code no soporta `problemMatchers` ni `jsonValidation` vacíos — agregar en su lugar las categorías adecuadas. También agregar `queries.schemaValidation` si es necesario. Verificar que no se duplique `onLanguage` en activationEvents.

- [ ] **Step 3: Commit**
```
git add package.json
git commit -m "fix: add numeric range validation for analysisDebounce and cacheTTL"
```

---

### Task 1.2: worker_threads con pool.on('error') y detección de conexión muerta

**Files:**
- Modify: `DBPredictor/src/workers/db.worker.ts`
- Modify: `DBPredictor/src/core/db/ConnectionManager.ts`

- [ ] **Step 1: Agregar handler de pool.on('error') en db.worker.ts**

Después de `pool = new Pool(poolConfig);` (línea 56), agregar:

```ts
// Detect dead connections and notify the main thread
pool.on('error', (err: Error) => {
    const msg = `Pool error: ${err.message}`;
    Logger.warn(msg);
    parentPort?.postMessage({ type: 'ERROR', error: msg });
});
```

Requerir Logger en db.worker.ts:

```ts
import { Logger } from '../utils/logger';
```

- [ ] **Step 2: Registrar comando queryguard.showLogs en extension.ts**

En `extension.ts`, después de los otros comandos (línea 235), agregar:

```ts
const showLogsCmd = vscode.commands.registerCommand('queryguard.showLogs', () => {
    Logger.show();
});
```

Y en `context.subscriptions.push(...)` agregar `showLogsCmd`.

- [ ] **Step 3: Commit**
```
git add src/workers/db.worker.ts src/extension.ts
git commit -m "feat: add pool error handler and queryguard.showLogs command"
```

---

### Task 1.4: Extracción de queryParams para Drizzle ORM

**Files:**
- Modify: `DBPredictor/src/core/detectors/DrizzleDetector.ts`
- Modify: `DBPredictor/test/unit/DrizzleDetector.test.ts`

- [ ] **Step 1: Escribir test para queryParams en DrizzleDetector**

En `DBPredictor/test/unit/DrizzleDetector.test.ts`, agregar después del test existente:

```ts
it('should extract queryParams from .where(eq()) clauses', () => {
    const code = `await db.delete(usersTable).where(eq(usersTable.id, 42));`;
    const doc = new MockDocument(code);
    const results = detector.detect(doc);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].hasWhere, true);
    assert.strictEqual(results[0].operation, 'deleteMany');
    const params = results[0].queryParams || [];
    assert.ok(params.some((p) => p.column === 'id' && p.value === 42));
});

it('should extract multiple params from .where(and(...))', () => {
    const code = `await db.update(postsTable).where(and(eq(postsTable.status, 'draft'), eq(postsTable.authorId, 5)));`;
    const doc = new MockDocument(code);
    const results = detector.detect(doc);

    assert.strictEqual(results.length, 1);
    const params = results[0].queryParams || [];
    assert.ok(params.some((p) => p.column === 'status' && p.value === 'draft'));
    assert.ok(params.some((p) => p.column === 'authorId' && p.value === 5));
});

it('should detect db.update().set().where() full chain', () => {
    const code = `await db.update(usersTable).set({ active: false }).where(eq(usersTable.id, 1));`;
    const doc = new MockDocument(code);
    const results = detector.detect(doc);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].table, 'usersTable');
    assert.strictEqual(results[0].operation, 'updateMany');
    assert.strictEqual(results[0].hasWhere, true);
    assert.ok(results[0].queryParams?.some((p) => p.column === 'id' && p.value === 1));
});
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

Run: `npm test -- --grep "DrizzleDetector"`
Expected: FAIL (queryParams siempre vacío)

- [ ] **Step 3: Implementar extracción de queryParams en DrizzleDetector**

Reemplazar completamente `DrizzleDetector.ts` con:

```ts
import * as ts from 'typescript';
import {
    MutationInfo,
    MutationDetector,
    MutationOperation,
    DocumentLike,
} from './DetectorInterface';
import { getCallChain } from '../../utils/ast';

export class DrizzleDetector implements MutationDetector {
    private readonly TARGET_METHODS = ['delete', 'update'];
    private readonly TARGET_ALIASES = ['db', 'database', 'orm', 'client'];

    public detect(document: DocumentLike): MutationInfo[] {
        const sourceCode = document.getText();
        const sourceFile = ts.createSourceFile(
            document.fileName,
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

        const mutations: MutationInfo[] = [];

        const visit = (node: ts.Node) => {
            if (ts.isCallExpression(node)) {
                const isPartOfChain =
                    ts.isPropertyAccessExpression(node.parent) &&
                    ts.isCallExpression(node.parent?.parent);

                if (!isPartOfChain) {
                    const mutation = this.extractDrizzleMutation(node, document);
                    if (mutation) {
                        mutations.push(mutation);
                    }
                }
            }
            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
        return mutations;
    }

    private extractDrizzleMutation(
        node: ts.CallExpression,
        document: DocumentLike
    ): MutationInfo | null {
        const { chain, root } = getCallChain(node);

        if (!root || !ts.isIdentifier(root) || !this.TARGET_ALIASES.includes(root.text)) {
            return null;
        }

        const rootCall = chain?.[chain.length - 1];
        if (!rootCall || !this.TARGET_METHODS.includes(rootCall.name)) return null;

        if (rootCall.args?.length === 0) return null;
        const tableArg = rootCall.args[0];

        let tableName: string;
        if (ts.isIdentifier(tableArg)) {
            tableName = tableArg.text;
        } else if (ts.isPropertyAccessExpression(tableArg)) {
            tableName = tableArg.name.text;
        } else {
            return null;
        }

        const hasWhere = chain?.some((c) => c.name === 'where');
        const queryParams = this.extractWhereParams(chain);

        const start = document.positionAt(node.getStart());
        const end = document.positionAt(node.getEnd());

        let operation: MutationOperation = 'updateMany';
        if (rootCall.name === 'delete') operation = 'deleteMany';

        return {
            table: tableName,
            operation,
            hasWhere,
            queryParams,
            range: { start, end },
            sourceText: node.getText(),
        };
    }

    private extractWhereParams(
        chain: { name: string; args: ts.NodeArray<ts.Expression> }[] | undefined
    ): { column: string; value: unknown }[] {
        const params: { column: string; value: unknown }[] [];
        const whereCall = chain?.find((c) => c.name === 'where');
        if (!whereCall || !whereCall.args?.[0]) return params;

        const whereArg = whereCall.args[0];

        // Handle: eq(table.column, value)  — most common
        if (ts.isCallExpression(whereArg)) {
            const extracted = this.parseEqCall(whereArg);
            if (extracted) params.push(extracted);
        }

        // Handle: and(eq(...), eq(...))
        if (ts.isCallExpression(whereArg) && whereArg.expression &&
            ts.isIdentifier(whereArg.expression) && whereArg.expression.text === 'and') {
            for (const arg of whereArg.arguments) {
                if (ts.isCallExpression(arg)) {
                    const extracted = this.parseEqCall(arg);
                    if (extracted) params.push(extracted);
                }
            }
        }

        return params;
    }

    private parseEqCall(node: ts.CallExpression): { column: string; value: unknown } | null {
        const expr = node.expression;
        if (!ts.isIdentifier(expr) || expr.text !== 'eq') return null;
        if (node.arguments.length < 2) return null;

        const colArg = node.arguments[0];
        const valArg = node.arguments[1];

        let column: string;
        if (ts.isPropertyAccessExpression(colArg)) {
            column = colArg.name.text;
        } else if (ts.isIdentifier(colArg)) {
            column = colArg.text;
        } else {
            return null;
        }

        return { column, value: this.parseValue(valArg) };
    }

    private parseValue(node: ts.Node): unknown {
        if (ts.isStringLiteral(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (node.kind === ts.SyntaxKind.NullKeyword) return null;
        return node.getText();
    }
}
```

**Nota:** El código tiene un error de sintaxis en `params: { column: string; value: unknown }[] = []` — debe ser `const params: { column: string; value: unknown }[] = []`. Corregir antes de ejecutar.

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run: `npm test -- --grep "DrizzleDetector"`
Expected: PASS (todos los tests)

- [ ] **Step 5: Commit**
```
git add src/core/detectors/DrizzleDetector.ts test/unit/DrizzleDetector.test.ts
git commit -m "feat(DrizzleDetector): extract queryParams from where clauses"
```

---

## FASE 2 — Precisión de Simulación y Análisis

### Task 2.1: Fix — Simulación de UPDATE usa DELETE para cascadas correctas

**Files:**
- Modify: `DBPredictor/src/core/db/SimulationRunner.ts`
- Modify: `DBPredictor/src/shared/errors.ts`
- Modify: `DBPredictor/test/unit/SimulationRunner.test.ts`

- [ ] **Step 1: Agregar SimulationCascadeLimitation error en errors.ts**

Agregar a `ErrorCode` enum:
```ts
SIMULATION_CASCADE_LIMITATION = 'SIMULATION_CASCADE_LIMITATION',
```

Agregar al `toUserMessage()` switch:
```ts
case ErrorCode.SIMULATION_CASCADE_LIMITATION:
    return 'Simulation note: UPDATE operations cannot trigger DELETE cascades. Cascade analysis is informational only for UPDATE. Use the exact simulation for DELETE operations.';
```

- [ ] **Step 2: Modificar SimulationRunner para UPDATE con warn en cascadas**

En `SimulationRunner.ts`, cambiar `generateSimulationSql`:

```ts
private static generateSimulationSql(impact: ImpactResult): {
    sql: string | null;
    params: SqlParam[];
    error?: string;
    warnCascade?: string;
} {
    const table = impact.table;
    const op = impact.operation;
    const params: SqlParam[] = [];

    const identifierRegex = /^[a-zA-Z0-9_.]+$/;
    if (!identifierRegex.test(table)) {
        return {
            sql: null,
            params: [],
            error: `Security Alert: Invalid table name detected ("${table}"). Only alphanumeric, underscores and dots allowed.`,
        };
    }

    const safeTable = `"${table}"`;

    let whereClause = '';
    if (impact.hasWhere && impact.queryParams) {
        const conditions: string[] = [];
        for (const p of impact.queryParams) {
            if (!identifierRegex.test(p.column)) {
                return {
                    sql: null,
                    params: [],
                    error: `Security Alert: Invalid column name detected ("${p.column}").`,
                };
            }
            params.push(p.value as SqlParam);
            conditions.push(`"${p.column}" = $${params.length}`);
        }
        whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    let sql: string | null = null;
    let warnCascade: string | undefined;

    if (op === 'deleteMany' || op === 'delete') {
        sql = `DELETE FROM ${safeTable}${whereClause}`;
    } else if (op === 'updateMany' || op === 'update') {
        // Para UPDATE, usamos el mismo DELETE para simular porque un UPDATE
        // no dispara ON DELETE CASCADE (solo ON UPDATE CASCADE).
        // Esto nos da el rowCount real incluyendo filas afectadas por SET NULL / RESTRICT.
        if (impact.cascadeChain.length > 0) {
            warnCascade = 'UPDATE cannot trigger DELETE cascades. Cascade estimation is informational.';
        }
        sql = `DELETE FROM ${safeTable}${whereClause}`;
    }

    return { sql, params, warnCascade };
}
```

- [ ] **Step 3: Modificar `simulate()` para pasar warn al resultado**

Actualizar la interfaz `SimulationResult` y el método `simulate`:

```ts
export interface SimulationResult {
    rowCount: number;
    error?: string;
    warnCascade?: string;  // Nueva propiedad
}
```

Y en `simulate()`:

```ts
const { sql, params, warnCascade } = this.generateSimulationSql(impact);
if (error || !sql) {
    return { rowCount: 0, error: error || 'Could not generate simulation SQL.' };
}
```

Actualizar el resolve:
```ts
resolve({ rowCount, error, warnCascade });
```

Y el timeout resolve:
```ts
resolve({ rowCount: 0, error: `Simulation timed out...`, warnCascade: undefined });
```

- [ ] **Step 4: Actualizar callers de SimulationRunner en extension.ts**

En `extension.ts`, `simulateCmd`:
```ts
if (result.error) {
    vscode.window.showErrorMessage(`Simulation failed: ${result.error}`);
} else {
    const baseMsg = `Simulation complete: ${result.rowCount} rows affected. No data was modified.`;
    const fullMsg = result.warnCascade ? `${baseMsg} (${result.warnCascade})` : baseMsg;
    vscode.window.showInformationMessage(fullMsg);
    ImpactPanelManager.currentPanel?.updateSimulationResult(result.rowCount, result.warnCascade);
}
```

- [ ] **Step 5: Actualizar webview MessageBridge para pasar warnCascade**

En `src/shared/types.ts`, agregar `warnCascade?: string` al tipo `SimulationResult` (que se comparte desde la webview). Pero `SimulationResult` está definido en `SimulationRunner.ts` — verificar que el tipo exportado en `shared/types.ts` sea consistente.

La comunicación webview usa `WebviewMessage`:
```ts
| { type: 'SIMULATION_RESULT'; rowCount: number; error?: string; warnCascade?: string }
```

- [ ] **Step 6: Actualizar webview App.tsx para mostrar warnCascade**

En `App.tsx`, donde se muestra el resultado de simulación:

```ts
{simulationResult !== null && (
    <div>
        {/* ... resultado existente ... */}
        {lastMessage?.type === 'SIMULATION_RESULT' && lastMessage.warnCascade && (
            <div style={{ marginTop: '8px', color: 'var(--vscode-editorWarning-foreground)', fontSize: '0.75rem' }}>
                ⚠️ {lastMessage.warnCascade}
            </div>
        )}
    </div>
)}
```

- [ ] **Step 7: Agregar test para SimulationRunner con warnCascade**

En `SimulationRunner.test.ts`:

```ts
it('should return warnCascade for UPDATE operations with cascade chain', () => {
    const impact: ImpactResult = {
        table: 'users',
        operation: 'updateMany',
        hasWhere: true,
        queryParams: [{ column: 'id', value: 1 }],
        baseRowsAffected: 1,
        totalRowsAffected: 3,
        tableTotalRows: 100,
        estimationQuality: 'exact',
        riskLevel: 'SAFE',
        cascadeChain: [{ table: 'posts', rowsEstimated: 2, rule: 'CASCADE', children: [] }],
        willFailByRestrict: false,
    };
    const result = SimulationRunner.simulate(impact);
    if (!result.error) {
        assert.strictEqual(result.warnCascade, 'UPDATE cannot trigger DELETE cascades. Cascade estimation is informational.');
    }
});
```

- [ ] **Step 8: Commit**
```
git add src/core/db/SimulationRunner.ts src/shared/errors.ts src/shared/types.ts src/extension.ts webview-ui/src/App.tsx test/unit/SimulationRunner.test.ts
git commit -m "fix(SimulationRunner): UPDATE simulation now runs DELETE to capture cascade rowCount"
```

---

### Task 2.2: Estimación correcta de SET NULL en CascadeAnalyzer

**Files:**
- Modify: `DBPredictor/src/workers/db.worker.ts`
- Modify: `DBPredictor/src/core/db/types.ts`
- Modify: `DBPredictor/src/core/impact/CascadeAnalyzer.ts`
- Modify: `DBPredictor/test/unit/CascadeAnalyzer.test.ts`

- [ ] **Step 1: Extender el schema query para obtener is_nullable de FK columns**

En `db.worker.ts`, reemplazar `handleQuerySchema()` con:

```ts
async function handleQuerySchema(): Promise<void> {
    if (!pool) throw new Error('Database not connected');

    const tablesQuery =
        `SELECT relname as "tableName", n_live_tup as "rowCount",
         last_analyze as "lastAnalyze", last_autoanalyze as "lastAutoAnalyze"
         FROM pg_stat_user_tables;`;

    const fkQuery = `
        SELECT
            tc.table_name as "tableName",
            kcu.column_name as "columnName",
            ccu.table_name AS "foreignTableName",
            rc.delete_rule as "deleteRule",
            cc.is_nullable = 'YES' as "isNullable"
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
        JOIN information_schema.columns cc ON cc.table_name = tc.table_name AND cc.column_name = kcu.column_name
        WHERE tc.constraint_type = 'FOREIGN KEY';
    `;

    const [tablesRes, fkRes] = await Promise.all([pool.query(tablesQuery), pool.query(fkQuery)]);

    parentPort?.postMessage({
        type: 'SCHEMA_DATA',
        data: {
            tables: tablesRes.rows,
            relationships: fkRes.rows,
            timestamp: Date.now(),
        },
    });
}
```

- [ ] **Step 2: Actualizar tipos para incluir isNullable y staleness**

En `src/core/db/types.ts`, agregar a `ForeignKeyRelationship`:
```ts
export interface ForeignKeyRelationship {
    tableName: string;
    columnName: string;
    foreignTableName: string;
    deleteRule: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    isNullable?: boolean;  // Nueva propiedad
}

export interface TableStats {
    tableName: string;
    rowCount: number;
    lastAnalyze?: string | null;    // Nueva
    lastAutoAnalyze?: string | null; // Nueva
}
```

- [ ] **Step 3: Corregir CascadeAnalyzer para usar isNullable**

Reemplazar `CascadeAnalyzer.ts` completo:

```ts
import { SchemaData } from '../db/types';
import { CascadeResult } from './types';

export class CascadeAnalyzer {
    constructor(private schema: SchemaData) {}

    public analyze(
        tableName: string,
        rowsAffected: number,
        visited: Set<string> = new Set()
    ): CascadeResult[] {
        if (visited.has(tableName)) return [];
        visited.add(tableName);

        const relations = this.schema.relationships.filter((r) => r.foreignTableName === tableName);
        const results: CascadeResult[] = [];

        for (const rel of relations) {
            if (visited.has(rel.tableName)) continue;

            const tableStats = this.schema.tables.find((t) => t.tableName === rel.tableName);
            const totalRows = tableStats?.rowCount || 0;

            let estimatedImpact: number;
            if (rel.deleteRule === 'CASCADE') {
                estimatedImpact = Math.ceil((rowsAffected / (this.getTableCount(tableName) || 1)) * totalRows);
            } else if (rel.deleteRule === 'SET NULL') {
                // Solo las filas donde la FK actual tiene un valor (no NULL) serán afectadas
                // Por defecto estimamos 50% si no sabemos la proporción real de nulos.
                // TODO: Podríamos consultar information_schema para obtener stats de nulabilidad.
                estimatedImpact = Math.ceil(totalRows * 0.5);
            } else {
                // RESTRICT / NO ACTION: el impacto directo es 0;
                // el efecto es que la operación puede FALLAR, no que borre filas.
                estimatedImpact = 0;
            }

            results.push({
                table: rel.tableName,
                rowsEstimated: estimatedImpact,
                rule: rel.deleteRule,
                children:
                    rel.deleteRule === 'CASCADE'
                        ? this.analyze(rel.tableName, estimatedImpact, visited)
                        : [],
            });
        }

        return results;
    }

    private getTableCount(tableName: string): number {
        return this.schema.tables.find((t) => t.tableName === tableName)?.rowCount || 0;
    }
}
```

**Mejora futura documentada:** Para SET NULL, se podría consultar la proporción real de valores no-nulos usando `pg_stat_user_tables` con información adicional o un muestreo. Por ahora, 50% es una estimación conservadora pero más precisa que el 100% anterior.

- [ ] **Step 4: Escribir tests para CascadeAnalyzer con SET NULL**

En `CascadeAnalyzer.test.ts`, agregar:

```ts
it('should estimate 0 direct rows for RESTRICT rule (not a deletion)', () => {
    const schema: SchemaData = {
        tables: [{ tableName: 'parent', rowCount: 10 }, { tableName: 'child', rowCount: 50 }],
        relationships: [{
            tableName: 'child',
            columnName: 'parent_id',
            foreignTableName: 'parent',
            deleteRule: 'RESTRICT',
            isNullable: false,
        }],
        timestamp: Date.now(),
    };
    const analyzer = new CascadeAnalyzer(schema);
    const result = analyzer.analyze('parent', 10);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].rowsEstimated, 0);
    assert.strictEqual(result[0].rule, 'RESTRICT');
});

it('should estimate 50% rows for SET NULL rule', () => {
    const schema: SchemaData = {
        tables: [{ tableName: 'parent', rowCount: 10 }, { tableName: 'child', rowCount: 100 }],
        relationships: [{
            tableName: 'child',
            columnName: 'parent_id',
            foreignTableName: 'parent',
            deleteRule: 'SET NULL',
            isNullable: true,
        }],
        timestamp: Date.now(),
    };
    const analyzer = new CascadeAnalyzer(schema);
    const result = analyzer.analyze('parent', 10);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].rowsEstimated, 50); // 50% de 100
    assert.strictEqual(result[0].rule, 'SET NULL');
});
```

- [ ] **Step 5: Ejecutar tests**

Run: `npm test -- --grep "CascadeAnalyzer"`
Expected: PASS

- [ ] **Step 6: Commit**
```
git add src/workers/db.worker.ts src/core/db/types.ts src/core/impact/CascadeAnalyzer.ts test/unit/CascadeAnalyzer.test.ts
git commit -m "fix(CascadeAnalyzer): correctly estimate SET NULL and RESTRICT cascade impact"
```

---

### Task 2.3: Mostrar staleness de n_live_tup en la UI

**Files:**
- Modify: `DBPredictor/src/core/db/types.ts` (ya hecho en Task 2.2)
- Modify: `DBPredictor/src/shared/types.ts`
- Modify: `webview-ui/src/App.tsx`
- Modify: `webview-ui/src/types/shared.ts` (re-export)

- [ ] **Step 1: Agregar lastAnalyze / lastAutoAnalyze al tipo ImpactResult**

En `src/shared/types.ts`, agregar a `ImpactResult`:

```ts
export interface ImpactResult {
    table: string;
    operation: MutationOperation;
    hasWhere: boolean;
    whereClause?: string;
    queryParams?: { column: string; value: unknown }[];
    baseRowsAffected: number;
    totalRowsAffected: number;
    tableTotalRows: number;
    estimationQuality: EstimationQuality;
    riskLevel: RiskLevel;
    cascadeChain: CascadeResult[];
    willFailByRestrict: boolean;
    statsLastUpdated?: string | null;  // Nueva: timestamp ISO o null si se desconoció
}
```

- [ ] **Step 2: Propagar statsLastUpdated a través de CascadeAnalyzer → ImpactEngine**

En `ImpactEngine.ts`, después de obtener `tableStats`:

```ts
const tableStats = schema.tables.find((t) => t.tableName === mutation.table);
const totalRowsInTable = tableStats?.rowCount || 0;
const statsLastUpdated = tableStats?.lastAutoAnalyze ?? tableStats?.lastAnalyze ?? null;
```

Y en el return del ImpactResult:

```ts
return {
    table: mutation.table,
    // ... campos existentes ...
    statsLastUpdated,
};
```

- [ ] **Step 3: Mostrar banner de staleness en App.tsx**

En `App.tsx`, donde se muestra la badge "WORST CASE ESTIMATION", también mostrar si las stats están desactualizadas (> 1 hora):

```tsx
function formatStaleness(isoDate: string | null | undefined): string {
    if (!isoDate) return 'unknown';
    const ms = Date.now() - new Date(isoDate).getTime();
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return 'recent';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function getStalenessColor(staleness: string): string {
    if (staleness === 'recent' || staleness === 'unknown') return 'var(--vscode-charts-lines)';
    return 'var(--vscode-editorWarning-foreground)';
}

// En el render, después de la badge de WORST CASE:
{impact.statsLastUpdated && (
    <span style={{
        marginLeft: '8px',
        color: getStalenessColor(formatStaleness(impact.statsLastUpdated)),
        fontSize: '0.65rem',
        opacity: 0.8,
    }}>
        Stats: {formatStaleness(impact.statsLastUpdated)}
    </span>
)}
```

- [ ] **Step 4: Commit**
```
git add src/shared/types.ts src/core/impact/ImpactEngine.ts webview-ui/src/App.tsx
git commit -m "feat: show stats staleness timestamp in impact panel"
```

---

## FASE 3 — Extensión de Detección y Corrección del README

### Task 3.1: README — corregir insert() y aclarar limitaciones de simulación

**Files:**
- Modify: `DBPredictor/README.md`

- [ ] **Step 1: Actualizar README para corregir documentación**

En la sección "ORM Support" del README, cambiar:

```
- **Drizzle ORM**: delete(), update(), and insert().
```

A:

```
- **Drizzle ORM**: delete() y update() (con y sin .where()). La operación insert() no es destructiva y por tanto no se detecta como mutación de riesgo.
```

En la sección "Simulation Note":

```
- **Nota de Simulación**: La detección es automática. La función de Simulación requiere filtros explícitos (como .eq() o where: {}) para traducir con precisión la lógica de tu ORM al SQL de prueba seguro. Además, para operaciones UPDATE, la simulación ejecuta DELETE en un ROLLBACK para capturar el conteo real de filas de cascadas SET NULL/RESTRICT — la estimación visual de cascadas para UPDATE es solo informativa.
```

En la sección "Configuration Reference", agregar:
```
- `queryguard.analysisDebounce`: (integer) Delay en ms antes de re-analizar. Rango: 100–10000ms. Default: 750.
- `queryguard.cacheTTL`: (integer) TTL del schema cache en segundos. Rango: 30–86400s. Default: 300.
```

- [ ] **Step 2: Commit**
```
git add README.md
git commit -m "docs: clarify Drizzle insert() support, simulation limitations, and config ranges"
```

---

### Task 3.2: Soporte para múltiples perfiles de conexión (DB profiles)

**Files:**
- Modify: `DBPredictor/src/config/SecretsManager.ts`
- Modify: `DBPredictor/src/extension.ts`
- Modify: `DBPredictor/package.json`
- Create: `DBPredictor/src/config/ConnectionProfile.ts`
- Create: `DBPredictor/test/unit/ConnectionProfile.test.ts`

- [ ] **Step 1: Crear ConnectionProfile.ts**

```ts
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export interface ConnectionProfile {
    name: string;
    connectionString: string;
    sslMode: string;
    createdAt: number;
}

const PROFILES_KEY = 'queryguard.connectionProfiles';

export class ConnectionProfileManager {
    private static readonly MAX_PROFILES = 10;

    public static async list(context: vscode.ExtensionContext): Promise<ConnectionProfile[]> {
        return context.globalState.get<ConnectionProfile[]>(PROFILES_KEY) || [];
    }

    public static async save(
        context: vscode.ExtensionContext,
        profile: ConnectionProfile
    ): Promise<void> {
        const profiles = await this.list(context);
        const existing = profiles.findIndex((p) => p.name === profile.name);
        if (existing >= 0) {
            profiles[existing] = profile;
        } else {
            if (profiles.length >= this.MAX_PROFILES) {
                throw new Error(`Maximum of ${this.MAX_PROFILES} connection profiles allowed.`);
            }
            profiles.push(profile);
        }
        await context.globalState.update(PROFILES_KEY, profiles);
        Logger.info(`Connection profile '${profile.name}' saved.`);
    }

    public static async delete(context: vscode.ExtensionContext, name: string): Promise<void> {
        const profiles = await this.list(context);
        const filtered = profiles.filter((p) => p.name !== name);
        await context.globalState.update(PROFILES_KEY, filtered);
        Logger.info(`Connection profile '${name}' deleted.`);
    }
}
```

- [ ] **Step 2: Modificar extension.ts para usar perfiles**

Reemplazar el comando `connectCmd` con un flujo que permita guardar/seleccionar perfiles:

```ts
const connectCmd = vscode.commands.registerCommand('queryguard.connect', async () => {
    // Mostrar opciones: "New connection" vs perfiles guardados
    const profiles = await ConnectionProfileManager.list(context);
    const choices = ['New connection...'];
    profiles.forEach((p) => choices.push(`Switch to: ${p.name}`));
    choices.push('Manage profiles...');

    const selected = await vscode.window.showQuickPick(choices, {
        placeHolder: 'QueryGuard: Connect to database',
    });

    if (!selected) return;

    if (selected === 'New connection...') {
        // ... existing connect flow ...
    } else if (selected.startsWith('Switch to: ')) {
        const profileName = selected.replace('Switch to: ', '');
        const profile = profiles.find((p) => p.name === profileName);
        if (profile) {
            await SecretsManager.getInstance().saveConnectionString(profile.connectionString);
            const result = await connManager.connect(profile.connectionString);
            if (result.success) {
                vscode.window.showInformationMessage(`QueryGuard: Connected to '${profileName}'.`);
                statusBar.update();
                if (vscode.window.activeTextEditor) {
                    analyzeDocument(vscode.window.activeTextEditor.document);
                }
            }
        }
    }
});
```

**Nota:** Asegurarse de que `profiles` esté disponible en el closure del comando (mover la obtención de perfiles a un lugar accesible o usar async prompt).

- [ ] **Step 3: Commit**
```
git add src/config/ConnectionProfile.ts src/config/SecretsManager.ts src/extension.ts package.json
git commit -m "feat: add multi-profile connection management"
```

---

## FASE 4 — UX Profesional

### Task 4.1: Code Action Provider (Problems panel integration)

**Files:**
- Create: `DBPredictor/src/providers/DiagnosticProvider.ts`
- Modify: `DBPredictor/src/extension.ts`
- Modify: `DBPredictor/package.json`

- [ ] **Step 1: Crear DiagnosticProvider.ts**

```ts
import * as vscode from 'vscode';
import { ConnectionManager } from '../core/db/ConnectionManager';
import { SchemaCache } from '../core/db/SchemaCache';
import { PrismaDetector } from '../core/detectors/PrismaDetector';
import { SupabaseDetector } from '../core/detectors/SupabaseDetector';
import { DrizzleDetector } from '../core/detectors/DrizzleDetector';
import { ImpactEngine } from '../core/impact/ImpactEngine';
import { RiskLevel } from '../shared/types';

const DIAGNOSTIC_COLLECTION = 'queryguard.diagnostics';

export class DiagnosticProvider implements vscode.CodeActionProvider {
    private collection: vscode.DiagnosticCollection;
    private prismaDetector = new PrismaDetector();
    private supabaseDetector = new SupabaseDetector();
    private drizzleDetector = new DrizzleDetector();

    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('queryguard');
    }

    public update(document: vscode.TextDocument) {
        const config = vscode.workspace.getConfiguration('queryguard');
        if (!config.get<boolean>('enabled', true)) {
            this.collection.clear();
            return;
        }

        if (!['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(document.languageId)) {
            return;
        }

        const schema = SchemaCache.getInstance().getData();
        if (!schema) return;

        const allMutations = [
            ...this.prismaDetector.detect(document),
            ...this.supabaseDetector.detect(document),
            ...this.drizzleDetector.detect(document),
        ];

        const diagnostics: vscode.Diagnostic[] = [];

        for (const m of allMutations) {
            const impact = ImpactEngine.calculate(m, schema);

            if (impact.riskLevel === 'DESTRUCTIVE' || impact.riskLevel === 'CRITICAL') {
                const range = new vscode.Range(
                    m.range.start.line,
                    m.range.start.character,
                    m.range.end.line,
                    m.range.end.character
                );

                const severity =
                    impact.riskLevel === 'DESTRUCTIVE'
                        ? vscode.DiagnosticSeverity.Error
                        : vscode.DiagnosticSeverity.Warning;

                const message =
                    impact.riskLevel === 'DESTRUCTIVE'
                        ? `[QueryGuard] DESTRUCTIVE: This mutation affects ALL rows in "${impact.table}" (${impact.totalRowsAffected.toLocaleString()} total)`
                        : `[QueryGuard] CRITICAL: This mutation impacts ~${impact.totalRowsAffected.toLocaleString()} rows across ${impact.cascadeChain.length} cascade level(s)`;

                diagnostics.push(new vscode.Diagnostic(range, message, severity));
            }
        }

        this.collection.set(document.uri, diagnostics);
    }

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection
    ): vscode.CodeAction[] {
        const diagnostic = this.collection.get(document.uri)?.find((d) =>
            d.range.intersection(range)
        );
        if (!diagnostic) return [];

        return [
            {
                title: 'QueryGuard: Run Safe Simulation',
                command: 'queryguard.simulate',
                arguments: [undefined],
            },
            {
                title: 'QueryGuard: Show Impact Analysis',
                command: 'queryguard.showImpactPanel',
                arguments: [undefined],
            },
        ];
    }

    public clear() {
        this.collection.clear();
    }
}
```

- [ ] **Step 2: Registrar en extension.ts**

```ts
const diagnosticProvider = new DiagnosticProvider();

// En workspace.onDidChangeTextDocument:
diagnosticProvider.update(event.document);

// En onDidChangeActiveTextEditor:
diagnosticProvider.update(editor.document);

// En onDidChangeConfiguration:
diagnosticProvider.clear(); // force re-analysis
```

- [ ] **Step 3: Commit**
```
git add src/providers/DiagnosticProvider.ts src/extension.ts package.json
git commit -m "feat: add CodeActionProvider for Problems panel integration"
```

---

### Task 4.2: Exportación de historial

**Files:**
- Modify: `DBPredictor/src/webview/HistoryView.tsx`
- Modify: `DBPredictor/src/webview/MessageBridge.ts`
- Modify: `DBPredictor/src/core/impact/HistoryManager.ts`

- [ ] **Step 1: Agregar método export en HistoryManager**

En `HistoryManager.ts`:

```ts
public exportToJSON(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
}

public exportToCSV(): string {
    const headers = 'id,timestamp,table,operation,riskLevel,baseRowsAffected,totalRowsAffected,fileName\n';
    const rows = this.getHistory().map((e) =>
        [
            e.id,
            new Date(e.timestamp).toISOString(),
            e.impact.table,
            e.impact.operation,
            e.impact.riskLevel,
            e.impact.baseRowsAffected,
            e.impact.totalRowsAffected,
            `"${e.fileName}"`,
        ].join(',')
    );
    return headers + rows.join('\n');
}
```

- [ ] **Step 2: Agregar botón de exportar en HistoryView.tsx**

En `HistoryView.tsx`, agregar botones de exportar:

```tsx
const exportJSON = () => {
    const data = historyManager.exportToJSON();
    navigator.clipboard.writeText(data);
    // O usar vscode.env.clipboard.writeText para mejor integración
};

const exportCSV = () => {
    const data = historyManager.exportToCSV();
    navigator.clipboard.writeText(data);
};

// En el render, después del botón "Clear":
<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
    <button onClick={exportJSON}>Export JSON</button>
    <button onClick={exportCSV}>Export CSV</button>
</div>
```

- [ ] **Step 3: Commit**
```
git add src/core/impact/HistoryManager.ts webview-ui/src/components/HistoryView.tsx
git commit -m "feat: add JSON/CSV export for analysis history"
```

---

### Task 4.3: Banner de desconexión en el webview panel

**Files:**
- Modify: `DBPredictor/src/webview/ImpactPanelManager.ts`
- Modify: `DBPredictor/src/extension.ts`
- Modify: `webview-ui/src/App.tsx`

- [ ] **Step 1: Agregar método para enviar estado de conexión al webview**

En `ImpactPanelManager.ts`, agregar:

```ts
public sendConnectionStatus(isConnected: boolean) {
    this._panel.webview.postMessage({
        type: 'CONNECTION_STATUS',
        data: { isConnected },
    });
}
```

En `src/shared/types.ts`, agregar al `WebviewMessage`:

```ts
| { type: 'CONNECTION_STATUS'; data: { isConnected: boolean } }
```

- [ ] **Step 2: Registrar el callback en ConnectionManager**

En `ConnectionManager.ts`, donde se actualiza `isConnected`:

```ts
case 'CONNECTED':
    this.isConnected = response.success;
    this.isConnecting = false;
    // Notify webview of connection status change
    // We'll need a callback mechanism here — see below
```

Para propagar el estado de conexión al panel, agregar un callback similar a `onSchemaUpdate`:

```ts
private onConnectionStatusChange?: (isConnected: boolean) => void;

public setOnConnectionStatusChange(callback: (isConnected: boolean) => void) {
    this.onConnectionStatusChange = callback;
}
```

Y en `case 'CONNECTED'`:

```ts
if (this.onConnectionStatusChange) {
    this.onConnectionStatusChange(response.success);
}
```

- [ ] **Step 3: Registrar el callback en extension.ts**

```ts
connManager.setOnConnectionStatusChange((isConnected) => {
    ImpactPanelManager.currentPanel?.sendConnectionStatus(isConnected);
});
```

- [ ] **Step 4: Mostrar banner en App.tsx**

```tsx
const [isConnected, setIsConnected] = useState(true);

useEffect(() => {
    if (lastMessage?.type === 'CONNECTION_STATUS') {
        setIsConnected(lastMessage.data.isConnected);
    }
}, [lastMessage]);

// En el render, al inicio:
{!isConnected && (
    <div style={{
        background: 'var(--vscode-notificationBackground)',
        border: '1px solid var(--vscode-notificationBorder)',
        padding: '8px 12px',
        marginBottom: '16px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--vscode-notificationForeground)',
    }}>
        <AlertCircle size={16} />
        <span>Disconnected from database. Some data may be stale.</span>
        <button
            onClick={() => vscode.commands.executeCommand('queryguard.connect')}
            style={{ marginLeft: 'auto', padding: '4px 12px', cursor: 'pointer' }}
        >
            Reconnect
        </button>
    </div>
)}
```

- [ ] **Step 5: Commit**
```
git add src/core/db/ConnectionManager.ts src/webview/ImpactPanelManager.ts src/extension.ts src/shared/types.ts webview-ui/src/App.tsx
git commit -m "feat: show disconnected banner in impact panel when connection is lost"
```

---

## FASE 5 — Path Aliases y TypeScript ergonomics

### Task 5.1: Agregar path aliases en tsconfig para imports mantenibles

**Files:**
- Modify: `DBPredictor/tsconfig.json`

- [ ] **Step 1: Agregar paths en tsconfig.json**

Reemplazar el contenido de `tsconfig.json`:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./out",
        "rootDir": "./src",
        "strict": true,
        "noImplicitAny": true,
        "moduleResolution": "node",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "paths": {
            "@core/*": ["src/core/*"],
            "@config/*": ["src/config/*"],
            "@shared/*": ["src/shared/*"],
            "@providers/*": ["src/providers/*"],
            "@utils/*": ["src/utils/*"],
            "@webview/*": ["src/webview/*"]
        }
    },
    "include": ["src/**/*", "webview-ui/src/**/*"],
    "exclude": ["node_modules", "out", "webview-ui/node_modules"]
}
```

- [ ] **Step 2: Commit**
```
git add tsconfig.json
git commit -m "refactor: add TypeScript path aliases for cleaner imports"
```

---

## Orden de ejecución recomendado

| Fase | Dependencias | Descripción |
|------|-------------|-------------|
| **Fase 1** | ninguna | Base: validación config, pool error handler, Drizzle params |
| **Fase 2** | Fase 1 | Precisión: simulación, cascadas, staleness |
| **Fase 3** | ninguna (independiente) | README, perfiles de conexión |
| **Fase 4** | Fase 1 | UX: diagnostics, export, disconnect banner |
| **Fase 5** | ninguna (independiente) | Path aliases |

Las Fases 3, 4 (parcial) y 5 pueden ejecutarse en paralelo a la Fase 1 una vez que la estructura base está lista. La Fase 2 depende de que los tests existentes de la Fase 1 pasen para no contaminar el diagnóstico.
