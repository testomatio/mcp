import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPackagePath = path.resolve(__dirname, '../package.json');
const enterprisePackagePath = path.resolve(__dirname, '../packages/enterprise/package.json');

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
const enterprisePackage = JSON.parse(fs.readFileSync(enterprisePackagePath, 'utf8'));

const nextEnterprisePackage = {
  ...enterprisePackage,
  version: rootPackage.version,
  dependencies: {
    ...enterprisePackage.dependencies,
    '@testomatio/mcp': rootPackage.version,
  },
};

const currentSerialized = `${JSON.stringify(enterprisePackage, null, 2)}\n`;
const nextSerialized = `${JSON.stringify(nextEnterprisePackage, null, 2)}\n`;

if (currentSerialized !== nextSerialized) {
  fs.writeFileSync(enterprisePackagePath, nextSerialized, 'utf8');
  console.log(
    `Synchronized packages/enterprise/package.json to version ${rootPackage.version} and dependency @testomatio/mcp ${rootPackage.version}`
  );
} else {
  console.log(`packages/enterprise/package.json is already synchronized with root version ${rootPackage.version}`);
}
