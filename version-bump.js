// 自动递增版本号脚本
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 解析当前版本号
const versionParts = packageJson.version.split('.').map(Number);
// 递增最后一位
versionParts[2]++;
// 组装新版本号
const newVersion = versionParts.join('.');

// 更新 package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`版本号已自动递增: ${packageJson.version} -> ${newVersion}`);
