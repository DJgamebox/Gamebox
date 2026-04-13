# 游戏盒子 Cloudflare Workers 部署指南

## 架构说明
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   index.html    │────▶│  Cloudflare      │────▶│  Cloudflare KV  │
│   (用户端)      │◀────│  Worker (API)    │◀────│  (数据存储)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              ▲
                              │
┌─────────────────┐           │
│   admin.html    │───────────┘
│   (后台管理)     │
└─────────────────┘
```

## 部署步骤

### 1. 创建 KV 命名空间
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单 **Workers & Pages**
3. 点击 **KV**
4. 点击 **Create a namespace**
5. 名称填：`GAMEBOX_DATA`
6. 点击 **Add**

### 2. 创建 Worker
1. 在 Workers & Pages 页面点击 **Create application**
2. 选择 **Create Worker**
3. 给 Worker 起个名字，如：`gamebox-api`
4. 点击 **Deploy**
5. 点击 **Edit code**
6. 删除默认代码，粘贴 `cloudflare-worker.js` 的内容
7. **修改第 5 行的密码**：`const ADMIN_PASSWORD = '你的密码'`
8. 点击 **Save and deploy**

### 3. 绑定 KV 到 Worker
1. 在 Worker 页面点击 **Settings** 标签
2. 点击左侧 **Variables**
3. 在 **KV Namespace Bindings** 部分点击 **Add binding**
4. Variable name 填：`GAMEBOX_DATA`
5. KV namespace 选择刚才创建的 `GAMEBOX_DATA`
6. 点击 **Deploy**

### 4. 获取 Worker URL
1. 回到 Worker 页面（Triggers 标签）
2. 复制 **URL**（如：`https://gamebox-api.yourname.workers.dev`）
3. 这个 URL 就是你的 API 地址

### 5. 部署后台管理页面
1. 打开 `admin-api.html`（需要创建）
2. 修改第 8 行的 API 地址：`const API_URL = 'https://gamebox-api.yourname.workers.dev'`
3. 把 `admin-api.html` 上传到 Cloudflare Pages（和你的 index.html 同目录）

### 6. 初始化数据
1. 访问 `https://你的域名/admin-api.html`
2. 输入密码（Worker 里设置的密码）
3. 导入游戏数据（可以从现有的 data-embed.js 复制）
4. 点击保存

## 使用说明

### 用户端
- 访问你的域名（如 `https://djgamebox.com`）
- 页面会自动从 API 加载最新游戏数据
- 每 5 分钟自动同步一次

### 管理端
- 访问 `https://你的域名/admin-api.html`
- 输入密码登录
- 修改游戏数据后点击保存
- 用户端会自动获取更新（最多 5 分钟延迟）

## API 接口

### 获取游戏数据
```
GET /api/games
```
返回：
```json
{
  "games": [...]
}
```

### 保存游戏数据
```
POST /api/games
Headers: Authorization: Bearer 你的密码
Body: { "games": [...] } 或直接 [...]
```

### 获取配置
```
GET /api/config
```

### 保存配置
```
POST /api/config
Headers: Authorization: Bearer 你的密码
Body: { ... }
```

## 免费额度
- **Workers**：每天 10 万次请求
- **KV 读取**：每天 10 万次
- **KV 写入**：每天 1 千次

对于游戏盒子场景完全够用。如果超了可以升级到付费版（$5/月）。

## 故障排除

### 数据没有更新
1. 检查 admin.html 里的 API_URL 是否正确
2. 检查 Worker 是否正常运行（在 Dashboard 里查看）
3. 检查 KV 绑定是否正确

### 密码错误
1. 确认 Worker 代码里的 ADMIN_PASSWORD 和 admin.html 里输入的一致
2. 注意区分大小写

### CORS 错误
1. 确认 Worker 代码里有 CORS 响应头
2. 检查 API_URL 的域名是否正确