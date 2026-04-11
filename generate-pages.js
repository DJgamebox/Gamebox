const fs = require('fs');
const path = require('path');

// 读取模板
const template = fs.readFileSync('page-template.html', 'utf8');

// 读取数据文件并提取游戏数据
const dataContent = fs.readFileSync('data-embed.js', 'utf8');
const gamesMatch = dataContent.match(/const importedGames = (\[.*?\]);/s);
if (!gamesMatch) {
    console.log('无法找到游戏数据');
    process.exit(1);
}

let games;
try {
    games = JSON.parse(gamesMatch[1]);
} catch(e) {
    console.log('解析失败，尝试修复...');
    try {
        // 使用 eval 来解析 JavaScript 对象
        games = eval(gamesMatch[1]);
    } catch(e2) {
        console.log('解析游戏数据失败:', e2.message);
        process.exit(1);
    }
}

console.log('找到 ' + games.length + ' 个游戏');

// 去重
const nameMap = {};
const uniqueGames = [];
for (const game of games) {
    const safeName = game.name.replace(/[:\\/\\\\*?\"<>|\n\r]/g, '');
    if (!nameMap[safeName]) {
        nameMap[safeName] = true;
        uniqueGames.push({...game, safeName});
    }
}

console.log('去重后: ' + uniqueGames.length + ' 个游戏');

// 生成页面
let created = 0;
for (const game of uniqueGames) {
    const date = game.createdAt ? game.createdAt.substring(0, 10).replace(/-/g, '/') : '2026/03/23';
    const size = game.size || '未知';
    const cover = game.cover || '';
    const desc = game.description || game.name + '是一款' + game.category + '游戏。本站提供' + game.name + '百度网盘、迅雷云盘高速下载，绿色免安装中文版，解压即可玩。';
    
    // 构建下载链接
    let downloadLinks = '';
    if (game.downloadLinks) {
        if (game.downloadLinks.baidu) {
            downloadLinks += '<a href="' + game.downloadLinks.baidu + '" target="_blank" class="download-btn baidu"><img src="../baidu-icon.jpg" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:8px;">百度网盘下载</a>';
        }
        if (game.downloadLinks.baidu2) {
            downloadLinks += '<a href="' + game.downloadLinks.baidu2 + '" target="_blank" class="download-btn baidu"><img src="../baidu-icon.jpg" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:8px;">百度网盘备用</a>';
        }
        if (game.downloadLinks.thunder) {
            downloadLinks += '<a href="' + game.downloadLinks.thunder + '" target="_blank" class="download-btn thunder"><img src="../xunlei-icon.jpg" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:8px;">迅雷云盘下载</a>';
        }
    }
    
    let page = template;
    const hasNameEn = game.nameEn && game.nameEn.trim() !== '';
    // 使用不同的占位符避免冲突
    page = page.replace(/GAME_TITLE_DOWNLOAD/g, game.name + '下载' + (game.nameEn ? '_' + game.nameEn : '') + '_百度网盘_迅雷云盘_免费下载 - 游戏盒子');
    page = page.replace(/GAME_DESCRIPTION/g, game.name + '免费下载，提供百度网盘、迅雷云盘高速下载链接，' + game.category + '游戏，绿色免安装中文版，游戏盒子提供最新最全的单机游戏资源下载。');
    page = page.replace(/GAME_KEYWORDS/g, game.name + '下载,' + game.name + '网盘,' + game.name + '百度云,' + game.category + '游戏下载,单机游戏网盘,游戏盒子');
    page = page.replace(/GAME_CANONICAL/g, 'https://djgamebox.com/games/' + game.safeName + '.html');
    page = page.replace(/EN_DISPLAY/g, hasNameEn ? 'block' : 'none');
    page = page.replace(/EN_NAME/g, hasNameEn ? game.nameEn : '');
    page = page.replace(/GAME_CATEGORY/g, game.category);
    page = page.replace(/GAME_SIZE/g, size);
    page = page.replace(/GAME_DATE/g, date);
    page = page.replace(/GAME_ID/g, game.id);
    page = page.replace(/GAME_COVER/g, cover);
    page = page.replace(/GAME_DESC/g, desc);
    page = page.replace(/DOWNLOAD_LINKS/g, downloadLinks);
    page = page.replace(/GAME_NAME/g, game.name);
    
    fs.writeFileSync(path.join('games', game.safeName + '.html'), page, 'utf8');
    created++;
    if (created % 200 === 0) {
        console.log('已创建 ' + created + ' 个页面');
    }
}

console.log('完成！共创建 ' + created + ' 个游戏页面');
