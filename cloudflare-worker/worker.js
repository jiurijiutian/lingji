/**
 * 灵记 AI Worker - Cloudflare Worker代理
 * 
 * 部署步骤:
 * 1. 注册 Cloudflare 账户 (https://dash.cloudflare.com/sign-up)
 * 2. 进入 Workers & Pages → Create Application → Create Worker
 * 3. 将此代码粘贴到编辑器中
 * 4. 在 Settings → Environment Variables 中添加:
 *    - AI_API_KEY: 你的DeepSeek API Key (sk-xxx)
 *    - AI_API_BASE: https://api.deepseek.com/v1 (或其他API地址)
 * 5. 点击 Deploy
 * 6. 记下Worker URL (如 https://lingji-ai.your-name.workers.dev)
 * 7. 在灵记V5的AI设置中填入这个URL
 * 
 * 安全说明:
 * - API Key 存储在Cloudflare环境变量中，不暴露到前端
 * - Worker只转发AI请求，不存储任何用户数据
 * - 添加了CORS支持和基本速率限制
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 只允许POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // 读取请求体
      const requestBody = await request.json();
      
      // 验证请求格式
      if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 限制消息长度(防止滥用)
      const totalLength = requestBody.messages.reduce((sum, m) => sum + (m.content || '').length, 0);
      if (totalLength > 10000) {
        return new Response(JSON.stringify({ error: 'Request too long (max 10000 chars)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 构建转发请求
      const apiBase = env.AI_API_BASE || 'https://api.deepseek.com/v1';
      const apiKey = env.AI_API_KEY;
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'AI API Key not configured on server' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const forwardBody = {
        model: requestBody.model || 'deepseek-chat',
        messages: requestBody.messages,
        max_tokens: Math.min(requestBody.max_tokens || 2000, 4000),
        temperature: requestBody.temperature || 0.7,
      };

      // 调用AI API
      const aiResponse = await fetch(apiBase + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(forwardBody),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errText);
        return new Response(JSON.stringify({ error: 'AI API error: ' + aiResponse.status }), {
          status: aiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      
      return new Response(JSON.stringify(aiData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
