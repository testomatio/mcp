import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let cachedVersion;

export function getPackageVersion() {
  if (cachedVersion) {
    return cachedVersion;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const raw = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);
  cachedVersion = pkg.version || '0.0.0';
  return cachedVersion;
}
