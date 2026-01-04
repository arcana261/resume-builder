# LinkedIn Login Feature - Implementation Plan

## Overview

Add LinkedIn login capability to the scraper with:
- New `login` command that opens LinkedIn in headed mode
- Manual login by user in browser window
- Session persistence to disk (cookies + storage)
- Auto-restore session for subsequent scrapes
- Session management commands (logout, session status)

## Legal & Ethical Considerations

⚠️ **IMPORTANT**: LinkedIn's Terms of Service prohibit automated scraping. Adding login functionality:
- Increases legal risk (authenticated scraping is more serious)
- May result in account suspension/ban
- Should only be used for personal research/educational purposes
- Consider using LinkedIn's official API for production use

**Recommendation**: Add prominent warnings in CLI and documentation.

---

## User Flow

### First Time Usage
```bash
# Step 1: Login to LinkedIn
npm run dev login
# → Opens browser in headed mode
# → Navigates to LinkedIn login page
# → User manually logs in (handles 2FA, CAPTCHA)
# → Waits for successful login detection
# → Saves session to data/linkedin-session.json
# → Closes browser

# Step 2: Scrape jobs (uses saved session)
npm run dev scrape --position "Software Engineer" --location "San Francisco"
# → Automatically restores session from disk
# → Scrapes jobs as authenticated user
```

### Subsequent Usage
```bash
# Just scrape - uses existing session
npm run dev scrape --position "Product Manager"

# Force re-login if session expired
npm run dev login

# Check session status
npm run dev session

# Logout (clear session)
npm run dev logout
```

---

## Architecture Overview

### Session Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     Login Command                            │
│  1. Launch browser (headed mode, always)                    │
│  2. Navigate to LinkedIn login page                         │
│  3. Wait for user to manually login                         │
│  4. Detect successful login                                 │
│  5. Save cookies + localStorage + sessionStorage            │
│  6. Write to data/linkedin-session.json                     │
│  7. Close browser                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Session saved to disk
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Scrape Command                            │
│  1. Launch browser (headed or headless)                     │
│  2. Check if data/linkedin-session.json exists              │
│  3. If exists: Restore cookies + storage                    │
│  4. If not exists: Show error, prompt to run login          │
│  5. Verify session is still valid                           │
│  6. If invalid: Show error, prompt to re-login              │
│  7. Continue with scraping                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Session Management Infrastructure (2-3 hours)

**Step 1.1: Create SessionManager Module**
- New file: `src/scraper/auth/SessionManager.ts`
- Class: `SessionManager`
- Methods:
  ```typescript
  saveSession(context: BrowserContext, page: Page): Promise<void>
  loadSession(context: BrowserContext, page: Page): Promise<boolean>
  sessionExists(): boolean
  clearSession(): Promise<void>
  getSessionAge(): number | null
  isSessionValid(): Promise<boolean>
  ```

**Step 1.2: Define Session Data Structure**
- Add to `src/types/index.ts`:
  ```typescript
  export interface SessionData {
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'Strict' | 'Lax' | 'None';
    }>;
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    timestamp: number;
    userAgent: string;
    viewport: { width: number; height: number };
  }
  ```

**Step 1.3: Implement Session Persistence**
- Save to `data/linkedin-session.json`
- Include cookies, localStorage, sessionStorage
- Add timestamp for expiry checking
- Store user agent and viewport for consistency

---

### Phase 2: Login Detection Logic (2-3 hours)

**Step 2.1: Create LoginDetector Module**
- New file: `src/scraper/auth/LoginDetector.ts`
- Class: `LoginDetector`
- Methods:
  ```typescript
  isLoggedIn(page: Page): Promise<boolean>
  waitForLogin(page: Page, timeout?: number): Promise<void>
  navigateToLogin(page: Page): Promise<void>
  ```

**Step 2.2: Implement Login Detection Strategies**

**Strategy 1: Cookie-based Detection**
- Check for `li_at` cookie (LinkedIn auth token)
- Check for `JSESSIONID` cookie

**Strategy 2: DOM-based Detection**
- Navigate to `https://www.linkedin.com/feed/`
- Check for profile navigation element
- Verify absence of login form

**Strategy 3: Combined Approach**
- Use both strategies for reliability
- Prefer cookie check (faster)
- Fall back to DOM check if uncertain

**Step 2.3: Implement Login Waiting**
- Poll every 2 seconds
- Check for successful login
- Configurable timeout (default: 5 minutes)
- Show progress messages to user

---

### Phase 3: Login Command Implementation (2-3 hours)

