# AI Visual Editor - 快速启动实施计划

## 🎯 立即行动清单

### Phase 0: 准备阶段 (1周)

#### Day 1-2: 环境搭建
```bash
# 1. 创建新的 Git 仓库
mkdir ai-visual-editor
cd ai-visual-editor
git init
git remote add origin <your-repo-url>

# 2. 初始化 Monorepo (使用 pnpm)
pnpm init
mkdir -p apps packages services

# 3. 设置 workspace
# 创建 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
EOF

# 4. 安装核心工具
pnpm add -D -w typescript @types/node turbo
pnpm add -D -w prettier eslint
pnpm add -D -w vitest @vitest/ui
```

#### Day 3-4: 基础架构
```typescript
// 项目结构
ai-visual-editor/
├── apps/
│   └── web/                 # Next.js/Vite Web 应用
│       ├── src/
│       │   ├── app/        # App Router (Next.js)
│       │   ├── components/
│       │   ├── lib/
│       │   └── styles/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                  # 共享 UI 组件
│   ├── ai-engine/          # AI 引擎核心
│   ├── editor-core/        # 编辑器核心逻辑
│   └── types/              # 共享类型定义
│
├── services/
│   └── api/                # Cloudflare Workers API
│
├── package.json
├── turbo.json
└── tsconfig.json
```

#### Day 5-7: 依赖安装和配置

**Web 应用 (apps/web)**
```bash
cd apps/web

# 创建 Next.js 应用（推荐）或 Vite
pnpm create next-app@latest . --typescript --tailwind --app --use-pnpm

# 安装核心依赖
pnpm add @excalidraw/excalidraw
pnpm add @monaco-editor/react
pnpm add openai @anthropic-ai/sdk @google/generative-ai
pnpm add jotai zustand
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add framer-motion
pnpm add react-hotkeys-hook
pnpm add clsx tailwind-merge

# 开发依赖
pnpm add -D @types/react @types/node
pnpm add -D autoprefixer postcss tailwindcss
```

**AI Engine (packages/ai-engine)**
```bash
cd packages/ai-engine
pnpm init

# 核心依赖
pnpm add openai @anthropic-ai/sdk @google/generative-ai
pnpm add zod
pnpm add p-queue p-retry
```

---

## 🚀 MVP 开发计划 (8周)

### Week 1-2: 基础编辑器

#### 目标
搭建基础的混合编辑器界面

#### 任务清单
```typescript
// ✅ Week 1
- [ ] 设置 Excalidraw 基础集成
  - 创建 ExcalidrawWrapper 组件
  - 配置基本工具栏
  - 实现保存/加载功能

- [ ] 设置 Monaco Editor
  - 创建 CodeEditor 组件
  - 配置 SVG 语法高亮
  - 实现代码格式化

- [ ] 实现分屏布局
  - 创建 Layout 组件
  - 实现拖拽分隔条
  - 响应式适配

// ✅ Week 2
- [ ] 实现代码 ↔ 图形同步
  - SVG 代码 -> Excalidraw 转换
  - Excalidraw -> SVG 代码导出
  - 实时预览更新

- [ ] 基础工具栏
  - 文件操作（新建/打开/保存）
  - 导出选项
  - 视图切换

- [ ] 状态管理
  - Jotai atoms 设置
  - 项目状态管理
  - 撤销/重做功能
```

#### 代码示例

**ExcalidrawWrapper 组件**
```tsx
// apps/web/src/components/ExcalidrawWrapper.tsx
'use client'

import { Excalidraw } from '@excalidraw/excalidraw'
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import { AppState } from '@excalidraw/excalidraw/types/types'
import { useAtom } from 'jotai'
import { excalidrawElementsAtom } from '@/lib/store'

export function ExcalidrawWrapper() {
  const [elements, setElements] = useAtom(excalidrawElementsAtom)

  const handleChange = (
    elements: readonly ExcalidrawElement[],
    appState: AppState
  ) => {
    setElements(elements)
    // 触发 SVG 代码更新
  }

  return (
    <div className="h-full w-full">
      <Excalidraw
        initialData={{
          elements: elements,
          appState: { viewBackgroundColor: '#ffffff' }
        }}
        onChange={handleChange}
      />
    </div>
  )
}
```

