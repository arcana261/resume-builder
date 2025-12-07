import { readFileSync } from 'fs';
import { join } from 'path';

export class FixtureLoader {
  private static FIXTURES_DIR = join(__dirname, '../fixtures');

  static loadHTML(filename: string): string {
    const filePath = join(this.FIXTURES_DIR, filename);
    return readFileSync(filePath, 'utf-8');
  }

  static getLinkedInSearchHTML(): string {
    return this.loadHTML('linkedin-search-91-jobs.html');
  }
}
