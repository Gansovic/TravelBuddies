# TravelBuddies Principles Enforcement Hooks

This directory contains Claude hooks that automatically enforce the engineering principles defined in `principles.md`. The hooks validate code before editing (pre-hook) and before committing (post-hook) to ensure strict compliance with TravelBuddies engineering standards.

## Features

- **Pre-Hook Validation**: Validates files before creation/editing to prevent violations
- **Post-Hook Validation**: Validates staged files and commit messages before git commit
- **LEVER Framework Enforcement**: Validates all 5 LEVER principles automatically
- **Singleton Pattern Detection**: Ensures services implement proper singleton pattern
- **Security Validation**: Prevents PII logging and enforces input validation
- **Pattern Enforcement**: Blocks forbidden patterns and ensures required patterns
- **Auto-Fix Capabilities**: Automatically fixes common violations where possible
- **Test Coverage Validation**: Ensures new code has corresponding tests
- **Audit Logging Validation**: Validates value operations include audit logs

## Installation

1. **Install Dependencies**
   ```bash
   cd scripts/hooks
   npm install
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Configure Git Hooks**
   ```bash
   # Add to .git/hooks/pre-commit (make executable)
   #!/bin/bash
   cd scripts/hooks && npm run post-hook
   
   # For pre-editing validation, integrate with your editor or CI
   cd scripts/hooks && npm run pre-hook
   ```

## Usage

### Pre-Hook (Validate Before Editing)

```bash
# Validate specific files
npm run pre-hook -- --files src/services/trip.service.ts

# Validate all changed files
npm run pre-hook

# Validate with auto-fix
npm run pre-hook -- --fix

# Verbose output
npm run pre-hook -- --verbose --severity all
```

### Post-Hook (Validate Before Commit)

```bash
# Validate staged files and commit message
npm run post-hook

# Validate with specific commit message
npm run post-hook -- --commit-msg "feat: add new feature"

# Skip test coverage validation
npm run post-hook -- --skip-tests

# Lenient mode (warnings don't block commit)
npm run post-hook -- --mode lenient
```

## Configuration

Edit `config.json` to customize validation behavior:

```json
{
  "general": {
    "mode": "strict",           // "strict" or "lenient"
    "exitOnViolation": true,    // Block on violations
    "showViolationDetails": true,
    "colorOutput": true
  },
  "validation": {
    "lever": {
      "enabled": true,
      "severity": "error"       // "error", "warning", "info"
    },
    "technical": {
      "enabled": true,
      "rules": {
        "auditLogging": true,
        "errorHandling": true,
        "securityChecks": true
      }
    }
  }
}
```

## Validation Rules

### LEVER Framework

#### L - Leverage Existing Patterns
- ❌ **Direct Supabase Access**: `supabase.from()` outside service files
- ❌ **Custom Loading**: Custom spinners instead of `LoadingDialog`
- ❌ **Bypassing Services**: Direct function calls instead of service singletons
- ✅ **Required**: Use `ConfigService.getInstance()`, `EdgeFunctionsService.getInstance()`

#### E - Extend Before Creating
- ❌ **Parallel Implementations**: Custom pagination instead of extending `PaginatedDataProvider`
- ❌ **Duplicate Functionality**: Custom formatters instead of using `NumberFormatters`
- ✅ **Required**: Extend existing classes and interfaces

#### V - Verify Through Reactivity
- ❌ **Manual Polling**: `setInterval()` instead of TanStack Query
- ❌ **Manual State**: `useState` + `fetch` instead of `useQuery`
- ✅ **Required**: Use TanStack Query, Supabase realtime subscriptions

#### E - Eliminate Duplication
- ❌ **Hardcoded Values**: Timeout values, retry counts, config paths
- ❌ **Duplicate Strings**: Repeated string literals
- ✅ **Required**: Use `AppConstants`, `ConfigPaths`, centralized utilities

#### R - Reduce Complexity
- ❌ **Deep Nesting**: More than 6 levels of indentation
- ❌ **Multi-Purpose Functions**: Functions with >3 responsibilities
- ✅ **Required**: Single responsibility, early returns

### Technical Rules

#### Singleton Pattern (Services)
```typescript
// ✅ REQUIRED
class TripService {
  private static instance: TripService;
  private constructor() {}
  static getInstance(): TripService { ... }
}

