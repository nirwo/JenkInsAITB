#!/usr/bin/env tsx
import { writeFileSync } from 'fs';
import { join } from 'path';

// Create a package.json in dist/server to mark it as CommonJS
const packageJson = {
  type: 'commonjs',
};

writeFileSync(
  join(process.cwd(), 'dist', 'server', 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('✅ Created dist/server/package.json with type: commonjs');
