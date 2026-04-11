const XLSX = require('xlsx');
const fs = require('fs');

// 读取 Excel
const workbook = XLSX.readFile('C:\\Users\\86973\\.openclaw\\workspace\\games_list.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`读取到 ${data.length} 条游戏数据`);

// 转换为 data-embed.js 格式
const games = data.map((row, index) => ({
  id: `game_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  name: row['游戏中文名'] || '',
  nameEn: row['游戏英文名'] || '',
  cover: row['封面图'] || '',
  category: row['游戏类型'] || '',
  size: row['游戏容量'] || '',
  description: row['游戏简介'] || '',
  baiduLink1: row['百度网盘下载地址1'] || '',
  baiduLink2: row['百度网盘下载地址2'] || '',
  thunderLink: row['迅雷云盘下载地址'] || '',
  favorite: false,
  dateAdded: new Date().toLocaleDateString('zh-CN'),
  isDrm: row['游戏类型'] === 'D加密游戏',
  downloadsWeb: 0,
  downloadsApp: 0,
  updateTime: Date.now()
}));

// 生成 data-embed.js 内容（使用 Unicode 转义序列）
const jsContent = `// 游戏数据 - 由后台管理系统自动生成
// 生成时间: ${new Date().toLocaleString('zh-CN')}
// 游戏数量: ${games.length}

const importedGames = ${JSON.stringify(games).replace(/[\u007f-\uffff]/g, function(c) { 
  return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
})};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { importedGames };
}`;

// 保存文件（ASCII 编码，所有中文都是 Unicode 转义）
fs.writeFileSync('C:\\Users\\86973\\Desktop\\网页版盒子\\web\\data-embed.js', jsContent, 'ascii');

console.log('✅ data-embed.js 已生成（Unicode 转义）！');
console.log(`文件大小: ${(fs.statSync('C:\\Users\\86973\\Desktop\\网页版盒子\\web\\data-embed.js').size / 1024).toFixed(2)} KB`);