// ❌ FORBIDDEN
class TripService {
  constructor() {} // Public constructor not allowed
}
```

#### Security Requirements
```typescript
// ❌ FORBIDDEN
console.log(`User ${user.email} logged in`); // PII logging
const distance = Number(userInput); // No validation

// ✅ REQUIRED  
console.log('User logged in'); // No PII
const distance = distanceSchema.parse(userInput); // Validated input
```

#### Audit Logging
```typescript
// ✅ REQUIRED for value operations
await supabase.from('audit_logs').insert({
  user_id: userId,
  action: 'TRIP_PROCESSED',
  metadata: { tripId, points }
});
```

## Forbidden Patterns

| Pattern | Message | Exceptions |
|---------|---------|------------|
| `supabase.from(` | Direct Supabase access forbidden | `*.service.ts`, `supabase/functions/**` |
| `supabase.functions.invoke(` | Use EdgeFunctionsService instead | `*EdgeFunctionsService*` |
| `<div className="spinner">` | Use LoadingDialog instead | None |
| `console.log(.*email` | PII logging forbidden | None |

## Auto-Fix Capabilities

The hooks can automatically fix common violations:

- Replace custom loading spinners with `LoadingSpinner`
- Replace hardcoded timeouts with `AppConstants.defaultTimeout`
- Add basic JSDoc documentation templates
- Fix simple formatting issues

## Integration Examples

### VS Code Integration

Add to `.vscode/tasks.json`:
```json
{
  "label": "Validate Principles",
  "type": "shell",
  "command": "cd scripts/hooks && npm run pre-hook -- --files ${file}",
  "group": "build"
}
```

### Husky Pre-Commit Hook

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "cd scripts/hooks && npm run post-hook"
    }
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/principles.yml
name: Validate Principles
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd scripts/hooks && npm install
      - name: Validate principles
        run: cd scripts/hooks && npm run pre-hook
```

## Troubleshooting

### Common Issues

1. **"Configuration file not found"**
   ```bash
   # Ensure you're running from the hooks directory
   cd scripts/hooks
   npm run pre-hook
   ```

2. **"Could not parse file"**
   - Check TypeScript syntax errors
   - Ensure file is valid TypeScript/JavaScript

3. **"Validation error"**
   - Run with `--verbose` flag for detailed output
   - Check `config.json` for correct file patterns

### Debug Mode

```bash
# Enable verbose logging
npm run pre-hook -- --verbose

# Check specific severity levels
npm run pre-hook -- --severity warning

# Test with specific files
npm run pre-hook -- --files src/test.ts
```

### Disable Temporarily

```bash
# Skip pre-commit validation
git commit --no-verify

# Disable specific validators in config.json
{
  "validation": {
    "lever": { "enabled": false }
  }
}
```

## Contributing

When adding new validation rules:

1. Add the rule to `src/lib/validators.ts`
2. Update `config.json` with new configuration options
3. Add tests for the new rule
4. Update this README with documentation
5. Ensure the rule follows LEVER principles itself

## Principle Violations

The hooks themselves follow TravelBuddies principles:

- **L**: Leverage existing TypeScript AST parsing
- **E**: Extend commander.js for CLI functionality  
- **V**: Verify through comprehensive validation pipeline
- **E**: Eliminate duplication with shared utility functions
- **R**: Reduce complexity with modular validator functions

Remember: **NO EXCEPTIONS. NO NEGOTIATIONS.** 🚫