**Step 3.1: Create LoginCommand Module**
- New file: `src/cli/commands/LoginCommand.ts`
- Extends Commander command
- Always runs in headed mode (ignores .env HEADLESS setting)

**Step 3.2: Implement Login Flow**
```typescript
class LoginCommand {
  async execute(): Promise<void> {
    // 1. Show security warning
    this.showSecurityWarning();

    // 2. Launch browser (headed mode, forced)
    const browser = new Browser({
      headless: false,  // Always headed
      stealth: true,
      antiDetectionConfig: { /* ... */ }
    });
    await browser.launch();

    // 3. Navigate to LinkedIn login
    const loginDetector = new LoginDetector();
    await loginDetector.navigateToLogin(browser.getPage());

    // 4. Show instructions to user
    console.log('Please log in to LinkedIn in the browser window...');
    console.log('Waiting for successful login...');

    // 5. Wait for login (poll for success)
    await loginDetector.waitForLogin(browser.getPage(), 300000);

    // 6. Save session
    const sessionManager = new SessionManager();
    await sessionManager.saveSession(
      browser.getContext(),
      browser.getPage()
    );

    // 7. Show success message
    console.log('✓ Login successful! Session saved.');
    console.log('You can now run scraping commands.');

    // 8. Close browser
    await browser.close();
  }
}
```

**Step 3.3: Register Command in CLI**
- Update `src/cli/index.ts`
- Add `login` command registration
- Add command description and help text

---

### Phase 4: Session Restoration in Browser (1-2 hours)

**Step 4.1: Modify Browser.ts**
- Add optional session restore in `launch()` method
- Check if session exists before creating context
- Restore session if available

**Step 4.2: Implement Auto-Restore Logic**
```typescript
// In Browser.ts launch() method
async launch(): Promise<void> {
  // ... existing launch code ...

  this.browser = await browserType.launch(launchOptions);
  this.context = await this.browser.newContext(fingerprint.contextOptions);

  // NEW: Auto-restore session if exists
  const sessionManager = new SessionManager();
  if (sessionManager.sessionExists()) {
    logger.info('Found saved session, restoring...');
    const restored = await sessionManager.loadSession(
      this.context,
      await this.context.newPage()
    );

    if (restored) {
      logger.info('Session restored successfully');
    } else {
      logger.warn('Session restore failed or expired');
    }
  }

  this.page = await this.context.newPage();
  // ... rest of existing code ...
}
```

**Step 4.3: Add Session Validation**
- After restore, verify session is still valid
- Navigate to LinkedIn and check login status
- If invalid, clear session and show error

---

### Phase 5: Session Management Commands (1-2 hours)

**Step 5.1: Create LogoutCommand**
- New file: `src/cli/commands/LogoutCommand.ts`
- Clear session file
- Show confirmation message

```typescript
class LogoutCommand {
  async execute(): Promise<void> {
    const sessionManager = new SessionManager();

    if (!sessionManager.sessionExists()) {
      console.log('No active session found.');
      return;
    }

    await sessionManager.clearSession();
    console.log('✓ Logged out successfully. Session cleared.');
  }
}
```

**Step 5.2: Create SessionCommand**
- New file: `src/cli/commands/SessionCommand.ts`
- Show session status (exists, age, validity)
- Display session info (when saved, user agent, etc.)

```typescript
class SessionCommand {
  async execute(): Promise<void> {
    const sessionManager = new SessionManager();

    if (!sessionManager.sessionExists()) {
      console.log('No active session found.');
      console.log('Run "npm run dev login" to create a session.');
      return;
    }

    const age = sessionManager.getSessionAge();
    const ageHours = Math.floor(age! / (1000 * 60 * 60));
    const ageDays = Math.floor(ageHours / 24);

    console.log('Session Status: Active');
    console.log(`Age: ${ageDays} days, ${ageHours % 24} hours`);
    console.log(`Location: ${sessionManager.getSessionPath()}`);

    // Optionally check validity
    const browser = new Browser({ headless: true });
    await browser.launch();
    const valid = await sessionManager.isSessionValid(
      browser.getContext(),
      browser.getPage()
    );
    await browser.close();

    console.log(`Valid: ${valid ? '✓ Yes' : '✗ No (run login again)'}`);
  }
}
```

**Step 5.3: Register Commands**
- Add to `src/cli/index.ts`
- `logout` command
- `session` command

---

### Phase 6: Integration with ScraperService (1-2 hours)

**Step 6.1: Add Session Check in ScraperService**
- Before scraping, check if session exists
- If headless mode, require session
- If headed mode, optionally prompt for login