**CodeEditor 组件**
```tsx
// apps/web/src/components/CodeEditor.tsx
'use client'

import Editor from '@monaco-editor/react'
import { useAtom } from 'jotai'
import { svgCodeAtom } from '@/lib/store'

export function CodeEditor() {
  const [code, setCode] = useAtom(svgCodeAtom)

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(value)
      // 触发 Excalidraw 更新
    }
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="xml"
      theme="vs-dark"
      value={code}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true
      }}
    />
  )
}
```

**混合布局**
```tsx
// apps/web/src/components/HybridEditor.tsx
'use client'

import { useState } from 'react'
import { ExcalidrawWrapper } from './ExcalidrawWrapper'
import { CodeEditor } from './CodeEditor'
import { AIChatPanel } from './AIChatPanel'

export function HybridEditor() {
  const [layout, setLayout] = useState<'split' | 'visual' | 'code'>('split')
  
  return (
    <div className="flex h-screen">
      {/* 工具栏 */}
      <aside className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-4">
        <button onClick={() => setLayout('visual')}>Visual</button>
        <button onClick={() => setLayout('code')}>Code</button>
        <button onClick={() => setLayout('split')}>Split</button>
      </aside>

      {/* 主编辑区 */}
      <main className="flex-1 flex">
        {layout === 'split' ? (
          <>
            <div className="flex-1 border-r">
              <CodeEditor />
            </div>
            <div className="flex-1">
              <ExcalidrawWrapper />
            </div>
          </>
        ) : layout === 'visual' ? (
          <ExcalidrawWrapper />
        ) : (
          <CodeEditor />
        )}
      </main>

      {/* AI 聊天面板 */}
      <aside className="w-80 bg-gray-50">
        <AIChatPanel />
      </aside>
    </div>
  )
}
```

---

### Week 3-4: AI 对话引擎

#### 目标
实现基础的 AI 生成功能

#### 任务清单
```typescript
// ✅ Week 3
- [ ] AI Engine 核心
  - 创建 AIProvider 抽象
  - 实现 OpenAI 集成
  - Prompt 模板系统
  - 流式响应处理

- [ ] AI Service API
  - Cloudflare Worker 设置
  - API 路由设计
  - 认证中间件
  - 限流机制

// ✅ Week 4
- [ ] AI 聊天 UI
  - 消息列表组件
  - 输入框和快捷指令
  - 加载状态和错误处理
  - 生成结果预览

- [ ] SVG 生成功能
  - 自然语言 -> SVG
  - 基础图形生成
  - 结果验证和优化
```

#### 代码示例

**AI Provider 接口**
```typescript
// packages/ai-engine/src/types.ts
export interface AIProvider {
  name: string
  chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string>
  generateSVG(prompt: string): Promise<string>
  generateMermaid(prompt: string): Promise<string>
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}
```

**OpenAI Provider**
```typescript
// packages/ai-engine/src/providers/openai.ts
import OpenAI from 'openai'
import { AIProvider, Message, ChatOptions } from '../types'

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async *chat(messages: Message[], options?: ChatOptions) {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }

  async generateSVG(prompt: string): Promise<string> {
    const systemPrompt = `You are an expert SVG code generator.
Generate clean, optimized SVG code based on the user's description.
Always include viewBox and proper namespaces.
Respond with ONLY the SVG code, no explanations or markdown.`

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]

    let fullResponse = ''
    for await (const chunk of this.chat(messages)) {
      fullResponse += chunk
    }

    return this.extractSVG(fullResponse)
  }

  async generateMermaid(prompt: string): Promise<string> {
    const systemPrompt = `You are a Mermaid diagram expert.
Generate Mermaid syntax for flowcharts, sequence diagrams, etc.
Respond with ONLY the Mermaid code, no explanations or markdown code blocks.`

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]

    let fullResponse = ''
    for await (const chunk of this.chat(messages)) {
      fullResponse += chunk
    }

    return this.extractMermaid(fullResponse)
  }

  private extractSVG(text: string): string {
    // 提取 SVG 代码
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i)
    return svgMatch ? svgMatch[0] : text
  }

  private extractMermaid(text: string): string {
    // 移除代码块标记
    return text
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
  }
}
```

