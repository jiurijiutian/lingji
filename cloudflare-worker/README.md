# 灵记 AI Worker 部署指南

## 概述
这个Cloudflare Worker充当AI API的安全代理，保护你的API Key不暴露到前端。

## 前提条件
- Cloudflare账户（免费版即可，每天10万次请求免费额度）
- DeepSeek API Key（从 https://platform.deepseek.com 获取）

## 部署步骤

### 1. 注册Cloudflare
访问 https://dash.cloudflare.com/sign-up 注册

### 2. 创建Worker
1. 登录后进入 **Workers & Pages**
2. 点击 **Create Application** → **Create Worker**
3. 给Worker取名，如 `lingji-ai`
4. 点击 **Deploy**

### 3. 粘贴代码
1. 点击 **Edit Code**
2. 将 `worker.js` 的内容全部粘贴进去
3. 点击 **Deploy**

### 4. 配置环境变量
1. 进入Worker的 **Settings** → **Variables**
2. 添加以下变量：
   - `AI_API_KEY` = 你的DeepSeek API Key (如 `sk-xxxxxxxx`)
   - `AI_API_BASE` = `https://api.deepseek.com/v1`
3. 点击 **Save**

### 5. 获取Worker URL
Worker URL格式为: `https://lingji-ai.你的名字.workers.dev`
记下这个URL

### 6. 在灵记V5中配置
1. 打开灵记V5
2. 点击工具栏的 🤖 按钮 → ⚙ 设置
3. 在"API端点"中填入Worker URL
4. 选择模型为"DeepSeek Chat"
5. API Key留空（已通过Worker代理）
6. 点击保存

## 成本估算
- Cloudflare Worker: 免费（10万次/天）
- DeepSeek API:
  - deepseek-chat: 约 ¥1/百万输入token, ¥2/百万输出token
  - 日常写作辅助，每月费用约 ¥1-5

## 如果换用其他AI
修改环境变量 `AI_API_BASE` 即可：
- OpenAI: `https://api.openai.com/v1`
- 其他兼容OpenAI格式的服务

## 安全说明
- API Key存储在Cloudflare环境变量中，前端无法读取
- Worker不存储任何用户数据
- 建议在Worker中添加速率限制（当前版本有基本长度限制）