**Step 6.2: Handle Session Errors**
```typescript
// In ScraperService.ts
async scrape(filters: JobFilters): Promise<ScrapeResult> {
  const sessionManager = new SessionManager();

  // Check if session exists (optional check)
  if (!sessionManager.sessionExists()) {
    logger.warn('No saved session found. Scraping without authentication.');
    logger.info('Run "npm run dev login" to scrape as authenticated user.');
  }

  // Continue with existing scraping logic
  // Session will auto-restore in Browser.launch() if exists
  await this.browser.launch();
  // ... rest of scraping ...
}
```

**Step 6.3: Add Session Validation During Scraping**
- Check if session is still valid mid-scrape
- If expired, pause and show error
- Recommend re-running login command

---

### Phase 7: Error Handling & Edge Cases (1-2 hours)

**Step 7.1: Handle Session Expiry**
- Detect expired session during scraping
- Show clear error message
- Don't auto-delete (let user decide)

**Step 7.2: Handle Login Timeout**
- If user doesn't login within timeout
- Show timeout message
- Don't save partial session

**Step 7.3: Handle Network Errors**
- Retry session restoration on network failure
- Graceful fallback to non-authenticated scraping
- Log warnings appropriately

**Step 7.4: Handle Invalid Session Data**
- Corrupt JSON file
- Missing required fields
- Show error and recommend re-login

**Step 7.5: Handle 2FA/CAPTCHA**
- Manual login handles this automatically
- Show instructions if detected
- No timeout during 2FA process

---

### Phase 8: Documentation & Configuration (1-2 hours)

**Step 8.1: Add Configuration Options**
Add to `.env.example`:
```bash
# Session Management
SESSION_PATH=./data/linkedin-session.json  # Session storage location
SESSION_TIMEOUT=86400000                    # 24 hours in ms
LOGIN_TIMEOUT=300000                        # 5 minutes in ms
```

**Step 8.2: Update README.md**
Add new section:
```markdown
## LinkedIn Login

To scrape as an authenticated user:

### First Time Setup
1. Run the login command:
   ```bash
   npm run dev login
   ```

2. A browser window will open to LinkedIn's login page
3. Manually log in (handles 2FA and CAPTCHA)
4. Wait for confirmation message
5. Session is saved to `data/linkedin-session.json`

### Scraping with Authentication
```bash
npm run dev scrape --position "Engineer" --location "NYC"
```
The scraper will automatically use your saved session.

### Managing Sessions
```bash
# Check session status
npm run dev session

# Logout (clear session)
npm run dev logout

# Re-login (if session expired)
npm run dev login
```

### Security Notes
⚠️ Session data is stored in plain text in `data/linkedin-session.json`
⚠️ Do not commit this file to version control (.gitignore included)
⚠️ Use a separate LinkedIn account for scraping
⚠️ LinkedIn may ban accounts that scrape aggressively
```

**Step 8.3: Update .gitignore**
Add:
```
data/linkedin-session.json
data/*.session.json
```

**Step 8.4: Add Security Warning**
Create function to show warning in LoginCommand:
```typescript
private showSecurityWarning(): void {
  console.log(chalk.yellow.bold('\n⚠️  SECURITY WARNING ⚠️\n'));
  console.log('LinkedIn Terms of Service PROHIBIT automated scraping.');
  console.log('Using this feature may result in account suspension.\n');
  console.log('Recommendations:');
  console.log('  • Use a separate account for testing');
  console.log('  • Limit scraping volume (< 50 jobs/day)');
  console.log('  • Never share session files');
  console.log('  • Session stored in: data/linkedin-session.json\n');
  console.log(chalk.dim('Press Ctrl+C to cancel, or wait to continue...\n'));

  // Give user 5 seconds to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
}
```

**Step 8.5: Add TypeScript Types**
Update `src/types/index.ts`:
```typescript
export interface SessionData {
  cookies: Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
  userAgent: string;
  viewport: { width: number; height: number };
}

export interface SessionConfig {
  sessionPath: string;
  sessionTimeout: number;
  loginTimeout: number;
}
```

---

## Files to Create/Modify

### New Files
```
src/scraper/auth/
  ├── SessionManager.ts          # Cookie/storage persistence
  └── LoginDetector.ts           # Detect login status

src/cli/commands/
  ├── LoginCommand.ts            # Login command
  ├── LogoutCommand.ts           # Logout command
  └── SessionCommand.ts          # Session status command

data/
  └── linkedin-session.json      # Session data (gitignored)
```