**AI Service API**
```typescript
// services/api/src/routes/ai.ts
import { Hono } from 'hono'
import { OpenAIProvider } from '@ai-visual-editor/ai-engine'

const app = new Hono()

app.post('/generate/svg', async (c) => {
  const { prompt } = await c.req.json()
  
  // 获取 API Key (从环境变量)
  const apiKey = c.env.OPENAI_API_KEY
  const provider = new OpenAIProvider(apiKey)
  
  try {
    const svg = await provider.generateSVG(prompt)
    return c.json({ success: true, svg })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/chat/stream', async (c) => {
  const { messages } = await c.req.json()
  
  const apiKey = c.env.OPENAI_API_KEY
  const provider = new OpenAIProvider(apiKey)
  
  // 返回 SSE 流
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of provider.chat(messages)) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            )
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }
  )
})

export default app
```

**AI 聊天 UI**
```tsx
// apps/web/src/components/AIChatPanel.tsx
'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { chatMessagesAtom, svgCodeAtom } from '@/lib/store'

export function AIChatPanel() {
  const [messages, setMessages] = useAtom(chatMessagesAtom)
  const [, setSvgCode] = useAtom(svgCodeAtom)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/generate/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      })

      const data = await response.json()
      
      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: 'Here\'s the SVG I generated:',
          svg: data.svg
        }
        setMessages([...messages, userMessage, aiMessage])
        setSvgCode(data.svg)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Assistant</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-8'
                : 'bg-gray-100 mr-8'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
            {msg.svg && (
              <div className="mt-2 p-2 bg-white rounded border">
                <div dangerouslySetInnerHTML={{ __html: msg.svg }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe what you want to create..."
            className="flex-1 px-3 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Generating...' : 'Send'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setInput('Create a simple circle icon')}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Circle Icon
          </button>
          <button
            onClick={() => setInput('Create a flowchart with 3 steps')}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Flowchart
          </button>
          <button
            onClick={() => setInput('Create a house icon')}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            House Icon
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Week 5-6: 用户系统和项目管理

#### 目标
实现基础的用户认证和项目 CRUD

#### 任务清单
```typescript
// ✅ Week 5
- [ ] 认证系统
  - Clerk/Supabase Auth 集成
  - 邮箱注册/登录
  - OAuth (Google, GitHub)
  - JWT Token 管理

- [ ] 数据库设计
  - Prisma Schema 定义
  - Users 表
  - Projects 表
  - Subscriptions 表
  - 迁移脚本

// ✅ Week 6
- [ ] 项目管理 UI
  - 项目列表页
  - 创建项目对话框
  - 项目设置
  - 删除确认

- [ ] 项目 API
  - CRUD endpoints
  - 权限检查
  - 文件上传
  - 自动保存
```

#### 数据库 Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatar        String?
  subscriptionId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  projects      Project[]
  subscription  Subscription? @relation(fields: [subscriptionId], references: [id])
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        ProjectType
  content     Json
  thumbnail   String?
  visibility  Visibility @default(PRIVATE)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([updatedAt])
}

enum ProjectType {
  EXCALIDRAW
  SVG
  MERMAID
  MIXED
}

enum Visibility {
  PRIVATE
  PUBLIC
  WORKSPACE
}

model Subscription {
  id        String   @id @default(cuid())
  plan      Plan
  status    Status
  startDate DateTime
  endDate   DateTime?
  
  users     User[]
}

enum Plan {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

enum Status {
  ACTIVE
  CANCELED
  PAST_DUE
}
```

---

### Week 7-8: 导出和部署

#### 目标
实现导出功能并部署 MVP

