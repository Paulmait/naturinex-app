# Dependency Audit Report - Naturinex

**Date:** February 25, 2026
**Tool:** `npm audit`

---

## Summary

| Package | Vulnerabilities | Fixable | Breaking Changes Required |
|---------|----------------|---------|--------------------------|
| Client (root) | 37 (2 critical, 16 high, 13 moderate, 6 low) | Partial | Yes (some) |
| Server | 11 (1 critical, 6 high, 4 moderate) | All | No |

---

## Client Package (naturinex-client)

### Critical

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `form-data` (via `quagga`) | Unsafe random for boundary | Replace `quagga` with `@ericblade/quagga2` |

### High

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `axios` 1.0-1.13.4 | DoS via `__proto__` in mergeConfig | `npm audit fix` |
| `elliptic` | Risky crypto implementation | `npm audit fix --force` (breaking) |
| `webpack` 5.49-5.104 | SSRF via buildHttp | `npm audit fix` |
| `tough-cookie` | Prototype pollution | `npm audit fix --force` (breaking) |
| Various via `quagga` | Multiple transitive vulnerabilities | Replace `quagga` |

### Moderate

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `ajv` | ReDoS with `$data` option | `npm audit fix --force` (breaking) |
| `bn.js` | Infinite loop | `npm audit fix` |
| `diff` | DoS in parsePatch | `npm audit fix` |
| `undici` | Unbounded decompression | `npm audit fix` |
| `webpack-dev-server` | Source code theft | `npm audit fix --force` (breaking) |

### Recommended Actions

1. **Run `npm audit fix`** - Fixes non-breaking vulnerabilities (axios, bn.js, diff, undici, webpack)
2. **Replace `quagga@0.12.1`** with `@ericblade/quagga2` - Unmaintained, source of critical vuln
3. **Plan `crypto-js@4.2.0` migration** - Known weak crypto library (already noted in dependabot.yml)
4. **Monitor `react-scripts`** - Bundled webpack/ajv vulns; consider migration to Vite

---

## Server Package (naturinex-server)

### Critical

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `cookie` | Accepts cookie name with `__proto__` | `npm audit fix` |

### High

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `qs` | arrayLimit bypass DoS | `npm audit fix` |
| `validator` | URL validation bypass | `npm audit fix` |
| `express-validator` | Depends on vulnerable validator | `npm audit fix` |

### Moderate

| Package | Vulnerability | Fix |
|---------|--------------|-----|
| `node-forge` | Various crypto issues | `npm audit fix` |
| `undici` | Unbounded decompression | `npm audit fix` |

### Recommended Actions

1. **Run `cd server && npm audit fix`** - All 11 vulnerabilities are fixable without breaking changes

---

## Outdated Packages to Review

| Package | Current | Concern |
|---------|---------|---------|
| `quagga@0.12.1` | Unmaintained | Replace with `@ericblade/quagga2` |
| `crypto-js@4.2.0` | Known weak | Plan migration to Web Crypto API |
| `react-scripts@5.0.1` | End of life | Consider Vite migration |
| `deno.land/std@0.168.0` | Very old | Update edge functions to latest stable |
| `stripe@12.18.0` (edge func) | Outdated | Update to latest in `stripe-webhook/index.ts` |

---

## Edge Function Dependencies

| Import | Current | Recommendation |
|--------|---------|----------------|
| `deno.land/std@0.168.0` | 0.168.0 | Update to latest stable |
| `esm.sh/stripe@12.18.0` | 12.18.0 | Update to latest (in stripe-webhook) |
| `esm.sh/stripe@13.5.0` | 13.5.0 | Update to latest (in create-checkout-session) |
| `esm.sh/stripe@13.10.0` | 13.10.0 | Update to latest (in api) |
| `esm.sh/@supabase/supabase-js@2` | Auto-latest v2 | OK |

---

## CI/CD Integration

Both GitHub Actions workflows now include `npm audit --audit-level=high` as a blocking step. This means:
- PRs with high or critical vulnerabilities will fail CI
- The team must either fix vulnerabilities or explicitly acknowledge them
