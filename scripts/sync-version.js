#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 从 package.json 读取当前版本号
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`Syncing version ${version} to src/version.ts...`);

// 更新 version.ts 文件
const versionTsPath = path.join(__dirname, '../src/version.ts');
try {
  const content = fs.readFileSync(versionTsPath, 'utf8');
  const updatedContent = content.replace(
    /export const VERSION = '[\d.]+';/,
    `export const VERSION = '${version}';`
  );

  if (content !== updatedContent) {
    fs.writeFileSync(versionTsPath, updatedContent, 'utf8');
    console.log(`✓ Updated src/version.ts`);
  } else {
    console.log(`- No changes needed in src/version.ts`);
  }
} catch (error) {
  console.error(`Error updating src/version.ts:`, error.message);
}

console.log('\nVersion sync completed!');