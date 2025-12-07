#!/usr/bin/env node

import dotenv from 'dotenv';
import { createCLI } from './cli/index.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  console.error('Fatal error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  console.error('Fatal error:', reason);
  process.exit(1);
});

// Create and run CLI
async function main() {
  try {
    const cli = createCLI();
    await cli.parseAsync(process.argv);
  } catch (error) {
    logger.error('CLI error', { error });
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
