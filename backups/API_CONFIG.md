# 游戏盒子系统配置说明

## Worker API 地址

**主地址：** `https://gamebox-api-v2.danjiyouxihezii.workers.dev`

**备用地址（自定义域名）：** `https://api.djgamebox.com`

## R2 存储桶

- **封面图存储：** `GAMEBOX_COVERS`
- **KV存储：** `GAMEBOX_KV`

## 各端API配置更新

### 1. 后台管理系统 (admin.html)
已更新为：
```javascript
const API_BASE_URL = 'https://gamebox-api-v2.danjiyouxihezii.workers.dev';
const ADMIN_PASSWORD = 'abc123';
```

### 2. 网页版盒子 (index.html)
需要添加或更新：
```javascript
// 在 <script> 标签中添加
const API_BASE_URL = 'https://gamebox-api-v2.danjiyouxihezii.workers.dev';

// 从API加载游戏数据
async function loadGamesFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games`);
    if (response.ok) {
      const data = await response.json();
      return data.games || [];
    }
  } catch (error) {
    console.error('API加载失败:', error);
  }
  return null;
}

// 获取联系方式
async function loadContactFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contact`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('联系方式加载失败:', error);
  }
  return null;
}

// 提交反馈
async function submitFeedback(feedbackData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    return response.ok;
  } catch (error) {
    console.error('反馈提交失败:', error);
    return false;
  }
}
```

### 3. 桌面客户端版 (index.html - Electron)
已配置为：
```javascript
const API_BASE_URL = 'https://gamebox-api-v2.danjiyouxihezii.workers.dev';
// 或自定义域名
const API_BASE_URL = 'https://api.djgamebox.com';
```

## API 端点列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/games` | GET | 获取游戏列表 |
| `/api/admin/games` | POST | 保存游戏列表（需密码） |
| `/api/admin/game` | POST | 添加/更新单个游戏 |
| `/api/admin/game?id=xxx` | DELETE | 删除游戏（需密码） |
| `/api/contact` | GET | 获取联系方式 |
| `/api/admin/contact` | POST | 保存联系方式（需密码） |
| `/api/feedback` | POST | 提交反馈 |
| `/api/admin/feedbacks` | GET | 获取反馈列表（需密码） |
| `/api/upload` | POST | 上传封面图片 |
| `/api/covers/{filename}` | GET | 获取封面图片 |

## 管理员密码

**密码：** `abc123`

**MD5哈希：** `e99a18c428cb38d5f260853678922e03`

## 数据同步流程

```
后台管理系统修改
        ↓
保存到 Worker API (KV)
        ↓
网页版/桌面版自动拉取
```

## 封面图片存储

1. **后台上传封面** → 上传到 Worker R2
2. **R2存储路径** → `covers/{gameId}.jpg`
3. **访问URL** → `https://gamebox-api-v2.danjiyouxihezii.workers.dev/api/covers/{filename}`
4. **桌面端缓存** → 自动下载到本地 `covers/` 文件夹

## 注意事项

1. **CORS已配置** - Worker已允许跨域访问
2. **自动同步** - 后台修改后，客户端每5分钟自动拉取
3. **本地缓存** - 桌面端优先使用本地缓存，后台更新后自动同步
4. **反馈查看** - 在后台管理系统"查看反馈"按钮中查看所有反馈

## 部署状态

- ✅ Worker已部署: `gamebox-api-v2`
- ✅ R2存储桶: `GAMEBOX_COVERS`
- ✅ KV命名空间: `GAMEBOX_KV`
- ✅ 自定义域名: `api.djgamebox.com`
