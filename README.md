# NodeLoc OAuth2 登录系统 - Vercel 部署指南

## 项目概述

这是一个基于 Next.js 构建的现代化登录系统，使用 NodeLoc OAuth2 进行用户认证。项目具有完整的登录流程、响应式设计，并支持 Vercel 一键部署。

## 功能特性

- ✅ **完整的 OAuth2 认证流程**：基于 NodeLoc 官方文档实现
- ✅ **响应式设计**：完美适配移动端和桌面端
- ✅ **现代化 UI**：使用 Tailwind CSS 构建的美观界面
- ✅ **错误处理**：完善的错误提示和处理机制
- ✅ **安全性**：HTTP-only cookies，CSRF 保护
- ✅ **TypeScript 支持**：完整的类型定义

## 快速开始

### 1. NodeLoc 应用注册

在部署前，您需要在 NodeLoc 注册 OAuth2 应用：

1. 访问 [NodeLoc Apps 管理页面](https://conn.nodeloc.cc/apps)
2. 点击 "Create New Application"
3. 填写应用信息：
   - **应用名称**: 您的应用名称
   - **描述**: 应用描述
   - **重定向URI**: `https://your-domain.vercel.app/api/auth/callback`
   - **允许的组**: `trust_level_0` (或根据需要选择)
4. 保存 **Client ID** 和 **Client Secret**（只显示一次）

### 2. Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fnodeloc-oauth-login)

点击上方按钮，或按以下步骤手动部署：

#### 方法一：直接从 GitHub 部署

1. 将项目代码推送到 GitHub 仓库
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "New Project"
4. 导入您的 GitHub 仓库
5. 配置环境变量（见下方）
6. 点击 "Deploy"

#### 方法二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod
```

### 3. 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|----|----|
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` | 您的 Client ID | NodeLoc 应用的客户端 ID |
| `OAUTH_CLIENT_SECRET` | 您的 Client Secret | NodeLoc 应用的客户端密钥 |
| `NEXT_PUBLIC_OAUTH_REDIRECT_URI` | `https://your-domain.vercel.app/api/auth/callback` | OAuth2 回调地址 |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | 应用的完整 URL |
| `NEXTAUTH_SECRET` | 随机字符串 | 会话加密密钥 |

#### 生成 NEXTAUTH_SECRET

```bash
# 方法1: 使用 openssl
openssl rand -base64 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. 域名配置

部署完成后：

1. 记录 Vercel 分配的域名（如：`your-app-name.vercel.app`）
2. 返回 NodeLoc Apps 管理页面
3. 更新重定向 URI 为实际的域名：`https://your-app-name.vercel.app/api/auth/callback`

## 本地开发

### 环境准备

1. Node.js 18+ 
2. npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 环境变量配置

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入您的 NodeLoc 应用信息：

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
├── src/
│   ├── components/          # React 组件
│   │   ├── LoginForm.tsx    # 登录表单组件
│   │   ├── LoadingSpinner.tsx # 加载动画组件
│   │   └── ProtectedRoute.tsx # 路由保护组件
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 认证状态管理
│   ├── pages/               # Next.js 页面
│   │   ├── api/auth/        # API 路由
│   │   │   ├── callback.ts  # OAuth2 回调处理
│   │   │   ├── logout.ts    # 退出登录
│   │   │   └── user.ts      # 用户信息
│   │   ├── _app.tsx         # App 组件
│   │   ├── _document.tsx    # Document 组件
│   │   ├── index.tsx        # 登录页面
│   │   └── dashboard.tsx    # 用户控制台
│   └── styles/              # 样式文件
│       └── globals.css      # 全局样式
├── .env.example             # 环境变量模板
├── .env.local               # 本地环境变量
├── .gitignore               # Git 忽略文件
├── vercel.json              # Vercel 配置
├── next.config.js           # Next.js 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

## 主要技术栈

- **前端框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS
- **状态管理**: React Context
- **表单处理**: React Hook Form
- **通知提示**: React Hot Toast
- **HTTP 客户端**: Axios
- **Cookie 管理**: js-cookie
- **语言**: TypeScript

## OAuth2 流程说明

1. **用户点击登录** → 重定向到 NodeLoc 授权页面
2. **用户授权** → NodeLoc 重定向回调地址并携带授权码
3. **服务端处理** → 使用授权码交换访问令牌
4. **获取用户信息** → 解析 ID Token 或调用用户信息端点
5. **设置会话** → 存储令牌和用户信息到安全 Cookie
6. **重定向到控制台** → 登录完成

## 安全考虑

- ✅ 使用 HTTPS（生产环境）
- ✅ HTTP-only Cookies 存储敏感令牌
- ✅ CSRF 保护（state 参数）
- ✅ 客户端密钥服务端存储
- ✅ 令牌过期处理
- ✅ 错误信息不泄露敏感信息

## 故障排查

### 常见问题

1. **"OAuth配置缺失" 错误**
   - 检查环境变量是否正确配置
   - 确认 Vercel 环境变量已保存并重新部署

2. **"重定向URI不匹配" 错误**
   - 确认 NodeLoc 应用中的重定向 URI 与实际部署域名一致
   - 检查 HTTPS/HTTP 协议是否匹配

3. **"令牌交换失败" 错误**
   - 验证 Client Secret 是否正确
   - 检查网络连接和 NodeLoc 服务状态

4. **样式显示异常**
   - 确认 Tailwind CSS 正确安装
   - 检查生产环境是否正确构建

### 调试方法

开启开发模式查看详细日志：

```bash
npm run dev
```

检查浏览器控制台和网络请求，查看具体错误信息。

## 更新部署

### 自动部署

连接 GitHub 仓库后，每次推送到主分支都会自动触发部署。

### 手动部署

```bash
vercel --prod
```

## 许可证

MIT License - 可自由使用和修改。

## 支持与反馈

如有问题或建议，请：

1. 查看 [NodeLoc OAuth2 文档](https://www.nodeloc.com/t/topic/46097)
2. 检查项目 Issues
3. 提交新的 Issue 或 Pull Request

---

**注意**: 请务必保护好您的 Client Secret，不要将其提交到公开仓库中。