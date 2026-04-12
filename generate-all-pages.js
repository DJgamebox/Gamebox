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

const games = eval(gamesMatch[1]);

// 读取模板
const templatePath = path.join(__dirname, 'page-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// 确保 games 目录存在
const gamesDir = path.join(__dirname, 'games');
if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
}

let successCount = 0;
let failCount = 0;

games.forEach((game, index) => {
    if (!game.name) return;
    
    try {
        const safeName = game.name.replace(/[\\/:*?"<>|]/g, '_').trim();
        const filename = path.join(gamesDir, `${safeName}.html`);
        
        const title = `${game.name}下载_${game.nameEn || '单机游戏'}_百度网盘_迅雷云盘_免费下载 - 游戏盒子`;
        const description = `${game.name}免费下载，提供百度网盘、迅雷云盘高速下载链接，${game.category || '单机'}游戏，绿色免安装中文版，游戏盒子提供最新最全的单机游戏资源下载。`;
        const keywords = `${game.name}下载,${game.name}网盘,${game.name}百度云,${game.category || '单机'}游戏下载,单机游戏网盘,游戏盒子`;
        const canonical = `https://djgamebox.com/games/${encodeURIComponent(safeName)}.html`;
        
        const baiduLink = game.baiduLink1 || game.downloadLinks?.baidu || '';
        const baidu2Link = game.baiduLink2 || game.downloadLinks?.baidu2 || '';
        const thunderLink = game.thunderLink || game.downloadLinks?.thunder || '';
        
        let downloadButtons = '';
        if (baiduLink) {
            downloadButtons += `<a href="${baiduLink}" target="_blank" class="download-btn baidu"><img src="../images/baidu-icon.png" alt="百度网盘" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;">百度网盘下载</a>`;
        }
        if (baidu2Link) {
            downloadButtons += `<a href="${baidu2Link}" target="_blank" class="download-btn baidu"><img src="../images/baidu-icon.png" alt="百度网盘" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;">百度网盘备用</a>`;
        }
        if (thunderLink) {
            downloadButtons += `<a href="${thunderLink}" target="_blank" class="download-btn thunder"><img src="../images/xunlei-icon.png" alt="迅雷" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;">迅雷云盘下载</a>`;
        }
        
        let html = template;
        html = html.replace(/GAME_TITLE_DOWNLOAD/g, title);
        html = html.replace(/GAME_DESCRIPTION/g, description);
        html = html.replace(/GAME_KEYWORDS/g, keywords);
        html = html.replace(/GAME_CANONICAL/g, canonical);
        html = html.replace(/GAME_NAME/g, game.name);
        html = html.replace(/GAME_ID/g, game.id || game.name);
        html = html.replace(/GAME_CATEGORY/g, game.category || '单机游戏');
        html = html.replace(/GAME_SIZE/g, game.size || '未知');
        html = html.replace(/GAME_COVER/g, game.cover || '');
        html = html.replace(/GAME_DATE/g, game.dateAdded || (game.updateTime ? new Date(game.updateTime).toLocaleDateString('zh-CN') : '未知'));
        
        const enName = game.nameEn || '';
        html = html.replace(/EN_NAME/g, enName);
        html = html.replace(/EN_DISPLAY/g, enName ? 'block' : 'none');
        
        html = html.replace(/GAME_DOWNLOAD_BUTTONS/g, downloadButtons || '<p style="color:var(--text-secondary)">暂无下载链接</p>');
        
        const gameDesc = game.description || `${game.name}是一款${game.category || '单机'}游戏。本站提供${game.name}百度网盘、迅雷云盘高速下载，绿色免安装中文版，解压即可玩。`;
        html = html.replace(/GAME_DESC/g, gameDesc);
        
        fs.writeFileSync(filename, html, 'utf8');
        successCount++;
    } catch (e) {
        console.error('生成失败:', game.name, e.message);
        failCount++;
    }
    
    if ((index + 1) % 200 === 0 || index === games.length - 1) {
        console.log(`进度: ${index + 1}/${games.length} (${successCount} 成功, ${failCount} 失败)`);
    }
});

console.log(`\n✅ 完成! 成功: ${successCount}, 失败: ${failCount}`);
