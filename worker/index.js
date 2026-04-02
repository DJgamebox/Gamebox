// Cloudflare Worker - 游戏盒子数据 API
// 部署步骤见 DEPLOY.md

// 管理员密码（请修改为你自己的密码）
const ADMIN_PASSWORD = 'your-admin-password-here';

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    // 404
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  }
};

// 处理游戏数据 API
async function handleGamesAPI(request, env) {
  // GET - 获取游戏数据（公开访问）
  if (request.method === 'GET') {
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

  // POST - 保存游戏数据（需要密码）
  if (request.method === 'POST') {
    try {
      // 验证密码
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const games = body.games || body; // 支持 {games: [...]} 或直接 [...]
      
      // 保存到 KV
      await env.GAMEBOX_DATA.put('games', JSON.stringify(games));
      
      return new Response(JSON.stringify({ 
        success: true, 
        count: games.length,
        message: `成功保存 ${games.length} 款游戏数据`
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

  // 不支持的方法
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// 处理配置数据 API（联系方式、UI配置等）
async function handleConfigAPI(request, env) {
  // GET - 获取配置
  if (request.method === 'GET') {
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

  // POST - 保存配置（需要密码）
  if (request.method === 'POST') {
    try {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const config = await request.json();
      await env.GAMEBOX_DATA.put('config', JSON.stringify(config));
      
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

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}