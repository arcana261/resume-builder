# Test Coverage Improvement Plan

**Current Overall Coverage**: 57.7% statements, 48.69% branches, 65.88% functions
**Target**: 80%+ coverage across all modules

## Coverage Analysis Summary

| File | Statements | Branches | Functions | Lines | Status |
|------|------------|----------|-----------|-------|--------|
| src/database/db.ts | 5.71% | 0% | 0% | 5.88% | ❌ CRITICAL |
| src/database/schema.ts | 60% | 100% | 0% | 60% | ⚠️ LOW |
| src/scraper/core/Parser.ts | 40.54% | 17.72% | 50% | 40.57% | ❌ CRITICAL |
| src/utils/dateHelpers.ts | 57.14% | 46.66% | 33.33% | 57.14% | ⚠️ LOW |
| src/utils/logger.ts | 83.33% | 70% | 100% | 83.33% | ✅ GOOD |
| tests/mocks/MockPage.ts | 68.57% | 41.66% | 68.75% | 68.75% | ⚠️ MEDIUM |
| src/database/repositories/*.ts | 84.72% | 79.62% | 84.61% | 85.29% | ✅ GOOD |
| src/scraper/filters/JobFilter.ts | 100% | 96.66% | 100% | 100% | ✅ EXCELLENT |

---

## Priority 1: Database Module (CRITICAL - 5.71% coverage)

### Uncovered Code
- Lines 12-127: Database initialization, schema creation, migrations, closing

### Root Cause Analysis
- No integration tests for database initialization
- Migration logic untested
- Schema creation not verified
- closeDatabase() never called in tests

### Improvement Strategy

**Executable Steps:**

1. **Create Database.test.ts** - Test database lifecycle
   ```typescript
   // Test areas:
   - getDatabase() singleton pattern
   - Database initialization with custom path
   - Directory creation when missing
   - WAL mode pragma setting
   - Schema creation (tables, indexes)
   - Migration execution
   - closeDatabase() functionality
   ```

2. **Create Migration.test.ts** - Test migration logic
   ```typescript
   // Test areas:
   - page_html column addition
   - Column existence check before migration
   - Duplicate column error handling
   - Migration idempotency (can run multiple times)
   ```

3. **Integration tests with real SQLite**
   - Use temporary file database instead of in-memory
   - Verify actual file creation and permissions
   - Test concurrent database access scenarios

**Files to Create:**
- `tests/unit/Database.test.ts`
- `tests/unit/Migration.test.ts`

**Expected Coverage Gain:** 5.71% → 85%+

---

## Priority 2: Parser Module (CRITICAL - 40.54% coverage)

### Uncovered Code
- Lines 147-350: normalizeJobPosting(), salary parsing, advanced HTML extraction
- Lines 363-386: Navigation methods (clickNextPage)

### Root Cause Analysis
- Only basic extraction methods tested
- normalizeJobPosting() private method not tested
- Salary parsing from JSON-LD not tested
- Navigation (clickNextPage, hasNextPage) partially tested

### Improvement Strategy

**Executable Steps:**

1. **Enhance Parser.test.ts** - Add salary parsing tests
   ```typescript
   // Test areas:
   - normalizeJobPosting() with various JSON-LD structures
   - Salary extraction (minValue, maxValue, currency)
   - Company ID extraction from sameAs URL
   - Industry field parsing
   - Location address parsing (addressLocality vs address)
   - Missing salary data (undefined handling)
   ```

2. **Create ParserNavigation.test.ts** - Test pagination
   ```typescript
   // Test areas:
   - hasNextPage() when button exists
   - hasNextPage() when button disabled
   - hasNextPage() when button missing
   - clickNextPage() success scenario
   - clickNextPage() failure handling
   - clickNextPage() with network errors
   ```

3. **Create ParserAdvanced.test.ts** - Complex extraction scenarios
   ```typescript
   // Test areas:
   - Multiple selector fallback priority
   - getAttribute() helper with multiple selectors
   - getHtmlContent() vs getTextContent() helpers
   - Job ID extraction from URL patterns
   - Apply URL extraction
   - Posted date extraction
   ```

**Files to Create:**
- Enhance `tests/unit/Parser.test.ts`
- `tests/unit/ParserNavigation.test.ts`
- `tests/unit/ParserAdvanced.test.ts`

**Expected Coverage Gain:** 40.54% → 80%+

---

## Priority 3: Date Helpers (LOW - 57.14% coverage)

### Uncovered Code
- Lines 53-82: normalizeDate(), formatDateForDisplay()

### Root Cause Analysis
- Only parsePostedDate() has tests (17 tests from data-driven analysis)
- normalizeDate() wrapper function not tested
- formatDateForDisplay() completely untested

### Improvement Strategy

**Executable Steps:**

1. **Enhance DateHelpers.test.ts** - Add missing function tests
   ```typescript
   // Test areas for normalizeDate():
   - Converts relative dates to ISO format
   - Handles ISO dates (pass-through)
   - Returns valid ISO string format

   // Test areas for formatDateForDisplay():
   - "Just now" (<1 hour)
   - "X hours ago" (1-23 hours)
   - "X days ago" (1-6 days)
   - "X weeks ago" (1-3 weeks)
   - "X months ago" (4+ weeks)
   - Singular vs plural handling
   ```

**Files to Modify:**
- `tests/unit/DateHelpers.test.ts`

**Expected Coverage Gain:** 57.14% → 95%+

---

## Priority 4: Schema Definitions (MEDIUM - 60% coverage)

### Uncovered Code
- Lines 22, 45: Schema field definitions

### Root Cause Analysis
- Schema is mostly type definitions (exported constants)
- Tests don't import/use all schema exports
- Some fields not exercised in repository tests

### Improvement Strategy

**Executable Steps:**

1. **Create Schema.test.ts** - Verify schema structure
   ```typescript
   // Test areas:
   - All table schemas are defined
   - All columns are accessible
   - Foreign key relationships defined
   - Index definitions exist
   - FTS table configuration
   - Drizzle table() function returns correct structure
   ```

2. **Enhance existing repository tests**
   - Explicitly test all columns including rarely-used ones
   - Test foreign key constraints
   - Test index usage in queries

**Files to Create:**
- `tests/unit/Schema.test.ts`

**Expected Coverage Gain:** 60% → 90%+

---

## Priority 5: MockPage Test Helper (MEDIUM - 68.57% coverage)

### Uncovered Code
- Lines 34, 53-68, 91, 97-99: Advanced mock methods

### Root Cause Analysis
- Some mock methods not used in current tests
- JSDOM implementation incomplete for advanced features
- getAttribute(), waitForLoadState() not tested

### Improvement Strategy

**Executable Steps:**

1. **Either:**
   - **Option A (Recommended)**: Remove unused mock methods to improve coverage ratio
   - **Option B**: Add tests that exercise all mock methods

2. **Create MockPage.test.ts** - Test the mock itself
   ```typescript
   // Test areas:
   - textContent() method
   - getAttribute() method
   - waitForSelector() behavior
   - waitForLoadState() behavior
   - evaluate() execution
   - $() and $$() selectors
   ```

**Files to Create/Modify:**
- `tests/unit/MockPage.test.ts` (if Option B)
- `tests/mocks/MockPage.ts` (if Option A - remove unused code)

**Expected Coverage Gain:** 68.57% → 90%+

---

## Implementation Order

### Phase 1: Critical Fixes (Week 1)
1. ✅ Database.test.ts - Database lifecycle and initialization
2. ✅ Migration.test.ts - Migration logic
3. ✅ Enhance DateHelpers.test.ts - normalizeDate() and formatDateForDisplay()

### Phase 2: Parser Improvements (Week 2)
4. ✅ Enhance Parser.test.ts - Salary parsing and normalizeJobPosting()
5. ✅ ParserNavigation.test.ts - Pagination methods
6. ✅ ParserAdvanced.test.ts - Complex extraction scenarios

### Phase 3: Schema & Mocks (Week 3)
7. ✅ Schema.test.ts - Schema structure verification
8. ✅ MockPage cleanup or testing

### Phase 4: Integration & Refinement (Week 4)
9. ✅ Run full coverage analysis
10. ✅ Address any remaining gaps
11. ✅ Document coverage improvements
12. ✅ Update CI/CD to enforce 80% minimum

---

## Executable Test Creation Templates

### Template 1: Database.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabase, closeDatabase } from '../../src/database/db.js';
import fs from 'fs';
import path from 'path';

describe('Database', () => {
  const testDbPath = './data/test-db-lifecycle.db';

  afterEach(() => {
    closeDatabase();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const dbDir = path.dirname(testDbPath);
    if (fs.existsSync(dbDir) && fs.readdirSync(dbDir).length === 0) {
      fs.rmdirSync(dbDir);
    }
  });

  describe('getDatabase', () => {
    it('should create database file if not exists', () => {
      // TODO: Implement
    });

    it('should create parent directory if missing', () => {
      // TODO: Implement
    });

    it('should return singleton instance', () => {
      // TODO: Implement
    });

    it('should enable WAL mode', () => {
      // TODO: Implement
    });

    it('should initialize schema on first call', () => {
      // TODO: Implement
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', () => {
      // TODO: Implement
    });

    it('should reset singleton to null', () => {
      // TODO: Implement
    });
  });

  describe('Schema Initialization', () => {
    it('should create searches table', () => {
      // TODO: Implement
    });

    it('should create jobs table', () => {
      // TODO: Implement
    });

    it('should create scrape_errors table', () => {
      // TODO: Implement
    });

    it('should create all indexes', () => {
      // TODO: Implement
    });
  });
});
```

### Template 2: Migration.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { getDatabase, closeDatabase } from '../../src/database/db.js';

describe('Database Migrations', () => {
  // TODO: Test migration execution
  // TODO: Test page_html column addition
  // TODO: Test migration idempotency
});
```

### Template 3: Enhanced DateHelpers.test.ts

```typescript
describe('normalizeDate', () => {
  it('should convert relative date to ISO format', () => {
    // TODO: Implement
  });

  it('should handle ISO dates', () => {
    // TODO: Implement
  });
});

describe('formatDateForDisplay', () => {
  it('should return "Just now" for recent dates', () => {
    // TODO: Implement
  });

  it('should return hours ago for today', () => {
    // TODO: Implement
  });

  it('should return days ago for this week', () => {
    // TODO: Implement
  });

  it('should return weeks ago for this month', () => {
    // TODO: Implement
  });

  it('should return months ago for older dates', () => {
    // TODO: Implement
  });

  it('should handle singular vs plural correctly', () => {
    // TODO: Implement
  });
});
```

### Template 4: ParserAdvanced.test.ts

```typescript
describe('Parser Advanced Features', () => {
  describe('normalizeJobPosting', () => {
    it('should extract salary from baseSalary.value', () => {
      // TODO: Implement
    });

    it('should extract currency from baseSalary.currency', () => {
      // TODO: Implement
    });

    it('should handle missing salary data', () => {
      // TODO: Implement
    });

    it('should extract company ID from sameAs URL', () => {
      // TODO: Implement
    });

    it('should extract location from addressLocality', () => {
      // TODO: Implement
    });

    it('should fallback to address if addressLocality missing', () => {
      // TODO: Implement
    });

    it('should extract industry field', () => {
      // TODO: Implement
    });

    it('should extract identifier from nested structure', () => {
      // TODO: Implement
    });
  });
});
```

---

## Success Criteria

- [ ] Overall statement coverage ≥ 80%
- [ ] Overall branch coverage ≥ 75%
- [ ] Overall function coverage ≥ 80%
- [ ] No module below 80% statement coverage
- [ ] All critical paths tested (database, parsing, date handling)
- [ ] All new tests pass
- [ ] No regression in existing tests
- [ ] Documentation updated with testing guidelines

---

## Metrics Tracking

### Current (Baseline)
```
Overall:          57.7% statements, 48.69% branches, 65.88% functions
Database:          5.71% statements
Parser:           40.54% statements
DateHelpers:      57.14% statements
Schema:           60.00% statements
MockPage:         68.57% statements
Repositories:     84.72% statements ✅
JobFilter:       100.00% statements ✅
```

### Target (After Implementation)
```
Overall:          80%+ statements, 75%+ branches, 80%+ functions
Database:         85%+ statements
Parser:           80%+ statements
DateHelpers:      95%+ statements
Schema:           90%+ statements
MockPage:         90%+ statements
Repositories:     85%+ statements ✅
JobFilter:       100.00% statements ✅
```

---

## Notes for Execution

1. **Run coverage after each phase:**
   ```bash
   npm run test:coverage
   ```

2. **Focus on critical paths first** (database, parsing)

3. **Use fixtures** for complex test data (existing pattern)

4. **Mock external dependencies** (filesystem, database for unit tests)

5. **Integration tests** for database should use temporary files

6. **Keep tests fast** - current suite runs in ~17s, maintain this speed

7. **Follow existing patterns**:
   - Vitest + JSDOM for unit tests
   - beforeEach() for setup
   - Descriptive test names
   - Fixture-based data
   - White-box testing where appropriate

---

## Review and Approval

**Status**: ⏳ Awaiting human review

Once approved, this plan will be executed phase by phase with continuous coverage monitoring.

**Instructions for Human:**
- Review each priority section
- Edit/adjust executable steps as needed
- Add comments for specific requirements
- Approve by confirming execution

**Execution will read this file from filesystem to respect any edits made.**
