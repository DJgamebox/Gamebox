const fs = require('fs');
const path = require('path');

// 读取游戏数据
const dataPath = path.join(__dirname, 'data-embed.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');

const gamesMatch = dataContent.match(/const importedGames = (\[.*?\]);/s);
if (!gamesMatch) {
    console.error('无法解析游戏数据');
    process.exit(1);
}

let games;
try {
    games = eval(gamesMatch[1]);
} catch (e) {
    console.error('解析游戏数据失败:', e);
    process.exit(1);
}

function getSafeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

const today = new Date().toISOString().split('T')[0];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>https://djgamebox.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

// 添加所有游戏页面
for (const game of games) {
    if (!game.name) continue;
    const gameId = game.id || game.name;
    sitemap += `  <url>
    <loc>https://djgamebox.com/games/${gameId}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

sitemap += '</urlset>';

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Sitemap 生成完成！包含 ${games.length + 1} 个 URL`);
