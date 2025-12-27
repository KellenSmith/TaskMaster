#!/usr/bin/env node

/**
 * Test Coverage Analysis Script
 *
 * Usage: node analyze-coverage.js
 *
 * This script:
 * - Identifies all .ts/.tsx files that need tests
 * - Groups them by type (utility, component, hook, api)
 * - Shows which files have tests and which don't
 * - Estimates effort and priority
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR = path.join(__dirname, 'src');

const FILE_CATEGORIES = {
  utility: {
    patterns: [/lib\/.+\.(ts|tsx)$/, /utils\/.+\.(ts|tsx)$/],
    priority: 'HIGH',
    effort: 'LOW',
  },
  hook: {
    patterns: [/hooks\/.+\.ts$/],
    priority: 'HIGH',
    effort: 'MEDIUM',
  },
  component: {
    patterns: [/ui\/.+\.tsx$/],
    priority: 'HIGH',
    effort: 'MEDIUM',
  },
  api: {
    patterns: [/api\/.+\.(ts|tsx)$/],
    priority: 'MEDIUM',
    effort: 'HIGH',
  },
  page: {
    patterns: [/\(pages\)\/.+\.tsx$/],
    priority: 'MEDIUM',
    effort: 'HIGH',
  },
  context: {
    patterns: [/context\/.+\.tsx$/],
    priority: 'HIGH',
    effort: 'MEDIUM',
  },
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules' &&
      file !== '.next'
    ) {
      getAllFiles(filePath, fileList);
    } else if (
      stat.isFile() &&
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.tsx') &&
      !file.startsWith('.')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function categorizeFile(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);

  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    if (config.patterns.some((pattern) => pattern.test(relativePath))) {
      return { category, ...config };
    }
  }

  return null;
}

function hasTest(filePath) {
  const testPath = filePath.replace(/\.(ts|tsx)$/, '.test.$1');
  return fs.existsSync(testPath);
}

function analyzeFiles() {
  const allFiles = getAllFiles(SRC_DIR);
  const categorized = {};
  const untested = [];
  const tested = [];

  allFiles.forEach((filePath) => {
    const category = categorizeFile(filePath);
    if (!category) return;

    if (!categorized[category.category]) {
      categorized[category.category] = {
        files: [],
        priority: category.priority,
        effort: category.effort,
      };
    }

    const relativePath = path.relative(SRC_DIR, filePath);
    const hasTestFile = hasTest(filePath);

    categorized[category.category].files.push({
      path: relativePath,
      hasTest: hasTestFile,
    });

    if (hasTestFile) {
      tested.push(relativePath);
    } else {
      untested.push({
        path: relativePath,
        category: category.category,
      });
    }
  });

  return {
    categorized,
    untested,
    tested,
    stats: {
      total: allFiles.filter((f) => categorizeFile(f)).length,
      tested: tested.length,
      untested: untested.length,
    },
  };
}

function printReport(analysis) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST COVERAGE ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  // Summary
  const { stats } = analysis;
  const coverage = ((stats.tested / stats.total) * 100).toFixed(1);
  console.log(`📊 SUMMARY`);
  console.log(`   Total files: ${stats.total}`);
  console.log(`   Tested: ${stats.tested}`);
  console.log(`   Untested: ${stats.untested}`);
  console.log(`   Coverage: ${coverage}%\n`);

  // By category
  console.log(`📁 BY CATEGORY\n`);

  Object.entries(analysis.categorized).forEach(([category, config]) => {
    const categoryTested = config.files.filter((f) => f.hasTest).length;
    const categoryTotal = config.files.length;
    const categoryCoverage = (
      (categoryTested / categoryTotal) *
      100
    ).toFixed(1);

    console.log(
      `${category.toUpperCase()} (Priority: ${config.priority}, Effort: ${config.effort})`
    );
    console.log(`   ${categoryTested}/${categoryTotal} tested (${categoryCoverage}%)`);

    // Show untested files
    const untested = config.files.filter((f) => !f.hasTest);
    if (untested.length > 0 && untested.length <= 10) {
      untested.forEach((file) => {
        console.log(`   ❌ ${file.path}`);
      });
    } else if (untested.length > 10) {
      untested.slice(0, 5).forEach((file) => {
        console.log(`   ❌ ${file.path}`);
      });
      console.log(`   ... and ${untested.length - 5} more`);
    }
    console.log();
  });

  // Recommended order
  console.log(`\n🎯 RECOMMENDED TESTING ORDER\n`);
  console.log(`Start with High Priority + Low Effort:\n`);

  const prioritized = analysis.untested
    .sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const effortOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
      const aConfig = FILE_CATEGORIES[a.category];
      const bConfig = FILE_CATEGORIES[b.category];
      const orderDiff = order[aConfig.priority] - order[bConfig.priority];
      if (orderDiff !== 0) return orderDiff;
      return (
        effortOrder[aConfig.effort] - effortOrder[bConfig.effort]
      );
    })
    .slice(0, 20);

  prioritized.forEach(({ path: filePath, category }) => {
    const config = FILE_CATEGORIES[category];
    console.log(
      `   1. ${filePath} (${category}, ${config.priority}/${config.effort})`
    );
  });

  if (analysis.untested.length > 20) {
    console.log(
      `\n   ... and ${analysis.untested.length - 20} more files`
    );
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Run analysis
const analysis = analyzeFiles();
printReport(analysis);

// Export for programmatic use
export { analyzeFiles, categorizeFile, hasTest };
