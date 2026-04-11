const fs = require('fs');
const path = require('path');

// 读取游戏数据
const dataPath = path.join(__dirname, 'data-embed.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');
// 去除 UTF-8 BOM（如果有）
if (dataContent.charCodeAt(0) === 0xFEFF) {
    dataContent = dataContent.substring(1);
}

// 提取游戏数据（简单解析）
const gamesMatch = dataContent.match(/const importedGames = (\[.*?\]);/s);
if (!gamesMatch) {
    console.error('无法解析游戏数据');
    process.exit(1);
}

let games;
try {
    // 使用 JSON.parse 替代 eval，避免编码问题
    games = JSON.parse(gamesMatch[1]);
} catch (e) {
    console.error('解析游戏数据失败:', e);
    process.exit(1);
}

console.log(`找到 ${games.length} 款游戏`);

// 读取 page-template.html 模板
const templatePath = path.join(__dirname, 'page-template.html');
let template;
try {
    template = fs.readFileSync(templatePath, 'utf8');
    console.log('已加载 page-template.html 模板');
} catch (e) {
    console.error('读取 page-template.html 失败:', e.message);
    process.exit(1);
}

// 创建 games 目录
const gamesDir = path.join(__dirname, 'games');
if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
}

// 生成安全的文件名
function getSafeFilename(name) {
    return name.replace(/[\\/:*?"<>|+]/g, '_').trim();
}

// 生成游戏详情页 HTML
function generateGamePage(game, index) {
    const safeName = getSafeFilename(game.name);
    
    // 准备替换数据
    const title = `${game.name}下载_${game.nameEn || '单机游戏'}_百度网盘_迅雷云盘_免费下载 - 游戏盒子`;
    const description = `${game.name}免费下载，提供百度网盘、迅雷云盘高速下载链接，${game.category || '单机'}游戏，绿色免安装中文版，游戏盒子提供最新最全的单机游戏资源下载。`;
    const keywords = `${game.name}下载,${game.name}网盘,${game.name}百度云,${game.category || '单机'}游戏下载,单机游戏网盘,游戏盒子`;
    const canonical = `https://djgamebox.com/games/${safeName}.html`;
    
    // 生成下载按钮（使用 logo 图片）
    const baiduLink = game.downloadLinks?.baidu || '';
    const baidu2Link = game.downloadLinks?.baidu2 || '';
    const thunderLink = game.downloadLinks?.thunder || '';
    
    let downloadButtons = '';
    if (baiduLink) {
        downloadButtons += `<a href="${baiduLink}" target="_blank" class="download-btn baidu"><img src="../baidu-logo.jpg" alt="百度网盘" style="width:20px;height:20px;margin-right:8px;border-radius:4px;">百度网盘下载</a>`;
    }
    if (baidu2Link) {
        downloadButtons += `<a href="${baidu2Link}" target="_blank" class="download-btn baidu"><img src="../baidu-logo.jpg" alt="百度网盘" style="width:20px;height:20px;margin-right:8px;border-radius:4px;">百度网盘备用</a>`;
    }
    if (thunderLink) {
        downloadButtons += `<a href="${thunderLink}" target="_blank" class="download-btn thunder"><img src="../xunlei-logo.jpg" alt="迅雷云盘" style="width:20px;height:20px;margin-right:8px;border-radius:4px;">迅雷云盘下载</a>`;
    }
    
    // 替换模板中的占位符
    let html = template;
    
    // 标题和 meta
    html = html.replace(/GAME_TITLE_DOWNLOAD/g, title);
    html = html.replace(/GAME_DESCRIPTION/g, description);
    html = html.replace(/GAME_KEYWORDS/g, keywords);
    html = html.replace(/GAME_CANONICAL/g, canonical);
    
    // 游戏信息
    html = html.replace(/GAME_NAME/g, game.name);
    html = html.replace(/GAME_ID/g, game.id || game.name);
    html = html.replace(/GAME_CATEGORY/g, game.category || '单机游戏');
    html = html.replace(/GAME_SIZE/g, game.size || '未知');
    html = html.replace(/GAME_COVER/g, game.cover || '');
    
    // 英文名（如果没有则隐藏）
    const enName = game.nameEn || '';
    html = html.replace(/EN_NAME/g, enName);
    html = html.replace(/EN_DISPLAY/g, enName ? 'block' : 'none');
    
    // 下载按钮
    html = html.replace(/DOWNLOAD_LINKS/g, downloadButtons || '<p style="color:var(--text-secondary)">暂无下载链接</p>');
    
    // 游戏描述
    const gameDesc = game.description || `${game.name}是一款${game.category || '单机'}游戏。本站提供${game.name}百度网盘、迅雷云盘高速下载，绿色免安装中文版，解压即可玩。`;
    html = html.replace(/GAME_DESC/g, gameDesc);
    
    // 发布日期
    // 更新时间 - 使用 updatedAt 字段并格式化为本地时间
    const updatedAt = game.updatedAt || game.date;
    let formattedDate = '未知';
    if (updatedAt) {
        try {
            const date = new Date(updatedAt);
            formattedDate = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (e) {
            formattedDate = updatedAt;
        }
    }
    html = html.replace(/GAME_DATE/g, formattedDate);
    
    return html;
}

// 生成所有游戏页面
let successCount = 0;
let failCount = 0;

console.log('开始生成游戏页面...');

for (let i = 0; i < games.length; i++) {
    const game = games[i];
    if (!game.name) continue;
    
    // 使用数字ID作为文件名，避免中文文件名编码问题
    const gameId = game.id || `game_${i}`;
    const safeName = getSafeFilename(game.name);
    const filename = path.join(gamesDir, `${gameId}.html`);
    // 保存ID到名称的映射，用于URL重写
    game._urlName = safeName;
    
    try {
        const html = generateGamePage(game, i);
        // 使用 Buffer 确保文件名编码正确
        const filenameBuffer = Buffer.from(filename, 'utf8');
        fs.writeFileSync(filenameBuffer, html, 'utf8');
        successCount++;
        
        if (successCount % 100 === 0) {
            console.log(`已生成 ${successCount}/${games.length} 个页面...`);
        }
    } catch (e) {
        console.error(`生成 ${game.name} 失败:`, e.message);
        failCount++;
    }
}

console.log(`\n完成！成功: ${successCount}, 失败: ${failCount}`);
console.log(`游戏页面保存在: ${gamesDir}`);
