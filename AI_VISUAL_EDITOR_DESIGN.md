# AI Visual Editor - 技术设计方案

## 🎯 项目愿景

基于 Excalidraw + GodSVG，构建一个**AI驱动的可视化编辑器 SaaS 平台**，支持：
- 💬 通过自然语言对话自动生成 SVG/Mermaid/图表代码
- ✏️ 结构化语言编辑 + 图形手动编辑的混合模式
- 🌐 Web 浏览器、PC 客户端、移动 App 全平台支持
- 🤖 多大模型 API 接入（GPT/Claude/Gemini/国内模型）

---

## 📋 目录

1. [整体架构](#整体架构)
2. [核心功能模块](#核心功能模块)
3. [技术栈选型](#技术栈选型)
4. [AI 对话系统](#ai-对话系统)
5. [跨平台方案](#跨平台方案)
6. [SaaS 架构](#saas-架构)
7. [实施路线图](#实施路线图)
8. [成本和盈利模式](#成本和盈利模式)

---

## 🏗️ 整体架构

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     客户端层 (Multi-Platform)                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Web Browser │ Desktop App  │  Mobile App  │   VS Code Ext  │
│   (React)    │  (Tauri)     │ (React Native│   (Extension)  │
│              │              │  /Flutter)   │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
                            ↓ ↑ (WebSocket/HTTP)
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Cloudflare Workers)          │
│           • 认证/授权  • 限流  • 日志  • CDN              │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      后端服务层 (Serverless)                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ User Service │  AI Service  │ File Service │ Collab Service │
│  (Auth/Sub)  │ (LLM Proxy)  │  (Storage)   │  (WebSocket)   │
└──────────────┴──────────────┴──────────────┴────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                         数据层                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Postgres   │    Redis     │   R2/S3      │   Vector DB    │
│  (用户/订阅) │   (缓存)     │ (文件存储)   │ (AI Embeddings)│
└──────────────┴──────────────┴──────────────┴────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      外部服务集成                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  OpenAI API  │  Claude API  │  Gemini API  │ 国内模型 API   │
│              │              │              │ (通义/文心等)  │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## 🎨 核心功能模块

### 1. AI 对话引擎 (AI Conversation Engine)

#### 功能特性
- 📝 **多轮对话**: 支持上下文理解的连续对话
- 🎨 **智能生成**: 
  - SVG 代码生成和优化
  - Mermaid 图表生成
  - Excalidraw JSON 生成
  - Flowchart/UML/架构图
- 🔄 **增量编辑**: 基于现有内容进行修改
- 🧠 **意图识别**: 理解用户想要创建/修改的内容
- 🎯 **预设模板**: 快速生成常用图形（思维导图、流程图等）

#### 技术实现
```typescript
interface AIEngine {
  // 对话接口
  chat(message: string, context: ConversationContext): Promise<AIResponse>
  
  // 生成接口
  generateSVG(prompt: string, options?: GenerateOptions): Promise<SVGCode>
  generateMermaid(prompt: string, options?: GenerateOptions): Promise<MermaidCode>
  generateExcalidraw(prompt: string): Promise<ExcalidrawJSON>
  
  // 编辑接口
  editContent(content: string, instruction: string): Promise<string>
  optimizeSVG(svg: string): Promise<string>
  
  // 多模型切换
  switchModel(model: AIModel): void
}

type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'qwen' | 'custom'
```

---

### 2. 混合编辑器 (Hybrid Editor)

#### 核心组件

##### A. 代码编辑器 (Code Panel)
- 基于 Monaco Editor / CodeMirror
- 语法高亮：SVG、Mermaid、JSON
- 实时验证和错误提示
- 代码片段和自动补全
- Git 版本控制集成

##### B. 图形编辑器 (Visual Panel)
- Excalidraw 集成（手绘风格）
- GodSVG 集成（精确 SVG 编辑）
- 实时预览和同步
- 图层管理
- 对象选择和变换

##### C. AI 助手面板 (AI Chat Panel)
- 浮动/停靠聊天窗口
- 快捷指令库
- 历史对话记录
- 生成内容预览

#### 布局模式
```typescript
enum LayoutMode {
  SPLIT_HORIZONTAL,  // 水平分屏：代码 | 图形
  SPLIT_VERTICAL,    // 垂直分屏：代码 / 图形
  CODE_ONLY,         // 纯代码模式
  VISUAL_ONLY,       // 纯图形模式
  THREE_PANEL,       // 三栏：代码 | 图形 | AI
  FOCUS              // 专注模式（全屏）
}
```

---

### 3. 协作系统 (Collaboration System)

#### 实时协作功能
- 👥 多人同时编辑
- 🎨 光标和选择区域显示
- 💬 实时评论和标注
- 📝 变更历史和回滚
- 🔔 通知和提醒

#### 技术实现
- **协议**: WebSocket + CRDT (Conflict-free Replicated Data Type)
- **库选择**: 
  - Yjs (推荐) - 成熟的 CRDT 实现
  - Automerge - 另一个选择
- **同步策略**: Operational Transform (OT)

```typescript
interface CollabManager {
  // 房间管理
  createRoom(projectId: string): Promise<Room>
  joinRoom(roomId: string, user: User): Promise<void>
  leaveRoom(roomId: string): void
  
  // 同步操作
  broadcast(operation: Operation): void
  applyRemoteOp(operation: Operation): void
  
  // 光标同步
  updateCursor(position: CursorPosition): void
  
  // 评论系统
  addComment(comment: Comment): void
  resolveComment(commentId: string): void
}
```

---

### 4. 文件管理系统 (File Management)

#### 存储方案
- **项目结构**:
  ```
  Project/
  ├── metadata.json          # 项目元数据
  ├── main.excalidraw       # Excalidraw 主文件
  ├── assets/               # 资源文件
  │   ├── images/
  │   ├── fonts/
  │   └── icons/
  ├── exports/              # 导出文件
  │   ├── output.svg
  │   ├── output.png
  │   └── output.pdf
  └── versions/             # 版本历史
      └── v1.json
  ```

#### 导出能力
- 📄 SVG、PNG、PDF、JPEG
- 📋 Mermaid Markdown
- 🎨 Excalidraw JSON
- 📦 压缩包（包含所有资源）
- 🔗 分享链接（公开/私密）

---

## 🛠️ 技术栈选型

### 前端技术栈

#### Web 应用
```typescript
// 核心框架
- React 19 + TypeScript
- Vite (构建工具)
- TailwindCSS (样式)
- Jotai (状态管理)

// 编辑器组件
- Excalidraw (@excalidraw/excalidraw)
- Monaco Editor / CodeMirror
- GodSVG (集成为 Web Component)

// UI 组件库
- Radix UI (无障碍组件)
- Shadcn/ui (样式组件)
- Framer Motion (动画)

// 协作和实时
- Yjs (CRDT)
- y-websocket (WebSocket 同步)
- Tiptap (富文本编辑 - 评论系统)

// 工具库
- Zod (类型验证)
- date-fns (日期处理)
- lodash (工具函数)
```

#### Desktop 应用
```rust
// Tauri 2.0 (Rust + Web)
- 跨平台桌面应用框架
- 原生性能和小体积
- 系统集成（文件系统、通知等）
- 自动更新
```

#### Mobile 应用
```typescript
// 方案 A: React Native
- 代码复用（共享业务逻辑）
- Expo 快速开发
- 原生模块集成

// 方案 B: Flutter (备选)
- 高性能渲染
- 美观的 UI
- 需要重写部分逻辑
```

---

### 后端技术栈

#### Serverless 架构 (推荐)
```typescript
// 平台选择
- Cloudflare Workers (API Gateway + 边缘计算)
- Cloudflare Pages (静态托管)
- Cloudflare R2 (文件存储)
- Cloudflare Durable Objects (WebSocket/状态管理)

// 备选方案
- Vercel (托管)
- Supabase (后端服务)
- AWS Lambda + API Gateway

// 数据库
- PostgreSQL (Supabase / Neon)
- Redis (Upstash - Serverless Redis)
- Vector DB (Pinecone / Weaviate - AI Embeddings)

// ORM 和工具
- Prisma / Drizzle ORM
- tRPC (类型安全 API)
- Zod (验证)
```

#### 微服务划分
```typescript
// 1. User Service (用户服务)
- 认证 (JWT + OAuth)
- 用户信息管理
- 订阅管理
- 权限控制

// 2. AI Service (AI 服务)
- 多模型路由和负载均衡
- Prompt 模板管理
- Token 计费统计
- 响应缓存

// 3. Project Service (项目服务)
- CRUD 操作
- 版本控制
- 分享和权限
- 搜索和过滤

// 4. Collaboration Service (协作服务)
- WebSocket 连接管理
- CRDT 同步
- 房间管理
- 在线状态

// 5. Export Service (导出服务)
- SVG -> PNG/PDF 转换
- 异步任务队列
- 文件压缩
- CDN 分发
```

---

## 🤖 AI 对话系统设计

### AI 模型集成架构

#### 多模型支持
```typescript
interface AIProvider {
  name: string
  models: AIModelConfig[]
  apiEndpoint: string
  authenticate(): Promise<void>
  chat(messages: Message[], options: ChatOptions): AsyncIterable<string>
}

// 支持的 AI 提供商
const providers: AIProvider[] = [
  {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    apiEndpoint: 'https://api.openai.com/v1'
  },
  {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiEndpoint: 'https://api.anthropic.com/v1'
  },
  {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision'],
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1'
  },
  {
    name: 'Alibaba',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1'
  },
  {
    name: 'Baidu',
    models: ['ernie-4.0', 'ernie-3.5'],
    apiEndpoint: 'https://aip.baidubce.com/rpc/2.0'
  }
]
```

#### Prompt 工程

##### System Prompt 模板
```typescript
const SYSTEM_PROMPTS = {
  svg_generator: `You are an expert SVG code generator. 
Generate clean, optimized SVG code based on user descriptions.
Always include viewBox and proper namespaces.
Respond with ONLY the SVG code, no explanations.`,

  mermaid_generator: `You are a Mermaid diagram expert.
Generate Mermaid syntax for flowcharts, sequence diagrams, etc.
Follow Mermaid best practices and syntax.
Respond with ONLY the Mermaid code.`,

  excalidraw_generator: `You are an Excalidraw JSON generator.
Generate valid Excalidraw JSON format for diagrams.
Include all required fields: elements, appState, files.
Respond with ONLY valid JSON.`,

  code_editor: `You are a code editing assistant.
Help users modify existing SVG/Mermaid code.
Explain changes clearly and preserve existing structure.`
}
```

##### Few-Shot Examples
```typescript
const FEW_SHOT_EXAMPLES = {
  svg: [
    {
      user: "Create a red circle",
      assistant: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="red"/>
</svg>`
    },
    {
      user: "Create a simple house icon",
      assistant: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,10 90,50 10,50" fill="#8B4513"/>
  <rect x="20" y="50" width="60" height="40" fill="#D2691E"/>
  <rect x="40" y="65" width="20" height="25" fill="#654321"/>
</svg>`
    }
  ],
  mermaid: [
    {
      user: "Create a simple flowchart for login process",
      assistant: `flowchart TD
    A[Start] --> B{Logged in?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Login Page]
    D --> E[Enter Credentials]
    E --> F{Valid?}
    F -->|Yes| C
    F -->|No| D`
    }
  ]
}
```

#### AI 功能设计

##### 1. 智能生成
```typescript
interface GenerationRequest {
  type: 'svg' | 'mermaid' | 'excalidraw'
  prompt: string
  style?: 'minimal' | 'detailed' | 'hand-drawn'
  colors?: string[]
  constraints?: {
    maxWidth?: number
    maxHeight?: number
    complexity?: 'simple' | 'medium' | 'complex'
  }
}
```

##### 2. 智能编辑
```typescript
interface EditRequest {
  currentCode: string
  instruction: string
  preserveStyle: boolean
}

// 示例指令
const editInstructions = [
  "Change the circle color to blue",
  "Make the arrow thicker",
  "Add a shadow effect",
  "Rotate the shape 45 degrees",
  "Convert to hand-drawn style"
]
```

##### 3. 智能优化
```typescript
interface OptimizationRequest {
  code: string
  options: {
    removeUnused: boolean      // 移除未使用的定义
    simplifyPaths: boolean     // 简化路径
    minify: boolean            // 压缩代码
    addAccessibility: boolean  // 添加无障碍属性
  }
}
```

##### 4. 对话式设计
```typescript
// 多轮对话示例
User: "创建一个流程图"
AI: "好的，我会为您创建一个流程图。这个流程图是关于什么的？"

User: "用户注册流程"
AI: "明白了。请问需要包含哪些步骤？比如：
1. 填写信息
2. 验证邮箱
3. 设置密码
等等..."

User: "包含邮箱验证和手机验证两种方式"
AI: [生成对应的 Mermaid 流程图代码]
```

---

### AI 缓存策略

#### 缓存层级
```typescript
// Level 1: 内存缓存（快速访问）
const memoryCache = new Map<string, AIResponse>()

// Level 2: Redis 缓存（跨实例共享）
const redisCache = new RedisCache({
  ttl: 3600, // 1小时
  maxSize: 10000
})

// Level 3: Vector DB（语义相似查询）
const vectorDB = new PineconeClient()

// 缓存策略
async function getCachedOrGenerate(prompt: string): Promise<string> {
  // 1. 检查内存缓存
  const memResult = memoryCache.get(prompt)
  if (memResult) return memResult.content
  
  // 2. 检查 Redis
  const redisResult = await redisCache.get(prompt)
  if (redisResult) {
    memoryCache.set(prompt, redisResult)
    return redisResult.content
  }
  
  // 3. 语义相似搜索
  const embedding = await generateEmbedding(prompt)
  const similar = await vectorDB.query(embedding, { topK: 1, threshold: 0.95 })
  if (similar.length > 0) {
    return similar[0].content
  }
  
  // 4. 调用 AI 生成
  const result = await aiProvider.generate(prompt)
  
  // 5. 存入缓存
  memoryCache.set(prompt, result)
  await redisCache.set(prompt, result)
  await vectorDB.upsert(prompt, embedding, result)
  
  return result.content
}
```

---

## 🌍 跨平台方案

### 代码复用架构

```
┌─────────────────────────────────────────────────────────┐
│              Shared Business Logic (TypeScript)          │
│  • AI Service  • File Management  • Collaboration       │
│  • State Management  • Utils  • Types                   │
└─────────────────────────────────────────────────────────┘
                         ↓ ↓ ↓
    ┌────────────────┬────────────────┬────────────────┐
    │   Web Layer    │  Desktop Layer │  Mobile Layer  │
    │                │                │                │
    │  React DOM     │  Tauri         │ React Native   │
    │  + Vite        │  + Rust        │ + Expo         │
    └────────────────┴────────────────┴────────────────┘
```

### Monorepo 结构

```
ai-visual-editor/
├── apps/
│   ├── web/                    # Web 应用 (Vite + React)
│   ├── desktop/                # Tauri 桌面应用
│   │   ├── src-tauri/         # Rust 后端
│   │   └── src/               # Web 前端（共享代码）
│   ├── mobile/                 # React Native 应用
│   │   ├── ios/
│   │   └── android/
│   └── vscode-extension/       # VS Code 扩展
│
├── packages/
│   ├── core/                   # 核心业务逻辑
│   │   ├── ai/                # AI 服务
│   │   ├── editor/            # 编辑器逻辑
│   │   ├── collab/            # 协作系统
│   │   └── storage/           # 存储管理
│   │
│   ├── ui/                     # 共享 UI 组件
│   │   ├── components/        # React 组件
│   │   ├── hooks/             # 自定义 Hooks
│   │   └── themes/            # 主题系统
│   │
│   ├── utils/                  # 工具函数
│   ├── types/                  # 类型定义
│   └── config/                 # 配置文件
│
├── services/                   # 后端服务 (Cloudflare Workers)
│   ├── api/                   # API Gateway
│   ├── ai/                    # AI 代理服务
│   ├── collab/                # WebSocket 服务
│   └── export/                # 导出服务
│
└── infrastructure/             # 基础设施
    ├── database/              # 数据库 schema
    ├── docker/                # Docker 配置
    └── scripts/               # 部署脚本
```

### 平台特性适配

#### Web 平台
```typescript
// 特性
✅ 完整功能
✅ PWA 支持（离线工作）
✅ 浏览器插件集成
✅ 无需安装

// 限制
⚠️ 文件系统访问受限
⚠️ 性能相对较低
```

#### Desktop 平台 (Tauri)
```typescript
// 特性
✅ 原生性能
✅ 完整文件系统访问
✅ 系统托盘集成
✅ 自动更新
✅ 快捷键全局注册
✅ 本地 AI 模型支持（未来）

// Rust 后端功能
- 文件监听和同步
- 本地数据库（SQLite）
- 系统通知
- 剪贴板集成
```

#### Mobile 平台
```typescript
// 特性
✅ 触摸优化界面
✅ 手势操作
✅ 相机集成（拍照导入）
✅ 离线编辑
✅ 推送通知

// 限制
⚠️ 屏幕空间有限
⚠️ 复杂编辑体验受限
⚠️ 更适合查看和简单编辑
```

---

## 💼 SaaS 架构设计

### 用户系统

#### 认证方案
```typescript
// 多种登录方式
interface AuthProvider {
  email: EmailPasswordAuth      // 邮箱密码
  oauth: {
    google: GoogleOAuth
    github: GitHubOAuth
    microsoft: MicrosoftOAuth
  }
  saml: SAMLAuth                // 企业 SSO
  magic_link: MagicLinkAuth     // 无密码登录
}

// JWT Token 结构
interface JWTPayload {
  userId: string
  email: string
  plan: SubscriptionPlan
  permissions: Permission[]
  iat: number
  exp: number
}
```

#### 权限模型
```typescript
enum Permission {
  // 项目权限
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_SHARE = 'project:share',
  
  // AI 权限
  AI_GENERATE = 'ai:generate',
  AI_UNLIMITED = 'ai:unlimited',
  
  // 协作权限
  COLLAB_INVITE = 'collab:invite',
  COLLAB_COMMENT = 'collab:comment',
  
  // 导出权限
  EXPORT_SVG = 'export:svg',
  EXPORT_PNG = 'export:png',
  EXPORT_PDF = 'export:pdf',
  EXPORT_BULK = 'export:bulk',
  
  // 管理权限
  WORKSPACE_ADMIN = 'workspace:admin',
  BILLING_MANAGE = 'billing:manage'
}

// 角色定义
const ROLES = {
  VIEWER: [Permission.PROJECT_READ, Permission.EXPORT_SVG],
  EDITOR: [Permission.PROJECT_READ, Permission.PROJECT_EDIT, Permission.COLLAB_COMMENT],
  ADMIN: [/* all permissions */],
  OWNER: [/* all permissions + billing */]
}
```

---

### 订阅计划

#### 定价模型
```typescript
interface SubscriptionPlan {
  id: string
  name: string
  price: {
    monthly: number
    yearly: number
    currency: 'USD' | 'CNY'
  }
  limits: {
    projects: number            // 项目数量
    collaborators: number       // 协作者数量
    aiTokens: number           // AI Token 额度/月
    storage: number            // 存储空间 (GB)
    exportLimit: number        // 导出次数/月
    versionHistory: number     // 版本历史保留天数
  }
  features: string[]
}

// 具体计划
const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '免费版',
    price: { monthly: 0, yearly: 0, currency: 'USD' },
    limits: {
      projects: 3,
      collaborators: 1,
      aiTokens: 100000,        // ~100 次生成
      storage: 0.5,            // 500MB
      exportLimit: 50,
      versionHistory: 7
    },
    features: [
      'Web 访问',
      '基础 AI 生成',
      'SVG/PNG 导出',
      '社区支持'
    ]
  },
  {
    id: 'pro',
    name: '专业版',
    price: { monthly: 19, yearly: 199, currency: 'USD' },
    limits: {
      projects: 100,
      collaborators: 10,
      aiTokens: 2000000,       // ~2000 次生成
      storage: 50,             // 50GB
      exportLimit: 1000,
      versionHistory: 90
    },
    features: [
      '所有免费版功能',
      'Desktop/Mobile 应用',
      '高级 AI 模型',
      'PDF 导出',
      '批量导出',
      '实时协作',
      '优先支持',
      '自定义品牌'
    ]
  },
  {
    id: 'team',
    name: '团队版',
    price: { monthly: 49, yearly: 499, currency: 'USD' },
    limits: {
      projects: -1,            // 无限
      collaborators: 50,
      aiTokens: 10000000,      // ~10000 次
      storage: 500,            // 500GB
      exportLimit: -1,         // 无限
      versionHistory: 365
    },
    features: [
      '所有专业版功能',
      '无限项目',
      '团队工作区',
      'SSO 集成',
      'API 访问',
      '高级分析',
      '专属客户成功经理',
      'SLA 保证'
    ]
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: { monthly: 0, yearly: 0, currency: 'USD' }, // 定制报价
    limits: {
      projects: -1,
      collaborators: -1,
      aiTokens: -1,
      storage: -1,
      exportLimit: -1,
      versionHistory: -1
    },
    features: [
      '所有团队版功能',
      '私有部署选项',
      '自定义集成',
      '本地 AI 模型支持',
      '白标解决方案',
      '法律支持',
      '24/7 技术支持'
    ]
  }
]
```

#### 计费系统
```typescript
// 使用 Stripe 作为支付处理器
interface BillingService {
  // 订阅管理
  createSubscription(userId: string, planId: string): Promise<Subscription>
  updateSubscription(subscriptionId: string, newPlanId: string): Promise<void>
  cancelSubscription(subscriptionId: string): Promise<void>
  
  // 用量追踪
  trackUsage(userId: string, resource: ResourceType, amount: number): Promise<void>
  getUsage(userId: string, period: TimePeriod): Promise<UsageStats>
  
  // AI Token 计费
  chargeAITokens(userId: string, tokens: number): Promise<boolean>
  purchaseTokenBundle(userId: string, bundle: TokenBundle): Promise<void>
  
  // 发票
  generateInvoice(subscriptionId: string, period: BillingPeriod): Promise<Invoice>
}

// 用量监控
enum ResourceType {
  AI_TOKENS = 'ai_tokens',
  STORAGE = 'storage',
  EXPORTS = 'exports',
  COLLABORATORS = 'collaborators'
}
```

---

### 数据模型

#### 核心实体
```typescript
// User (用户)
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  subscriptionId: string
  createdAt: Date
  settings: UserSettings
}

// Workspace (工作区)
interface Workspace {
  id: string
  name: string
  ownerId: string
  members: WorkspaceMember[]
  subscriptionId: string
  settings: WorkspaceSettings
}

// Project (项目)
interface Project {
  id: string
  name: string
  description?: string
  workspaceId: string
  ownerId: string
  type: 'excalidraw' | 'svg' | 'mermaid' | 'mixed'
  content: ProjectContent
  thumbnail?: string
  visibility: 'private' | 'workspace' | 'public'
  createdAt: Date
  updatedAt: Date
  version: number
}

// AI Conversation (AI 对话)
interface AIConversation {
  id: string
  projectId: string
  userId: string
  messages: Message[]
  tokensUsed: number
  createdAt: Date
}

// Collaboration Session (协作会话)
interface CollabSession {
  id: string
  projectId: string
  participants: Participant[]
  startedAt: Date
  endedAt?: Date
  changes: Change[]
}
```

---

## 📅 实施路线图

### Phase 1: MVP (2-3个月) - 核心功能

#### 目标
建立基础的 Web 版本，验证核心价值

#### 里程碑

**Sprint 1-2 (2周): 项目基础搭建**
- ✅ 初始化 Monorepo 结构
- ✅ 集成 Excalidraw
- ✅ 搭建基础 UI 框架
- ✅ 配置开发环境和 CI/CD

**Sprint 3-4 (2周): AI 对话引擎 v1**
- ✅ 实现 OpenAI API 集成
- ✅ 构建对话 UI
- ✅ 实现 SVG 基础生成
- ✅ Prompt 模板系统

**Sprint 5-6 (2周): 混合编辑器 v1**
- ✅ 集成 Monaco Editor
- ✅ 实现代码 ↔ 图形同步
- ✅ 双向编辑基础功能
- ✅ SVG 预览和验证

**Sprint 7-8 (2周): 用户系统和基础 SaaS**
- ✅ 认证系统（邮箱登录）
- ✅ 项目 CRUD
- ✅ 简单的免费/付费计划
- ✅ Stripe 集成

**Sprint 9-10 (2周): 导出和分享**
- ✅ SVG/PNG 导出
- ✅ 项目分享链接
- ✅ 公开项目画廊
- ✅ 基础分析统计

**Sprint 11-12 (2周): 测试和优化**
- ✅ Beta 测试
- ✅ 性能优化
- ✅ Bug 修复
- ✅ 文档编写

#### MVP 功能清单
```typescript
const MVP_FEATURES = {
  editor: [
    '✅ Excalidraw 基础集成',
    '✅ 代码编辑器（Monaco）',
    '✅ SVG 实时预览',
    '✅ 代码 ↔ 图形同步',
    '✅ 基础工具栏'
  ],
  ai: [
    '✅ OpenAI GPT-4 集成',
    '✅ SVG 生成',
    '✅ 简单 Mermaid 生成',
    '✅ 对话历史',
    '✅ 快捷指令'
  ],
  saas: [
    '✅ 用户注册/登录',
    '✅ 项目管理（创建/编辑/删除）',
    '✅ 2 个计划（Free/Pro）',
    '✅ Stripe 支付',
    '✅ 用量限制'
  ],
  export: [
    '✅ SVG 导出',
    '✅ PNG 导出（基础）',
    '✅ 分享链接',
    '✅ 嵌入代码'
  ]
}
```

---

### Phase 2: 增强功能 (2-3个月)

#### 目标
完善核心功能，增加协作和多模型支持

#### 功能
- 🎨 **GodSVG 集成**: 精确 SVG 编辑能力
- 🤖 **多 AI 模型**: Claude、Gemini、国内模型
- 👥 **实时协作**: WebSocket + CRDT
- 📝 **评论系统**: 协作讨论功能
- 🔄 **版本历史**: 变更追踪和回滚
- 📊 **Mermaid 完整支持**: 所有图表类型
- 🎭 **模板库**: 预设模板和快速开始
- 🔍 **智能搜索**: 项目和资源搜索
- 📱 **响应式优化**: 更好的移动 Web 体验

---

### Phase 3: 跨平台扩展 (3-4个月)

#### 目标
发布 Desktop 和 Mobile 应用

#### Desktop 应用 (Tauri)
- 🖥️ Windows/macOS/Linux 支持
- 📂 本地文件系统集成
- 🔔 系统通知
- ⚡ 离线优先设计
- 🔄 自动同步
- 🎯 全局快捷键

#### Mobile 应用 (React Native)
- 📱 iOS/Android 支持
- 👆 触摸优化界面
- 📸 相机集成（扫描导入）
- 🔌 离线编辑
- 🔔 推送通知
- 🎨 简化编辑工具

#### VS Code 扩展
- 🔌 直接在 VS Code 中使用
- 📝 Markdown 集成
- 🎨 预览面板
- 🤖 AI 助手侧边栏

---

### Phase 4: 企业功能 (3-4个月)

#### 目标
满足企业客户需求

#### 功能
- 🏢 **工作区管理**: 团队和部门组织
- 🔐 **SSO 集成**: SAML/OAuth 企业登录
- 🎯 **高级权限**: 细粒度访问控制
- 📊 **分析仪表板**: 团队使用统计
- 🔌 **API 开放**: RESTful + GraphQL API
- 🔗 **Webhook**: 事件通知集成
- 🏭 **私有部署**: Docker/K8s 部署方案
- 🎨 **白标定制**: 自定义品牌
- 📞 **企业支持**: SLA 和专属支持

---

### Phase 5: 生态和 AI 增强 (持续迭代)

#### 功能路线
- 🧠 **本地 AI 模型**: 在 Desktop 应用中运行本地模型
- 🎨 **AI 风格学习**: 学习用户的设计风格
- 🔍 **语义搜索**: Vector DB 支持的智能搜索
- 🎭 **AI 设计助手**: 设计建议和优化
- 🔌 **插件系统**: 社区扩展支持
- 🌐 **社区市场**: 模板、插件、资源分享
- 📚 **教程系统**: 交互式教程
- 🎓 **AI 训练**: 基于用户数据的定制模型

---

## 💰 成本和盈利模式

### 成本估算 (按月)

#### 基础设施成本
```typescript
const monthlyCosts = {
  // Cloudflare (Serverless)
  cloudflare: {
    workers: 20,        // Workers 付费计划
    r2: 15,             // 1TB 存储
    pages: 0,           // 免费
    durableObjects: 30, // WebSocket
    total: 65
  },
  
  // 数据库
  database: {
    supabase: 25,       // Pro 计划 (8GB + 100GB 备份)
    redis: 10,          // Upstash Redis
    vector: 70,         // Pinecone Starter
    total: 105
  },
  
  // AI API (按 1000 用户估算)
  ai: {
    openai: 200,        // GPT-4 API
    anthropic: 150,     // Claude API
    google: 100,        // Gemini API
    total: 450
  },
  
  // 其他服务
  services: {
    stripe: 50,         // 支付处理（估算）
    sentry: 26,         // 错误追踪
    analytics: 15,      // Plausible/Umami
    email: 10,          // SendGrid/Resend
    cdn: 20,            // 图片 CDN
    total: 121
  },
  
  // 开发工具
  devtools: {
    github: 0,          // 开源免费
    vercel: 20,         // Preview 环境
    linear: 10,         // 项目管理
    figma: 15,          // 设计工具
    total: 45
  },
  
  // 总计
  total: 786          // ~$800/月启动成本
}
```

#### 扩展成本（按用户数）
```typescript
// 每 1000 活跃用户的增量成本
const costPerKUsers = {
  infrastructure: 50,    // 服务器/存储
  aiApi: 200,           // AI Token 消耗
  bandwidth: 30,        // 流量费用
  storage: 20,          // 用户文件存储
  total: 300            // $300 / 1000 用户
}

// 边际成本
const marginalCostPerUser = 0.30  // $0.30/用户/月
```

---

### 盈利模式

#### 订阅收入
```typescript
// 假设转化率
const conversionRates = {
  free_to_pro: 0.05,      // 5% 免费用户转付费
  pro_to_team: 0.15,      // 15% Pro 用户升级团队版
  team_to_enterprise: 0.10 // 10% 团队版升级企业版
}

// 收入预测（按 10,000 注册用户）
const revenueProjection = {
  users: {
    free: 9500,
    pro: 475,              // 10000 * 0.05
    team: 25,              // 500 * 0.05 * 0.15
    enterprise: 2          // 自然增长
  },
  
  monthlyRevenue: {
    pro: 475 * 19,         // $9,025
    team: 25 * 49,         // $1,225
    enterprise: 2 * 500,   // $1,000 (平均)
    total: 11250           // $11,250/月
  },
  
  annualRevenue: 11250 * 12,  // $135,000/年
  
  costs: {
    monthly: 800 + (10 * 300),  // $3,800
    annual: 3800 * 12           // $45,600
  },
  
  profit: {
    monthly: 11250 - 3800,      // $7,450
    annual: 135000 - 45600,     // $89,400
    margin: 0.66                // 66% 利润率
  }
}
```

#### 其他收入来源
```typescript
const additionalRevenue = {
  // Token 包（用户超额购买）
  tokenBundles: {
    small: { price: 5, tokens: 100000 },
    medium: { price: 15, tokens: 500000 },
    large: { price: 40, tokens: 2000000 }
  },
  
  // 企业服务
  enterprise: {
    customIntegration: 5000,   // 一次性
    training: 2000,            // 每次
    support: 500,              // 月度
    privateDeployment: 10000   // 年度
  },
  
  // API 访问（开发者）
  apiAccess: {
    starter: 49,     // 10k 请求/月
    growth: 149,     // 100k 请求/月
    business: 499    // 1M 请求/月
  },
  
  // 白标授权
  whiteLabel: {
    license: 999,    // 月度
    setup: 5000      // 一次性
  }
}
```

---

### 增长策略

#### 获客渠道
```typescript
const acquisitionChannels = [
  {
    channel: 'Product Hunt',
    strategy: '精心准备的发布',
    expectedUsers: 2000,
    cost: 500 // 推广费用
  },
  {
    channel: 'Content Marketing',
    strategy: 'SEO 优化的教程和案例',
    expectedUsers: 1000,
    cost: 1000 // 内容制作
  },
  {
    channel: 'Developer Community',
    strategy: 'GitHub/Reddit/HackerNews',
    expectedUsers: 1500,
    cost: 0 // 有机增长
  },
  {
    channel: 'VS Code Marketplace',
    strategy: '免费扩展引流',
    expectedUsers: 3000,
    cost: 0
  },
  {
    channel: '社交媒体',
    strategy: 'Twitter/LinkedIn 分享',
    expectedUsers: 500,
    cost: 300
  }
]
```

#### 留存策略
```typescript
const retentionTactics = {
  onboarding: '交互式教程 + AI 助手引导',
  features: '持续发布新功能（每2周）',
  community: '用户论坛 + Discord 社区',
  templates: '定期更新模板库',
  education: '免费课程和网络研讨会',
  referral: '推荐奖励（1个月免费 Pro）'
}
```

---

## 🎯 成功指标 (KPIs)

### 产品指标
```typescript
const productKPIs = {
  // 用户增长
  signups: 'Monthly Active Users (MAU)',
  retention: {
    day1: 0.40,    // 40%
    day7: 0.25,    // 25%
    day30: 0.15    // 15%
  },
  
  // 使用情况
  avgProjectsPerUser: 5,
  avgAIGenerationsPerUser: 20,
  avgSessionDuration: '15 minutes',
  weeklyActiveUsers: '60% of MAU',
  
  // 转化
  freeToPro: 0.05,           // 5%
  trialToConversion: 0.25,   // 25%
  churnRate: 0.05,           // 5% 月流失
  
  // 参与度
  collaborationRate: 0.30,   // 30% 用户使用协作
  aiUsageRate: 0.80,        // 80% 用户使用 AI
  exportRate: 0.90          // 90% 用户导出过文件
}
```

### 商业指标
```typescript
const businessKPIs = {
  // 收入
  mrr: 'Monthly Recurring Revenue',
  arr: 'Annual Recurring Revenue',
  arpu: 'Average Revenue Per User',
  ltv: 'Lifetime Value',
  
  // 获客
  cac: 'Customer Acquisition Cost',
  ltv_cac_ratio: 3.0,       // 目标: 3:1
  paybackPeriod: 6,         // 6 个月
  
  // 效率
  grossMargin: 0.70,        // 70%
  netMargin: 0.40,          // 40%
  burnRate: 5000            // $5k/月（初期）
}
```

---

## 🛡️ 风险和挑战

### 技术风险
```typescript
const technicalRisks = {
  performance: {
    risk: 'AI 生成延迟过高',
    mitigation: '缓存策略 + 流式响应 + 预加载'
  },
  
  scalability: {
    risk: '实时协作在大量用户时性能下降',
    mitigation: 'CRDT 优化 + 分片 + 边缘部署'
  },
  
  aiCost: {
    risk: 'AI API 成本失控',
    mitigation: '智能缓存 + 限流 + 多模型切换'
  },
  
  complexity: {
    risk: '跨平台代码复杂度高',
    mitigation: 'Monorepo 管理 + 充分的抽象层'
  }
}
```

### 商业风险
```typescript
const businessRisks = {
  competition: {
    risk: 'Figma/Miro 等大厂推出类似功能',
    mitigation: '聚焦特定场景 + 开源策略 + 快速迭代'
  },
  
  marketFit: {
    risk: '市场需求不如预期',
    mitigation: 'MVP 快速验证 + 用户访谈 + 灵活调整'
  },
  
  monetization: {
    risk: '用户不愿意付费',
    mitigation: '清晰的价值主张 + 免费版限制合理 + 试用期'
  },
  
  aiProvider: {
    risk: 'AI API 服务中断或政策变化',
    mitigation: '多供应商策略 + 本地模型备份'
  }
}
```

---

## 📚 技术栈总结

### 前端技术栈
- React 19 + TypeScript
- Vite (构建)
- TailwindCSS + Shadcn/ui
- Jotai (状态)
- Monaco Editor / CodeMirror
- Excalidraw + GodSVG
- Yjs (协作)

### 后端技术栈
- Cloudflare Workers (Serverless)
- PostgreSQL (Supabase)
- Redis (Upstash)
- Pinecone (Vector DB)
- tRPC (API)
- Prisma (ORM)

### 跨平台
- Web: React DOM
- Desktop: Tauri (Rust)
- Mobile: React Native

### AI 集成
- OpenAI (GPT-4)
- Anthropic (Claude)
- Google (Gemini)
- 国内模型（通义/文心等）

### DevOps
- GitHub Actions (CI/CD)
- Cloudflare Pages (部署)
- Sentry (监控)
- Stripe (支付)

---

## 🚀 下一步行动

### 立即开始
1. ✅ **Fork Excalidraw 仓库**
2. ✅ **设置开发环境**
3. ✅ **研究 GodSVG 集成方案**
4. ✅ **设计 AI 对话 UI 原型**
5. ✅ **选择后端技术栈细节**

### 第一周任务
- [ ] 完成技术调研文档
- [ ] 设计数据库 schema
- [ ] 搭建 Monorepo 结构
- [ ] 实现第一个 AI 生成 demo
- [ ] 创建项目 Roadmap

### 寻求反馈
- [ ] 产品定位是否清晰？
- [ ] 技术选型是否合理？
- [ ] 定价策略是否可行？
- [ ] 有哪些被忽略的风险？

---

## 📞 联系和协作

如有任何问题或建议，欢迎讨论！

**Project Vision**: 让 AI 辅助的可视化设计变得简单、高效、有趣！

---

*此文档是一个活文档，会随着项目进展持续更新。*

**最后更新**: 2025-11-06
**版本**: v1.0
