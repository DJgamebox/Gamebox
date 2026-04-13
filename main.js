const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

// 读取版本号
const APP_VERSION = require('./package.json').version;

let mainWindow;
let gamePidList = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    backgroundColor: '#1e2126',
    icon: path.join(__dirname, 'app-icon.png')
  });
  Menu.setApplicationMenu(null);
  mainWindow.loadFile('index.html');
}

// 选择EXE文件（支持.bat/.cmd）
ipcMain.handle('select-exe-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: '游戏程序', extensions: ['exe', 'bat', 'cmd'] }]
  });

  if (canceled) {
    return { canceled: true, error: '未选择文件' };
  }

  const exePath = filePaths[0];
  return {
    success: true,
    path: exePath
  };
});

// 启动游戏（适配.bat/.cmd）
ipcMain.handle('start-game', async (_, exePath) => {
  try {
    let child;
    const ext = path.extname(exePath).toLowerCase();
    
    if (ext === '.bat' || ext === '.cmd') {
      child = spawn('cmd.exe', ['/c', exePath], {
        cwd: path.dirname(exePath),
        detached: true,
        stdio: 'ignore',
        shell: true
      });
    } else {
      child = spawn(exePath, [], {
        cwd: path.dirname(exePath),
        detached: true,
        stdio: 'ignore'
      });
    }
    
    gamePidList.push(child.pid);
    child.unref();
    return true;
  } catch (e) {
    return false;
  }
});

// 停止游戏
ipcMain.handle('stop-game', () => {
  gamePidList.forEach(pid => {
    exec(`taskkill /F /PID ${pid} /T`, () => {});
  });
  gamePidList = [];
  return true;
});

// 获取版本号
ipcMain.handle('get-version', () => APP_VERSION);

// 封面图缓存目录
const COVERS_DIR = 'covers';

// 获取应用路径
ipcMain.handle('get-app-path', () => app.getAppPath());

// 检查封面图是否存在
ipcMain.handle('check-cover-exists', (_, coverPath) => {
  try {
    return fs.existsSync(coverPath);
  } catch (e) {
    return false;
  }
});

// 创建目录
ipcMain.handle('mkdir', (_, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (e) {
    console.error('创建目录失败:', e);
    return false;
  }
});

// 写入文件
ipcMain.handle('write-file', (_, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return true;
  } catch (e) {
    console.error('写入文件失败:', e);
    return false;
  }
});

// 读取目录
ipcMain.handle('readdir', (_, dirPath) => {
  try {
    return fs.readdirSync(dirPath);
  } catch (e) {
    return [];
  }
});

// 读取文件
ipcMain.handle('read-file', (_, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
});

// 检查文件是否存在
ipcMain.handle('exists', (_, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
});

// 下载并保存封面图
ipcMain.handle('download-cover', async (_, gameId, onlineUrl, appPath) => {
  try {
    const coverDir = path.join(appPath, COVERS_DIR);
    const coverPath = path.join(coverDir, `${gameId}.jpg`);
    const metaPath = path.join(coverDir, `${gameId}.json`);
    
    // 确保目录存在
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
    }
    
    // 下载图片
    const response = await fetch(onlineUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(coverPath, Buffer.from(buffer));
    
    // 保存元数据
    const meta = {
      url: onlineUrl,
      downloadedAt: Date.now(),
      size: buffer.byteLength
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta));
    
    return { success: true, coverPath };
  } catch (e) {
    console.error('下载封面图失败:', e);
    return { success: false, error: e.message };
  }
});

// 检查封面是否需要更新
ipcMain.handle('check-cover-update', (_, gameId, onlineUrl, appPath) => {
  try {
    const coverDir = path.join(appPath, COVERS_DIR);
    const coverPath = path.join(coverDir, `${gameId}.jpg`);
    const metaPath = path.join(coverDir, `${gameId}.json`);
    
    // 检查封面是否存在
    if (!fs.existsSync(coverPath)) {
      return { needUpdate: true, reason: 'not_exists' };
    }
    
    // 检查元数据
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (meta.url !== onlineUrl) {
          return { needUpdate: true, reason: 'url_changed' };
        }
        return { needUpdate: false };
      } catch (e) {
        return { needUpdate: true, reason: 'meta_error' };
      }
    }
    
    return { needUpdate: true, reason: 'no_meta' };
  } catch (e) {
    return { needUpdate: true, reason: 'error' };
  }
});

// 版本号比较函数
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

// 检查版本更新（在 main 进程中显示原生对话框）
async function checkForUpdates() {
  try {
    const response = await fetch('https://api.djgamebox.com/api/version');
    if (!response.ok) return;
    
    const versionInfo = await response.json();
    const latestVersion = versionInfo.version;
    
    // 比较版本号
    if (compareVersions(latestVersion, APP_VERSION) > 0) {
      // 有新版本
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 ${latestVersion}`,
        detail: versionInfo.releaseNotes || `当前版本: ${APP_VERSION}\n建议更新到最新版本`,
        buttons: ['立即下载', '稍后提醒'],
        defaultId: 0,
        cancelId: 1
      });
      
      if (result.response === 0) {
        // 打开下载页面
        const downloadUrl = versionInfo.downloadUrl || 'https://djgamebox.com/download';
        shell.openExternal(downloadUrl);
      }
    }
  } catch (error) {
    console.log('版本检查失败:', error.message);
  }
}

app.whenReady().then(() => {
  createWindow();
  // 延迟检查更新（等窗口加载完成）
  setTimeout(checkForUpdates, 3000);
});
app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
