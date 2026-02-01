#!/usr/bin/env node

/**
 * Translation Key Checker
 *
 * This script verifies that all translation keys in French match the English structure.
 * It reports any missing keys in the French translations.
 *
 * Usage: node scripts/check-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const FR_DIR = path.join(LOCALES_DIR, 'fr');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function compareTranslations(enData, frData, namespace) {
  const enKeys = getAllKeys(enData);
  const frKeys = getAllKeys(frData);

  const missingInFr = enKeys.filter(key => !frKeys.includes(key));
  const extraInFr = frKeys.filter(key => !enKeys.includes(key));

  return { missingInFr, extraInFr, totalEn: enKeys.length, totalFr: frKeys.length };
}

function main() {
  console.log(`\n${colors.cyan}======================================${colors.reset}`);
  console.log(`${colors.cyan}   Translation Key Checker${colors.reset}`);
  console.log(`${colors.cyan}======================================${colors.reset}\n`);

  const enFiles = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));

  let totalMissing = 0;
  let totalExtra = 0;
  let totalNamespaces = 0;
  let completeNamespaces = 0;

  for (const file of enFiles) {
    const namespace = file.replace('.json', '');
    const enPath = path.join(EN_DIR, file);
    const frPath = path.join(FR_DIR, file);

    if (!fs.existsSync(frPath)) {
      console.log(`${colors.red}✗ ${namespace}${colors.reset}: French file missing entirely!`);
      totalNamespaces++;
      continue;
    }

    try {
      const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));

      const { missingInFr, extraInFr, totalEn, totalFr } = compareTranslations(enData, frData, namespace);

      totalNamespaces++;

      if (missingInFr.length === 0 && extraInFr.length === 0) {
        console.log(`${colors.green}✓ ${namespace}${colors.reset}: Complete (${totalEn} keys)`);
        completeNamespaces++;
      } else {
        console.log(`${colors.yellow}⚠ ${namespace}${colors.reset}: ${missingInFr.length} missing, ${extraInFr.length} extra`);

        if (missingInFr.length > 0) {
          console.log(`  ${colors.red}Missing in French:${colors.reset}`);
          missingInFr.slice(0, 5).forEach(key => {
            console.log(`    - ${key}`);
          });
          if (missingInFr.length > 5) {
            console.log(`    ... and ${missingInFr.length - 5} more`);
          }
        }

        if (extraInFr.length > 0) {
          console.log(`  ${colors.blue}Extra in French (not in English):${colors.reset}`);
          extraInFr.slice(0, 5).forEach(key => {
            console.log(`    - ${key}`);
          });
          if (extraInFr.length > 5) {
            console.log(`    ... and ${extraInFr.length - 5} more`);
          }
        }

        totalMissing += missingInFr.length;
        totalExtra += extraInFr.length;
      }
    } catch (err) {
      console.log(`${colors.red}✗ ${namespace}${colors.reset}: Error parsing JSON - ${err.message}`);
    }
  }

  console.log(`\n${colors.cyan}======================================${colors.reset}`);
  console.log(`${colors.cyan}   Summary${colors.reset}`);
  console.log(`${colors.cyan}======================================${colors.reset}`);
  console.log(`Total namespaces: ${totalNamespaces}`);
  console.log(`Complete: ${colors.green}${completeNamespaces}${colors.reset}`);
  console.log(`Missing keys: ${totalMissing > 0 ? colors.red : colors.green}${totalMissing}${colors.reset}`);
  console.log(`Extra keys: ${totalExtra > 0 ? colors.blue : colors.green}${totalExtra}${colors.reset}`);

  if (totalMissing === 0 && totalExtra === 0) {
    console.log(`\n${colors.green}All translations are complete!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}Some translations need attention.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