### Files to Modify
```
src/scraper/core/
  └── Browser.ts                 # Add session auto-restore

src/services/
  └── ScraperService.ts          # Add session validation

src/types/
  └── index.ts                   # Add session types

src/cli/
  └── index.ts                   # Register new commands

.env.example                     # Add session config
.gitignore                       # Ignore session files
README.md                        # Add login documentation
```

---

## Technical Implementation Details

### SessionManager Implementation

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import type { BrowserContext, Page, Cookie } from 'playwright';
import { logger } from '../../utils/logger.js';
import type { SessionData } from '../../types/index.js';

export class SessionManager {
  private sessionPath: string;
  private sessionTimeout: number;

  constructor(
    sessionPath = './data/linkedin-session.json',
    sessionTimeout = 86400000 // 24 hours
  ) {
    this.sessionPath = sessionPath;
    this.sessionTimeout = sessionTimeout;
  }

  /**
   * Save browser session to disk
   */
  async saveSession(context: BrowserContext, page: Page): Promise<void> {
    try {
      // Get all cookies
      const cookies = await context.cookies();

      // Get localStorage
      const localStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            storage[key] = window.localStorage.getItem(key) || '';
          }
        }
        return storage;
      });

      // Get sessionStorage
      const sessionStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key) {
            storage[key] = window.sessionStorage.getItem(key) || '';
          }
        }
        return storage;
      });

      // Get current viewport and user agent
      const viewport = page.viewportSize();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      // Build session data
      const sessionData: SessionData = {
        cookies,
        localStorage,
        sessionStorage,
        timestamp: Date.now(),
        userAgent,
        viewport: viewport || { width: 1920, height: 1080 }
      };

      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.sessionPath), { recursive: true });

      // Write to file
      await fs.writeFile(
        this.sessionPath,
        JSON.stringify(sessionData, null, 2),
        'utf-8'
      );

      logger.info(`Session saved to ${this.sessionPath}`);
    } catch (error) {
      logger.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Load session from disk and restore to browser context
   */
  async loadSession(context: BrowserContext, page: Page): Promise<boolean> {
    try {
      if (!this.sessionExists()) {
        logger.debug('No session file found');
        return false;
      }

      // Read session file
      const sessionJson = await fs.readFile(this.sessionPath, 'utf-8');
      const sessionData: SessionData = JSON.parse(sessionJson);

      // Check if expired
      const age = Date.now() - sessionData.timestamp;
      if (age > this.sessionTimeout) {
        logger.warn(`Session expired (age: ${Math.floor(age / 1000 / 60)} minutes)`);
        return false;
      }

      // Restore cookies
      await context.addCookies(sessionData.cookies);
      logger.debug(`Restored ${sessionData.cookies.length} cookies`);

      // Restore localStorage
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }
      }, sessionData.localStorage);
      logger.debug(`Restored ${Object.keys(sessionData.localStorage).length} localStorage items`);

      // Restore sessionStorage
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          sessionStorage.setItem(key, value);
        }
      }, sessionData.sessionStorage);
      logger.debug(`Restored ${Object.keys(sessionData.sessionStorage).length} sessionStorage items`);

      logger.info('Session restored successfully');
      return true;
    } catch (error) {
      logger.error('Failed to load session:', error);
      return false;
    }
  }

  /**
   * Check if session file exists
   */
  sessionExists(): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(this.sessionPath);
    } catch {
      return false;
    }
  }

  /**
   * Clear session file
   */
  async clearSession(): Promise<void> {
    try {
      if (this.sessionExists()) {
        await fs.unlink(this.sessionPath);
        logger.info('Session cleared');
      }
    } catch (error) {
      logger.error('Failed to clear session:', error);
      throw error;
    }
  }

  /**
   * Get session age in milliseconds
   */
  getSessionAge(): number | null {
    try {
      if (!this.sessionExists()) {
        return null;
      }

      const sessionJson = require('fs').readFileSync(this.sessionPath, 'utf-8');
      const sessionData: SessionData = JSON.parse(sessionJson);

      return Date.now() - sessionData.timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Get session file path
   */
  getSessionPath(): string {
    return this.sessionPath;
  }

  /**
   * Validate session by checking login status
   */
  async isSessionValid(context: BrowserContext, page: Page): Promise<boolean> {
    const loginDetector = new LoginDetector();
    return await loginDetector.isLoggedIn(page);
  }
}
```

### LoginDetector Implementation

```typescript
import type { Page } from 'playwright';
import { logger } from '../../utils/logger.js';

export class LoginDetector {
  /**
   * Check if user is logged in to LinkedIn
   */
  async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Strategy 1: Check for auth cookies
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c =>
        c.name === 'li_at' && c.value.length > 0
      );

      if (!hasAuthCookie) {
        logger.debug('No li_at cookie found');
        return false;
      }

      // Strategy 2: Check DOM for logged-in indicators
      // Navigate to feed to verify
      await page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const isLoggedIn = await page.evaluate(() => {
        // Check for profile navigation (logged in)
        const profileNav = document.querySelector('.global-nav__me');

        // Check for sign-in form (not logged in)
        const signInForm = document.querySelector('.sign-in-form');

        return !!profileNav && !signInForm;
      });

      return isLoggedIn;
    } catch (error) {
      logger.warn('Failed to detect login status:', error);
      return false;
    }
  }

  /**
   * Navigate to LinkedIn login page
   */
  async navigateToLogin(page: Page): Promise<void> {
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    logger.info('Navigated to LinkedIn login page');
  }

  /**
   * Wait for user to complete login
   */
  async waitForLogin(page: Page, timeout = 300000): Promise<void> {
    logger.info('Waiting for user to complete login...');

    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      if (await this.isLoggedIn(page)) {
        logger.info('Login successful!');
        return;
      }

      // Show progress every 30 seconds
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed % 30 === 0 && elapsed > 0) {
        logger.info(`Still waiting... (${elapsed}s elapsed)`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Login timeout - user did not complete login within time limit');
  }
}
```

---

## Estimated Time & Effort

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Session Management | 2-3 hours | Medium |
| Phase 2: Login Detection | 2-3 hours | Medium |
| Phase 3: Login Command | 2-3 hours | Low-Medium |
| Phase 4: Session Restoration | 1-2 hours | Low |
| Phase 5: Management Commands | 1-2 hours | Low |
| Phase 6: ScraperService Integration | 1-2 hours | Low |
| Phase 7: Error Handling | 1-2 hours | Medium |
| Phase 8: Documentation | 1-2 hours | Low |
| **Total** | **11-19 hours** | **Medium** |

---

## Testing Plan

### Manual Testing
1. **Login Flow**
   - Run `npm run dev login`
   - Verify browser opens in headed mode
   - Complete login with 2FA
   - Verify session file created
   - Verify cookies saved correctly

2. **Session Restoration**
   - Run `npm run dev scrape` after login
   - Verify session restored automatically
   - Verify no login prompt appears
   - Verify scraping works as authenticated user

3. **Session Management**
   - Run `npm run dev session` - check status
   - Run `npm run dev logout` - verify file deleted
   - Run `npm run dev session` again - verify "no session" message

4. **Error Cases**
   - Delete session file mid-scrape - verify error handling
   - Corrupt session JSON - verify graceful error
   - Wait for session to expire - verify expiry detection

### Automated Testing
- Unit tests for SessionManager (mock fs operations)
- Unit tests for LoginDetector (mock Page)
- Integration tests for login flow

---

## Security Considerations

### Session File Security
- **Plain text storage**: Cookies stored unencrypted
- **Risk**: Anyone with file access can hijack session
- **Mitigation**:
  - Add to .gitignore
  - Set restrictive file permissions (600)
  - Warn users in documentation

### Session Expiry
- **Default**: 24 hours
- **LinkedIn's TTL**: May be shorter
- **Recommendation**: Check validity before each scrape

### Account Safety
- **Recommendation**: Use separate account
- **Warning**: Display before every login
- **Rate limiting**: Respect existing delays

---

## Future Enhancements

1. **Encrypted Session Storage**
   - Use system keychain (keytar library)
   - Encrypt with user password
   - More complex, OS-dependent

2. **Session Refresh**
   - Auto-refresh session before expiry
   - Navigate to LinkedIn periodically
   - Keep session alive longer

3. **Multiple Sessions**
   - Support multiple LinkedIn accounts
   - Named sessions: `--session-name personal`
   - Switch between accounts

4. **Session Analytics**
   - Track scraping metrics per session
   - Detect unusual activity
   - Warn when approaching limits

---

## Next Steps

Please confirm you're ready to proceed with implementation, and I'll begin step-by-step execution of the plan.

The implementation will:
1. Create SessionManager and LoginDetector modules
2. Implement login command
3. Add session auto-restore to Browser.ts
4. Create session management commands (logout, session)
5. Update documentation and security warnings

Estimated total time: **11-19 hours**