#### 任务清单
```typescript
// ✅ Week 7
- [ ] 导出功能
  - SVG 导出
  - PNG 导出（使用 canvas）
  - PDF 导出
  - 分享链接生成
  - 嵌入代码生成

- [ ] 优化和测试
  - 性能优化
  - 错误边界
  - 单元测试
  - E2E 测试

// ✅ Week 8
- [ ] 部署准备
  - 环境变量配置
  - Cloudflare Workers 部署
  - Vercel/Cloudflare Pages 部署
  - 数据库迁移

- [ ] Beta 发布
  - 文档编写
  - Landing Page
  - Product Hunt 准备
  - 收集反馈
```

---

## 📊 开发工具配置

### package.json (根目录)
```json
{
  "name": "ai-visual-editor",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

---

## 🎯 MVP 完成标准

### 功能清单
- ✅ 用户可以注册/登录
- ✅ 用户可以创建项目
- ✅ 用户可以通过 AI 生成 SVG
- ✅ 用户可以手动编辑代码和图形
- ✅ 代码和图形可以实时同步
- ✅ 用户可以导出 SVG/PNG
- ✅ 用户可以分享项目链接
- ✅ 免费/付费计划区分明确

### 性能指标
- ⚡ 首屏加载 < 3秒
- ⚡ AI 生成响应 < 10秒
- ⚡ 编辑操作延迟 < 100ms
- ⚡ Lighthouse 分数 > 90

### 质量标准
- 🧪 测试覆盖率 > 70%
- 🐛 Zero Critical Bugs
- 📱 移动端响应式
- ♿ 基础无障碍支持

---

## 💡 快速提示

### 技术选择理由

#### 为什么选择 Next.js?
✅ React Server Components
✅ 优秀的 SEO
✅ 内置 API Routes
✅ Vercel 一键部署

#### 为什么选择 Cloudflare Workers?
✅ 边缘计算低延迟
✅ Serverless 零运维
✅ 慷慨的免费额度
✅ 全球 CDN

#### 为什么选择 Prisma?
✅ 类型安全的 ORM
✅ 优秀的开发体验
✅ 自动迁移管理
✅ 多数据库支持

### 开发建议

1. **先做 Demo，再完善**
   - 快速验证核心功能
   - 不要过早优化
   - 尽早获取用户反馈

2. **使用现成的解决方案**
   - Clerk/Supabase Auth (认证)
   - Stripe (支付)
   - Sentry (监控)
   - Vercel Analytics (分析)

3. **保持代码简单**
   - 优先可读性
   - 避免过度抽象
   - 注重测试覆盖

4. **持续部署**
   - 每个 PR 自动部署预览
   - Main 分支自动生产部署
   - 使用 Feature Flags

---

## 📞 获取帮助

### 社区资源
- [Excalidraw Discord](https://discord.gg/UexuTaE)
- [Next.js Discord](https://nextjs.org/discord)
- [Cloudflare Developers Discord](https://discord.gg/cloudflaredev)

### 学习资源
- [Excalidraw 文档](https://docs.excalidraw.com)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Prisma 指南](https://www.prisma.io/docs)
- [Cloudflare Workers 教程](https://developers.cloudflare.com/workers)

---

## 🚦 下一步行动

### 本周任务 (优先级排序)
1. 🔴 **创建 GitHub 仓库** - 立即
2. 🔴 **搭建 Monorepo 基础** - 第 1 天
3. 🔴 **集成 Excalidraw** - 第 2-3 天
4. 🟡 **实现基础 AI 生成** - 第 4-7 天
5. 🟢 **设置 CI/CD** - 并行进行

### 需要决定的事项
- [ ] 选择 Next.js 还是 Vite？(推荐 Next.js)
- [ ] 选择哪个认证方案？(推荐 Clerk)
- [ ] 选择哪个数据库？(推荐 Supabase Postgres)
- [ ] 是否使用 tRPC？(可选，但推荐)
- [ ] 是否需要后端仓库分离？(推荐 Monorepo)

### 准备工作清单
- [ ] 注册 OpenAI API 账号
- [ ] 注册 Cloudflare 账号
- [ ] 注册 Supabase 账号
- [ ] 注册 Stripe 账号
- [ ] 准备域名（可选）

---

**准备好了吗？让我们开始构建吧！** 🚀

**第一个命令**:
```bash
mkdir ai-visual-editor && cd ai-visual-editor
pnpm init && echo "Let's build something amazing!"
```
