const fs = require('fs');
const path = require('path');

// 读取游戏数据
const dataPath = path.join(__dirname, 'data-embed.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');

// 提取游戏数据
const gamesMatch = dataContent.match(/const importedGames = (\[.*?\]);/s);
if (!gamesMatch) {
    console.error('无法解析游戏数据');
    process.exit(1);
}

let games = eval(gamesMatch[1]);

// 读取模板
const templatePath = path.join(__dirname, 'page-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// 查找并生成特定游戏
const targetGame = games.find(g => g.name && g.name.includes('神秘海域：盗贼遗产合集'));

if (!targetGame) {
    console.error('未找到游戏');
    process.exit(1);
}

console.log('找到游戏:', targetGame.name);

// 修复游戏名
targetGame.name = '神秘海域：盗贼遗产合集';

// 生成页面
const safeName = targetGame.name.replace(/[\\/:*?"<>|]/g, '_').trim();
const gamesDir = path.join(__dirname, 'games');
const filename = path.join(gamesDir, `${safeName}.html`);

// 准备替换数据
const title = `${targetGame.name}下载_${targetGame.nameEn || '单机游戏'}_百度网盘_迅雷云盘_免费下载 - 游戏盒子`;
const description = `${targetGame.name}免费下载，提供百度网盘、迅雷云盘高速下载链接，${targetGame.category || '单机'}游戏，绿色免安装中文版，游戏盒子提供最新最全的单机游戏资源下载。`;
const keywords = `${targetGame.name}下载,${targetGame.name}网盘,${targetGame.name}百度云,${targetGame.category || '单机'}游戏下载,单机游戏网盘,游戏盒子`;
const canonical = `https://djgamebox.com/games/${safeName}.html`;

// 生成下载按钮
const baiduLink = targetGame.downloadLinks?.baidu || '';
const baidu2Link = targetGame.downloadLinks?.baidu2 || '';
const thunderLink = targetGame.downloadLinks?.thunder || '';

let downloadButtons = '';
if (baiduLink) {
    downloadButtons += `<a href="${baiduLink}" target="_blank" class="download-btn baidu"><i class="fas fa-cloud"></i>百度网盘下载</a>`;
}
if (baidu2Link) {
    downloadButtons += `<a href="${baidu2Link}" target="_blank" class="download-btn baidu"><i class="fas fa-cloud"></i>百度网盘备用</a>`;
}
if (thunderLink) {
    downloadButtons += `<a href="${thunderLink}" target="_blank" class="download-btn thunder"><i class="fas fa-bolt"></i>迅雷云盘下载</a>`;
}

// 替换模板
let html = template;
html = html.replace(/GAME_TITLE_DOWNLOAD/g, title);
html = html.replace(/GAME_DESCRIPTION/g, description);
html = html.replace(/GAME_KEYWORDS/g, keywords);
html = html.replace(/GAME_CANONICAL/g, canonical);
html = html.replace(/GAME_NAME/g, targetGame.name);
html = html.replace(/GAME_ID/g, targetGame.id || targetGame.name);
html = html.replace(/GAME_CATEGORY/g, targetGame.category || '单机游戏');
html = html.replace(/GAME_SIZE/g, targetGame.size || '未知');
html = html.replace(/GAME_COVER/g, targetGame.cover || '');
html = html.replace(/GAME_DATE/g, targetGame.date || '未知');

const enName = targetGame.nameEn || '';
html = html.replace(/EN_NAME/g, enName);
html = html.replace(/EN_DISPLAY/g, enName ? 'block' : 'none');

html = html.replace(/GAME_DOWNLOAD_BUTTONS/g, downloadButtons || '<p style="color:var(--text-secondary)">暂无下载链接</p>');

const gameDesc = targetGame.description || `${targetGame.name}是一款${targetGame.category || '单机'}游戏。本站提供${targetGame.name}百度网盘、迅雷云盘高速下载，绿色免安装中文版，解压即可玩。`;
html = html.replace(/GAME_DESC/g, gameDesc);

// 写入文件
fs.writeFileSync(filename, html, 'utf8');
console.log('✅ 生成成功:', filename);
