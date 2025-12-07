import { JSDOM } from 'jsdom';
import type { Page, ElementHandle, Locator } from 'playwright';

/**
 * Mock Playwright Page for testing Parser with HTML fixtures
 */
export class MockPage {
  private dom: JSDOM;
  private document: Document;

  constructor(html: string) {
    this.dom = new JSDOM(html, {
      url: 'https://www.linkedin.com/jobs/search',
      contentType: 'text/html'
    });
    this.document = this.dom.window.document;
  }

  async waitForSelector(selector: string, options?: { timeout?: number; state?: string }): Promise<void> {
    const element = this.document.querySelector(selector);
    if (!element) {
      throw new Error(`Timeout: selector "${selector}" not found`);
    }
  }

  async $$(selector: string): Promise<MockElementHandle[]> {
    const elements = Array.from(this.document.querySelectorAll(selector));
    return elements.map(el => new MockElementHandle(el as HTMLElement, this.document));
  }

  async $(selector: string): Promise<MockElementHandle | null> {
    const element = this.document.querySelector(selector);
    if (!element) return null;
    return new MockElementHandle(element as HTMLElement, this.document);
  }

  async textContent(selector: string): Promise<string | null> {
    const element = this.document.querySelector(selector);
    return element?.textContent || null;
  }

  async evaluate<R>(pageFunction: () => R): Promise<R> {
    // Execute function in JSDOM context
    const window = this.dom.window as any;
    const func = pageFunction.toString();

    // Create a function in the JSDOM context
    const contextFunc = new window.Function(`return (${func})();`);
    return contextFunc();
  }

  async content(): Promise<string> {
    return this.dom.serialize();
  }

  async waitForLoadState(state: string, options?: { timeout?: number }): Promise<void> {
    // Mock - no-op for testing
  }

  async click(selector: string): Promise<void> {
    const element = this.document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  async screenshot(options?: any): Promise<Buffer> {
    return Buffer.from('mock-screenshot');
  }
}

/**
 * Mock ElementHandle for testing
 */
export class MockElementHandle {
  constructor(
    private element: HTMLElement,
    private document: Document
  ) {}

  async getAttribute(name: string): Promise<string | null> {
    return this.element.getAttribute(name);
  }

  async $eval<R>(
    selector: string,
    pageFunction: (element: Element) => R
  ): Promise<R> {
    const element = this.element.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return pageFunction(element);
  }

  async $(selector: string): Promise<MockElementHandle | null> {
    const element = this.element.querySelector(selector);
    if (!element) return null;
    return new MockElementHandle(element as HTMLElement, this.document);
  }
}

/**
 * Create a mock Page from HTML string
 */
export function createMockPage(html: string): Page {
  return new MockPage(html) as unknown as Page;
}
