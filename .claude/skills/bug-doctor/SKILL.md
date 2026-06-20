---
name: bug-doctor
description: Auto-detect and fix system bugs. Use when the user asks to "check for bugs", "fix errors", "run a health check", "auto-fix issues", or any time you notice build failures, runtime errors, or git history showing recent breakages. Also use proactively in scheduled loops or cron jobs for continuous health monitoring.
---

# Bug Doctor

Automatically detect and fix bugs across the codebase by running a structured health check pipeline.

## Health Check Pipeline

Run these checks **in order**, stopping to fix each issue before proceeding:

### Step 1: TypeScript Type Check

```bash
npx tsc --noEmit --pretty 2>&1
```

If errors found:
- Read each erroring file, understand the root cause
- Fix type errors (missing imports, wrong types, unused vars)
- Re-run to confirm clean

### Step 2: Build Check

```bash
npx next build 2>&1
```

If build fails:
- Parse the error output for the specific failure (dead imports, missing deps, syntax errors)
- Fix and rebuild
- Common fixes: remove imports of deleted files, install missing packages, fix JSX syntax

### Step 3: Lint Check

```bash
npx eslint . 2>&1 | head -100
```

If lint errors found:
- Fix auto-fixable errors: `npx eslint . --fix`
- Review remaining errors and fix critical ones (unused vars, unreachable code)
- Skip stylistic warnings unless the user asks

### Step 4: Git Diff Review (Uncommitted Changes)

```bash
git diff HEAD --stat
git diff HEAD
```

Review uncommitted changes for:
- **Logic bugs**: wrong conditionals, off-by-one errors, missing null checks
- **Missing error handling**: bare `catch {}` blocks that swallow errors, missing try/catch around async calls
- **Security issues**: hardcoded secrets, API keys in client code, missing auth checks
- **React issues**: nested interactive elements (button inside button), missing keys in lists, incorrect hook usage

### Step 5: Recent Bug Pattern Scan

```bash
git log --oneline -20
```

Look at recent commits for patterns:
- Multiple "fix" commits in a row → likely an unstable area, review those files
- "debug" commits → debug code may still be in the codebase (console.log left in, test endpoints exposed)
- Reverts → the reverted change may have re-introduced an old bug

Check for leftover debug artifacts:
```bash
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" -l
grep -r "debug" src/app/api/ --include="*.ts" -l
```

### Step 6: Hydration Mismatch Scan

Search for common hydration mismatch sources:
```bash
grep -rn "typeof window" src/ --include="*.tsx"
grep -rn "useEffect.*localStorage" src/ --include="*.tsx"
grep -rn "framer-motion" src/ --include="*.tsx" -l
grep -rn "<button" src/ --include="*.tsx" | grep -i "button"
```

For each match:
- `typeof window` checks without hydration guards → wrap in `useEffect` or use `dynamic` import with `ssr: false`
- `localStorage` in component body → move to `useEffect`
- Nested `<button>` elements → restructure to avoid nesting
- `framer-motion` without lazy wrapper → use the project's `LazyMotion` wrapper

### Step 7: API Route Error Handling Scan

```bash
grep -rn "catch {" src/app/api/ --include="*.ts"
grep -rn "catch {}" src/app/api/ --include="*.ts"
```

Empty catch blocks in API routes silently swallow errors. Fix each one:
- Add `console.error('[RouteName] Error:', err)` at minimum
- For user-facing routes, return proper error responses: `NextResponse.json({ error: '描述' }, { status: 500 })`

### Step 8: Dependency Health

```bash
npx npm-check --no-emoji 2>&1 | head -30
```

Or manually check:
```bash
pnpm outdated 2>&1 | head -30
```

Report outdated critical dependencies (security patches especially). Do NOT auto-update — just flag them.

## Fix Protocol

When a bug is found, follow this protocol:

1. **Diagnose** — Read the error, find the root cause file, understand the context
2. **Fix minimally** — Make the smallest change that resolves the issue. Don't refactor surrounding code.
3. **Verify** — Re-run the check that found the bug to confirm the fix works
4. **Report** — Summarize what was found and fixed in this format:

## Report Format

After running all checks, output a summary:

```
## 🏥 Bug Doctor Report

### ✅ Fixed (N)
- **[check-name]**: `file:line` — what was wrong → what was fixed

### ⚠️ Flagged (N)
- **[check-name]**: `file:line` — issue description (needs manual review)

### ✨ Clean
- TypeScript: 0 errors
- Build: passed
- Lint: 0 errors
- Hydration: no issues found
```

## Important Guidelines

- **Don't over-fix.** Only fix things that are actual bugs or will cause failures. Don't refactor, don't add features, don't change working code.
- **Don't break things.** If a fix is risky or you're unsure, flag it instead of fixing it.
- **Respect .gitignore.** Don't scan node_modules, .next, or build output.
- **Be fast.** Run quick checks first (typecheck, lint), slow checks last (build, e2e).
- **Commit if fixes were made.** After fixing bugs, commit with message like `fix: auto-fix N issues found by bug-doctor`.
- **If no bugs found**, say so clearly — don't invent problems.
