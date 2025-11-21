# 项目开发计划：AI 绘图功能集成

## 目标
集成多 LLM 网关（OpenRouter/Gemini），实现“自然语言 → Mermaid/SVG”的 AI 绘图功能。

## 任务分解

### 阶段 1: 环境与配置
- [x] 识别项目结构与技术栈 (Next.js + Excalidraw)
- [ ] 配置服务端密钥读取逻辑
  - 优先读取环境变量 `GATEWAY_API_KEY`
  - 回退读取文件 `~/Desktop/AI开发/07.vibedraw/.trae/documents/LLM Key`
- [ ] 配置环境变量
  - `GATEWAY_BASE_URL` (默认: https://openrouter.ai/api/v1)
  - `DEFAULT_MODEL` (默认: google/gemini-3-pro-preview)

### 阶段 2: 后端开发
- [ ] 实现/优化 API 路由 `POST /api/ai/draw`
  - 接收 `prompt`, `target_format`, `model`
  - 调用 LLM 网关
  - 处理 Mermaid/SVG 格式输出
  - 错误处理与 Mock 回退

### 阶段 3: 前端开发
- [ ] 集成 AI 绘图面板 (`GenerateSidebar`)
  - 输入界面：Prompt 输入, 模型选择, 格式选择
  - 调用后端 API
- [ ] 实现渲染逻辑
  - Mermaid 渲染 (使用 `mermaid` 库)
  - SVG 渲染 (安全插入)
- [ ] 实现编辑器导入
  - 将生成的图形转换为 Excalidraw 元素并添加到画布

### 阶段 4: 测试与验收
- [ ] 验证后端 API (Postman/Curl)
- [ ] 验证前端端到端流程
- [ ] 错误处理与边界情况测试

## 参考文档
- `.trae/documents/` 下的相关文档
