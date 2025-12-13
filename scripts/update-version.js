import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Get the latest commit hash (short version)
const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

// Read package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Get base version (remove any existing commit hash if present)
// Split by '-' and take the first part, but only if it matches version pattern (x.y.z)
const versionParts = packageJson.version.split('-');
const baseVersion = versionParts[0].match(/^\d+\.\d+\.\d+/) ? versionParts[0] : packageJson.version;

// Update version with commit hash
const newVersion = `${baseVersion}-${commitHash}`;
packageJson.version = newVersion;

// Write updated package.json
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update About.tsx
const aboutTsxPath = join(rootDir, 'src/pages/About.tsx');
let aboutContent = readFileSync(aboutTsxPath, 'utf-8');

// Replace version in About.tsx (look for the pattern: <p>1.0.0</p> or similar)
// Match any version format including with commit hash
aboutContent = aboutContent.replace(
  /<p>(\d+\.\d+\.\d+(-\w+)?)<\/p>/,
  `<p>${newVersion}</p>`
);

writeFileSync(aboutTsxPath, aboutContent);

console.log(`Version updated to ${newVersion}`);

