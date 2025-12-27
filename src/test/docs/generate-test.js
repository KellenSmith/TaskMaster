/**
 * Test File Generator
 *
 * Usage: node generate-test.js <file-path>
 * Example: node generate-test.js src/app/lib/utils.ts
 *
 * Generates a test skeleton based on file type
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

if (!args[0]) {
  console.error('Usage: node generate-test.js <file-path>');
  process.exit(1);
}

const filePath = args[0];
const testPath = filePath.replace(/\.(ts|tsx)$/, '.test.$1');

// Check if test already exists
if (fs.existsSync(testPath)) {
  console.error(`Test file already exists: ${testPath}`);
  process.exit(1);
}

// Check if source file exists
if (!fs.existsSync(filePath)) {
  console.error(`Source file not found: ${filePath}`);
  process.exit(1);
}

// Read the source file to detect exports
const sourceContent = fs.readFileSync(filePath, 'utf-8');
const fileExt = path.extname(filePath);
const isTsx = fileExt === '.tsx';
const fileName = path.basename(filePath, fileExt);

// Extract exported functions/components
const exportMatches = sourceContent.match(/export\s+(function|const|class|interface|type|default)\s+(\w+)/g) || [];
const exports = exportMatches
  .map((match) => match.replace(/export\s+(function|const|class|interface|type|default)\s+/, ''))
  .filter((name) => name !== 'default');

// Determine template based on file type and content
let template = '';

if (isTsx) {
  // React component
  const isHook = fileName.startsWith('use');

  if (isHook) {
    template = generateHookTest(fileName, exports);
  } else {
    const isContextComponent = fileName.includes('Context') || sourceContent.includes('createContext');
    template = generateComponentTest(fileName, exports, isContextComponent);
  }
} else {
  // TypeScript utility/library
  const isApiRoute = fileName === 'route';

  if (isApiRoute) {
    template = generateApiRouteTest(fileName, exports);
  } else {
    template = generateUtilityTest(fileName, exports);
  }
}

// Write the test file
fs.writeFileSync(testPath, template, 'utf-8');
console.log(`✅ Test file generated: ${testPath}`);
console.log('\nNext steps:');
console.log(`1. Review the generated test skeleton`);
console.log(`2. Add test cases for your specific functionality`);
console.log(`3. Run: pnpm test ${testPath} -- --watch`);

// Template generators

function generateUtilityTest(fileName, exports) {
  const imports = exports.map((exp) => `  ${exp},`).join('\n') || '  // Add imports here';

  return `import { describe, it, expect, vi } from 'vitest';
import {
${imports}
} from './${fileName}';

describe('${fileName}', () => {
  describe('happy path', () => {
    it.todo('should work as expected');
  });

  describe('edge cases', () => {
    it.todo('should handle null input');
    it.todo('should handle undefined input');
    it.todo('should handle empty input');
  });

  describe('error cases', () => {
    it.todo('should throw on invalid input');
  });
});
`;
}

function generateComponentTest(fileName, exports, isContextComponent) {
  const defaultExport = exports[0] || fileName;
  const imports = exports.length > 1 ? exports.map((e) => `  ${e},`).join('\n') : '';

  return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';
import { ${defaultExport}${imports ? ',\n' + imports : ''} } from './${fileName}';

describe('<${defaultExport} />', () => {
  describe('rendering', () => {
    it.todo('should render with required props');
    it.todo('should render optional content when provided');
    it.todo('should not render optional content when not provided');
  });

  describe('user interactions', () => {
    it.todo('should handle click events');
    it.todo('should handle input changes');
  });

${isContextComponent ? `
  describe('context integration', () => {
    it.todo('should provide context values to children');
    it.todo('should update context when state changes');
  });
` : ''}

  describe('accessibility', () => {
    it.todo('should have proper ARIA labels');
    it.todo('should be keyboard navigable');
  });
});
`;
}

function generateHookTest(hookName, exports) {
  return `import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ${hookName} } from './${hookName}';

describe('${hookName}', () => {
  it.todo('should initialize with default state');

  it.todo('should update state correctly');

  it.todo('should handle side effects');

  it.todo('should cleanup on unmount');

  it.todo('should handle errors gracefully');
});
`;
}

function generateApiRouteTest(fileName, exports) {
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from './route';
import { mockContext } from '@/test/mocks/prismaMock';

describe('POST /api/route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it.todo('should handle valid request');
    it.todo('should return correct status code');
    it.todo('should return proper response format');
  });

  describe('validation', () => {
    it.todo('should validate required fields');
    it.todo('should reject invalid input');
  });

  describe('error handling', () => {
    it.todo('should handle database errors');
    it.todo('should handle authentication errors');
    it.todo('should return proper error messages');
  });

  describe('authorization', () => {
    it.todo('should check user permissions');
    it.todo('should reject unauthorized requests');
  });
});

describe('GET /api/route', () => {
  it.todo('should retrieve data');
  it.todo('should support pagination');
  it.todo('should support filtering');
});
`;
}
