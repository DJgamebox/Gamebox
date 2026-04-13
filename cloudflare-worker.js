// Cloudflare Worker - 游戏盒子数据 API
// 部署步骤见 DEPLOY.md

// 管理员密码（请修改为你自己的密码）
const ADMIN_PASSWORD = 'abc123';

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API 路由
    if (url.pathname === '/api/games') {
      return handleGamesAPI(request, env);
    }
    
    if (url.pathname === '/api/config') {
      return handleConfigAPI(request, env);
    }

    // 用户认证相关 API
    if (url.pathname === '/api/auth/register') {
      return handleRegister(request, env);
    }

    if (url.pathname === '/api/auth/login') {
      return handleLogin(request, env);
    }

    if (url.pathname === '/api/favorites') {
      return handleFavorites(request, env);
    }

    // 管理员 API
    if (url.pathname === '/api/admin/games') {
      return handleAdminGames(request, env);
    }

    if (url.pathname === '/api/admin/contact') {
      return handleAdminContact(request, env);
    }

    if (url.pathname === '/api/admin/feedbacks') {
      return handleAdminFeedbacks(request, env);
    }

    if (url.pathname === '/api/admin/users') {
      return handleAdminUsers(request, env);
    }

    if (url.pathname === '/api/contact') {
      return handleContactAPI(request, env);
    }

    if (url.pathname === '/api/feedback') {
      return handleFeedbackAPI(request, env);
    }

    // 404
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  }
};

// 处理游戏数据 API（公开访问）
async function handleGamesAPI(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await env.GAMEBOX_DATA.get('games');
    const games = data ? JSON.parse(data) : [];
    
    return new Response(JSON.stringify({ games }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理配置数据 API（公开访问）
async function handleConfigAPI(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await env.GAMEBOX_DATA.get('config');
    const config = data ? JSON.parse(data) : {};
    
    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 用户注册
async function handleRegister(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username, password } = await request.json();
    
    if (!username || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: '用户名不能为空，密码至少6位' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 检查用户是否已存在
    const usersData = await env.GAMEBOX_DATA.get('users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    if (users.find(u => u.username === username)) {
      return new Response(JSON.stringify({ error: '用户名已存在' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 创建新用户
    const newUser = {
      id: generateId(),
      username,
      password, // 实际生产环境应该加密
      createdAt: new Date().toISOString(),
      favorites: []
    };

    users.push(newUser);
    await env.GAMEBOX_DATA.put('users', JSON.stringify(users));

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: userWithoutPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 用户登录
async function handleLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username, password } = await request.json();
    
    const usersData = await env.GAMEBOX_DATA.get('users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: userWithoutPassword 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 处理用户收藏
async function handleFavorites(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (request.method === 'GET') {
      // 获取用户收藏
      const usersData = await env.GAMEBOX_DATA.get('users');
      const users = usersData ? JSON.parse(usersData) : [];
      const user = users.find(u => u.id === userId);
      
      return new Response(JSON.stringify({ 
        favorites: user ? user.favorites || [] : [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      // 更新用户收藏
      const { favorites, userId: uid } = await request.json();
      
      const usersData = await env.GAMEBOX_DATA.get('users');
      const users = usersData ? JSON.parse(usersData) : [];
      const userIndex = users.findIndex(u => u.id === uid);
      
      if (userIndex >= 0) {
        users[userIndex].favorites = favorites;
        await env.GAMEBOX_DATA.put('users', JSON.stringify(users));
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 管理员 - 游戏数据管理
async function handleAdminGames(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 验证管理员密码
    const body = await request.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const games = body.games || [];
    await env.GAMEBOX_DATA.put('games', JSON.stringify(games));
    
    return new Response(JSON.stringify({ 
      success: true, 
      count: games.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 管理员 - 联系方式管理
async function handleAdminContact(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    if (body.adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const config = await env.GAMEBOX_DATA.get('config');
    const configData = config ? JSON.parse(config) : {};
    configData.contact = body.contact;
    
    await env.GAMEBOX_DATA.put('config', JSON.stringify(configData));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 管理员 - 反馈管理
async function handleAdminFeedbacks(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 验证管理员密码
    const auth = request.headers.get('X-Admin-Password');
    if (auth !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const feedbacksData = await env.GAMEBOX_DATA.get('feedbacks');
    const feedbacks = feedbacksData ? JSON.parse(feedbacksData) : [];
    
    return new Response(JSON.stringify({ feedbacks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 管理员 - 用户列表
async function handleAdminUsers(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 验证管理员密码
    const auth = request.headers.get('X-Admin-Password');
    if (auth !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const usersData = await env.GAMEBOX_DATA.get('users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    // 返回用户列表（不包含密码）
    const usersWithoutPassword = users.map(u => {
      const { password, favorites, ...userInfo } = u;
      return userInfo;
    });
    
    return new Response(JSON.stringify({ users: usersWithoutPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 公开 - 联系方式
async function handleContactAPI(request, env) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const config = await env.GAMEBOX_DATA.get('config');
    const configData = config ? JSON.parse(config) : {};
    
    return new Response(JSON.stringify({ 
      items: configData.contact?.items || [
        { label: '官方QQ', value: '984786923' },
        { label: '官方邮箱', value: 'danjiyouxihezi@gmail.com' }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 公开 - 提交反馈
async function handleFeedbackAPI(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const feedback = await request.json();
    feedback.id = generateId();
    feedback.createdAt = new Date().toISOString();
    feedback.status = 'pending';

    const feedbacksData = await env.GAMEBOX_DATA.get('feedbacks');
    const feedbacks = feedbacksData ? JSON.parse(feedbacksData) : [];
    feedbacks.push(feedback);
    
    await env.GAMEBOX_DATA.put('feedbacks', JSON.stringify(feedbacks));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
