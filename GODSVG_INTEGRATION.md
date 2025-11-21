# GodSVG 集成研究文档

## 📋 关于 GodSVG

**GodSVG** 是一个用 Godot 引擎开发的精确 SVG 编辑器，具有以下特点：

### 核心特性
- ✨ **精确编辑**: 直接编辑 SVG 元素和属性
- 🎨 **实时预览**: 代码和视觉同步
- 🔧 **手动控制**: 完全控制 SVG 结构
- 📐 **数学精确**: 精确的坐标和变换
- 🎯 **轻量级**: 专注于 SVG 编辑核心功能

### 项目信息
- **仓库**: https://github.com/MewPurPur/GodSVG
- **语言**: GDScript (Godot Engine)
- **许可证**: MIT
- **状态**: 活跃开发中

---

## 🔄 集成策略

### 方案对比

#### 方案 A: Web Component 封装 (推荐) ⭐
**描述**: 将 GodSVG 导出为 Web Component，在 React 应用中使用

**优点**:
- ✅ 完整保留 GodSVG 功能
- ✅ 与 React 生态系统集成良好
- ✅ 可以独立更新和维护
- ✅ 性能优秀（原生渲染）

**缺点**:
- ❌ 需要 Godot Web 导出
- ❌ 打包体积较大（Godot runtime）
- ❌ 首次加载时间较长

**技术实现**:
```typescript
// 1. Godot 项目导出为 Web
// 在 GodSVG 项目中配置 Web 导出

// 2. 创建 Web Component 包装器
// packages/godsvg-component/src/index.ts
export class GodSVGEditor extends HTMLElement {
  private godotInstance: any
  
  async connectedCallback() {
    // 加载 Godot WASM
    const engine = await this.loadGodotEngine()
    this.godotInstance = await engine.init()
    
    // 设置通信桥接
    this.setupBridge()
  }
  
  private setupBridge() {
    // JavaScript -> Godot 通信
    window.godotToJS = (method: string, data: any) => {
      this.dispatchEvent(new CustomEvent('godot-message', {
        detail: { method, data }
      }))
    }
  }
  
  // 公开 API
  loadSVG(svg: string) {
    this.godotInstance.call('load_svg', svg)
  }
  
  getSVG(): string {
    return this.godotInstance.call('get_svg')
  }
}

customElements.define('godsvg-editor', GodSVGEditor)

// 3. React 组件封装
// apps/web/src/components/GodSVGWrapper.tsx
import { useEffect, useRef } from 'react'
import 'godsvg-editor' // Web Component

export function GodSVGWrapper({ svg, onChange }) {
  const ref = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const element = ref.current as any
    
    // 监听 Godot 事件
    element.addEventListener('godot-message', (e: CustomEvent) => {
      if (e.detail.method === 'svg_changed') {
        onChange(e.detail.data)
      }
    })
    
    // 加载 SVG
    element.loadSVG(svg)
  }, [svg])
  
  return <godsvg-editor ref={ref} />
}
```

**估算**:
- 开发时间: 2-3 周
- 打包大小: ~10-15MB (Godot WASM runtime)
- 性能影响: 中等

---

#### 方案 B: 参考实现 (重写核心逻辑)
**描述**: 研究 GodSVG 的架构，用 TypeScript/React 重新实现核心功能

**优点**:
- ✅ 完全控制代码库
- ✅ 更好的 Web 集成
- ✅ 打包体积小
- ✅ 更容易定制

**缺点**:
- ❌ 开发时间长（6-8 周）
- ❌ 需要深入理解 SVG 规范
- ❌ 维护成本高

**核心模块**:
```typescript
// packages/svg-editor/src/core/

// 1. SVG 解析器
class SVGParser {
  parse(svg: string): SVGDocument
  serialize(doc: SVGDocument): string
}

// 2. 元素管理器
class ElementManager {
  elements: Map<string, SVGElement>
  selection: Set<string>
  
  createElement(type: string, attrs: Record<string, any>): SVGElement
  updateElement(id: string, attrs: Record<string, any>): void
  deleteElement(id: string): void
}

// 3. 属性编辑器
class AttributeEditor {
  getAttributes(element: SVGElement): Attribute[]
  updateAttribute(elementId: string, name: string, value: any): void
  validateAttribute(name: string, value: any): boolean
}

// 4. 变换管理器
class TransformManager {
  applyTransform(elementId: string, transform: Transform): void
  getTransformMatrix(element: SVGElement): DOMMatrix
  decompose(matrix: DOMMatrix): TransformDecomposed
}

// 5. 历史管理器
class HistoryManager {
  undo(): void
  redo(): void
  pushState(state: EditorState): void
}
```

**估算**:
- 开发时间: 6-8 周
- 打包大小: ~500KB
- 性能影响: 低

---

#### 方案 C: 混合方案 (Excalidraw + 精确编辑增强)
**描述**: 不直接集成 GodSVG，而是增强 Excalidraw 的 SVG 编辑能力

**优点**:
- ✅ 快速实现（2-3 周）
- ✅ 无需额外依赖
- ✅ 与 Excalidraw 深度集成
- ✅ 打包体积小

**缺点**:
- ❌ 功能不如 GodSVG 完整
- ❌ 需要自己实现精确编辑功能

**实现重点**:
```typescript
// 增强 Excalidraw 的能力

// 1. SVG 代码面板
// 显示选中元素的 SVG 代码
function SVGCodePanel({ selectedElement }) {
  const svg = convertExcalidrawToSVG(selectedElement)
  
  return (
    <div className="panel">
      <h3>SVG Code</h3>
      <CodeEditor
        value={svg}
        onChange={(newSvg) => {
          // 将 SVG 代码转回 Excalidraw 元素
          updateElementFromSVG(selectedElement.id, newSvg)
        }}
      />
    </div>
  )
}

// 2. 精确属性编辑器
function PrecisionEditor({ element }) {
  return (
    <div className="precision-editor">
      <NumberInput
        label="X"
        value={element.x}
        onChange={(x) => updateElement({ ...element, x })}
        step={0.1}
      />
      <NumberInput
        label="Y"
        value={element.y}
        onChange={(y) => updateElement({ ...element, y })}
        step={0.1}
      />
      {/* 更多精确控制 */}
    </div>
  )
}

// 3. 路径编辑器
function PathEditor({ pathElement }) {
  const points = parsePathData(pathElement.path)
  
  return (
    <div className="path-editor">
      {points.map((point, i) => (
        <PointControl
          key={i}
          point={point}
          onChange={(newPoint) => updatePathPoint(i, newPoint)}
        />
      ))}
    </div>
  )
}
```

**估算**:
- 开发时间: 2-3 周
- 打包大小: +50KB
- 性能影响: 极低

---

## 🎯 推荐方案

### MVP 阶段: 方案 C (Excalidraw 增强)
**理由**:
1. 快速上线（2-3 周）
2. 满足 80% 的使用场景
3. 技术风险低
4. 可以后续升级

### 功能实现优先级:
```typescript
const MVP_FEATURES = [
  // Phase 1 (Week 1)
  '✅ SVG 代码实时显示',
  '✅ 基础属性编辑（位置、大小、颜色）',
  '✅ SVG 代码 -> Excalidraw 转换',
  
  // Phase 2 (Week 2)
  '✅ 精确数值输入',
  '✅ 变换控制（旋转、缩放、倾斜）',
  '✅ 路径数据显示',
  
  // Phase 3 (Week 3)
  '✅ 高级属性（滤镜、渐变）',
  '✅ 路径编辑',
  '✅ 元素树视图'
]
```

### 长期规划: 方案 A (GodSVG Web Component)
**时机**: MVP 验证成功后（3-6 个月后）

**实施步骤**:
1. 研究 GodSVG Web 导出
2. 创建 POC（Proof of Concept）
3. 性能测试和优化
4. 逐步替换现有实现

---

## 💻 技术实现细节

### Excalidraw SVG 转换

#### Excalidraw 元素 -> SVG
```typescript
// packages/svg-editor/src/converters/excalidraw-to-svg.ts

interface ExcalidrawElement {
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'freedraw'
  x: number
  y: number
  width: number
  height: number
  angle: number
  strokeColor: string
  backgroundColor: string
  fillStyle: 'solid' | 'hachure' | 'cross-hatch'
  strokeWidth: number
  roughness: number
  opacity: number
  // ... 更多属性
}

export function excalidrawToSVG(element: ExcalidrawElement): string {
  switch (element.type) {
    case 'rectangle':
      return createRectSVG(element)
    case 'ellipse':
      return createEllipseSVG(element)
    case 'line':
      return createLineSVG(element)
    case 'arrow':
      return createArrowSVG(element)
    case 'text':
      return createTextSVG(element)
    case 'freedraw':
      return createPathSVG(element)
    default:
      return ''
  }
}

function createRectSVG(el: ExcalidrawElement): string {
  const transform = el.angle !== 0 
    ? `transform="rotate(${el.angle} ${el.x + el.width/2} ${el.y + el.height/2})"`
    : ''
  
  return `<rect 
    x="${el.x}" 
    y="${el.y}" 
    width="${el.width}" 
    height="${el.height}"
    fill="${el.backgroundColor}"
    stroke="${el.strokeColor}"
    stroke-width="${el.strokeWidth}"
    opacity="${el.opacity}"
    ${transform}
  />`
}

function createEllipseSVG(el: ExcalidrawElement): string {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const rx = el.width / 2
  const ry = el.height / 2
  
  return `<ellipse 
    cx="${cx}" 
    cy="${cy}" 
    rx="${rx}" 
    ry="${ry}"
    fill="${el.backgroundColor}"
    stroke="${el.strokeColor}"
    stroke-width="${el.strokeWidth}"
    opacity="${el.opacity}"
  />`
}

// 更复杂的形状需要使用 RoughJS 生成路径
function createPathSVG(el: ExcalidrawElement): string {
  // Excalidraw 使用 perfect-freehand 生成平滑路径
  const pathData = generatePathData(el.points)
  
  return `<path 
    d="${pathData}"
    fill="${el.backgroundColor}"
    stroke="${el.strokeColor}"
    stroke-width="${el.strokeWidth}"
    opacity="${el.opacity}"
  />`
}
```

#### SVG -> Excalidraw 元素
```typescript
// packages/svg-editor/src/converters/svg-to-excalidraw.ts

export function svgToExcalidraw(svgString: string): ExcalidrawElement[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  const elements: ExcalidrawElement[] = []
  
  // 遍历 SVG 元素
  doc.querySelectorAll('rect, circle, ellipse, line, path, text').forEach(el => {
    const excalidrawEl = convertElement(el)
    if (excalidrawEl) {
      elements.push(excalidrawEl)
    }
  })
  
  return elements
}

function convertElement(svgElement: Element): ExcalidrawElement | null {
  const tagName = svgElement.tagName.toLowerCase()
  
  switch (tagName) {
    case 'rect':
      return convertRect(svgElement)
    case 'circle':
      return convertCircle(svgElement)
    case 'ellipse':
      return convertEllipse(svgElement)
    case 'line':
      return convertLine(svgElement)
    case 'path':
      return convertPath(svgElement)
    case 'text':
      return convertText(svgElement)
    default:
      return null
  }
}

function convertRect(el: Element): ExcalidrawElement {
  return {
    type: 'rectangle',
    x: parseFloat(el.getAttribute('x') || '0'),
    y: parseFloat(el.getAttribute('y') || '0'),
    width: parseFloat(el.getAttribute('width') || '0'),
    height: parseFloat(el.getAttribute('height') || '0'),
    strokeColor: el.getAttribute('stroke') || '#000000',
    backgroundColor: el.getAttribute('fill') || 'transparent',
    strokeWidth: parseFloat(el.getAttribute('stroke-width') || '1'),
    opacity: parseFloat(el.getAttribute('opacity') || '1'),
    angle: extractRotation(el.getAttribute('transform')),
    // ... 其他默认属性
  }
}

function extractRotation(transform: string | null): number {
  if (!transform) return 0
  
  const rotateMatch = transform.match(/rotate\(([^)]+)\)/)
  if (rotateMatch) {
    const [angle] = rotateMatch[1].split(' ').map(parseFloat)
    return angle
  }
  
  return 0
}
```

---

### 精确编辑 UI 组件

#### 属性面板
```tsx
// apps/web/src/components/PropertyPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PropertyPanelProps {
  element: ExcalidrawElement
  onUpdate: (updates: Partial<ExcalidrawElement>) => void
}

export function PropertyPanel({ element, onUpdate }: PropertyPanelProps) {
  return (
    <div className="w-80 bg-white border-l p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      
      <Tabs defaultValue="transform">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        {/* Transform Tab */}
        <TabsContent value="transform" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x">X</Label>
              <Input
                id="x"
                type="number"
                value={element.x}
                onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="y">Y</Label>
              <Input
                id="y"
                type="number"
                value={element.y}
                onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
                step={0.1}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={element.width}
                onChange={(e) => onUpdate({ width: parseFloat(e.target.value) })}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={element.height}
                onChange={(e) => onUpdate({ height: parseFloat(e.target.value) })}
                step={0.1}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="angle">Rotation (deg)</Label>
            <Input
              id="angle"
              type="number"
              value={element.angle}
              onChange={(e) => onUpdate({ angle: parseFloat(e.target.value) })}
              step={1}
              min={0}
              max={360}
            />
          </div>
        </TabsContent>
        
        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <div>
            <Label htmlFor="stroke">Stroke Color</Label>
            <div className="flex gap-2">
              <Input
                id="stroke"
                type="color"
                value={element.strokeColor}
                onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={element.strokeColor}
                onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                className="flex-1 font-mono"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="fill">Fill Color</Label>
            <div className="flex gap-2">
              <Input
                id="fill"
                type="color"
                value={element.backgroundColor}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={element.backgroundColor}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="flex-1 font-mono"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="strokeWidth">Stroke Width</Label>
            <Input
              id="strokeWidth"
              type="number"
              value={element.strokeWidth}
              onChange={(e) => onUpdate({ strokeWidth: parseFloat(e.target.value) })}
              step={0.5}
              min={0}
            />
          </div>
          
          <div>
            <Label htmlFor="opacity">Opacity</Label>
            <Input
              id="opacity"
              type="range"
              value={element.opacity * 100}
              onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) / 100 })}
              min={0}
              max={100}
            />
            <span className="text-sm text-gray-500">{Math.round(element.opacity * 100)}%</span>
          </div>
        </TabsContent>
        
        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <div>
            <Label>SVG Code</Label>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
              <code>{excalidrawToSVG(element)}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 元素树视图
```tsx
// apps/web/src/components/ElementTree.tsx
'use client'

import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'

interface ElementTreeProps {
  elements: ExcalidrawElement[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
}

export function ElementTree({
  elements,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock
}: ElementTreeProps) {
  return (
    <div className="w-64 bg-white border-l p-2">
      <h3 className="text-sm font-semibold mb-2">Layers</h3>
      <div className="space-y-1">
        {elements.map((element, index) => (
          <ElementTreeItem
            key={element.id}
            element={element}
            index={elements.length - index}
            isSelected={selectedIds.has(element.id)}
            onSelect={() => onSelect(element.id)}
            onToggleVisibility={() => onToggleVisibility(element.id)}
            onToggleLock={() => onToggleLock(element.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ElementTreeItem({ element, index, isSelected, onSelect, onToggleVisibility, onToggleLock }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-gray-100 cursor-pointer
        ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
      `}
      onClick={onSelect}
    >
      <button
        className="p-0.5"
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      
      <span className="flex-1 truncate">
        {element.type} {index}
      </span>
      
      <button
        className="p-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onToggleVisibility()
        }}
      >
        {element.isDeleted ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      
      <button
        className="p-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onToggleLock()
        }}
      >
        {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
    </div>
  )
}
```

---

## 📊 性能优化

### 虚拟化渲染（大型 SVG）
```typescript
// 对于包含大量元素的 SVG，使用虚拟化渲染
import { useVirtualizer } from '@tanstack/react-virtual'

function ElementList({ elements }) {
  const parentRef = useRef(null)
  
  const virtualizer = useVirtualizer({
    count: elements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  })
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const element = elements[virtualItem.index]
          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ElementTreeItem element={element} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 防抖和节流
```typescript
import { useDebouncedCallback } from 'use-debounce'

function PropertyEditor({ element, onUpdate }) {
  // 防抖更新（避免频繁渲染）
  const debouncedUpdate = useDebouncedCallback(
    (updates) => {
      onUpdate(updates)
    },
    300 // 300ms 延迟
  )
  
  return (
    <Input
      onChange={(e) => {
        // 立即更新本地状态
        setValue(e.target.value)
        // 延迟更新全局状态
        debouncedUpdate({ property: e.target.value })
      }}
    />
  )
}
```

---

## ✅ 实施检查清单

### Week 1: 基础架构
- [ ] 创建 `packages/svg-editor` 包
- [ ] 实现 Excalidraw ↔ SVG 转换器
- [ ] 创建 SVG 代码面板组件
- [ ] 实现实时同步机制
- [ ] 单元测试覆盖

### Week 2: 精确编辑
- [ ] 实现属性面板（Transform/Style）
- [ ] 数值输入组件
- [ ] 颜色选择器
- [ ] 变换控制（旋转、缩放）
- [ ] 集成测试

### Week 3: 高级功能
- [ ] 元素树视图
- [ ] 图层管理（显示/隐藏/锁定）
- [ ] 路径编辑（基础）
- [ ] 高级属性（渐变、滤镜）
- [ ] 性能优化

---

## 📚 参考资源

### SVG 规范
- [SVG 2.0 Spec](https://www.w3.org/TR/SVG2/)
- [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)

### GodSVG
- [GodSVG GitHub](https://github.com/MewPurPur/GodSVG)
- [GodSVG Documentation](https://github.com/MewPurPur/GodSVG/wiki)

### Excalidraw
- [Excalidraw API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api)
- [Excalidraw Elements](https://github.com/excalidraw/excalidraw/blob/master/src/element/types.ts)

### 相关库
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand) - 平滑路径生成
- [roughjs](https://github.com/rough-stuff/rough) - 手绘风格渲染
- [svg-path-parser](https://github.com/hughsk/svg-path-parser) - SVG 路径解析

---

## 🎯 总结

对于 MVP 阶段，**推荐采用方案 C**（Excalidraw 增强），原因：
1. ✅ 快速实现（2-3 周）
2. ✅ 低技术风险
3. ✅ 满足核心需求
4. ✅ 后续可升级

长期来看，可以考虑集成 GodSVG Web Component，提供更专业的 SVG 编辑体验。

**下一步行动**:
1. 实现 Excalidraw ↔ SVG 转换器
2. 创建基础的属性面板
3. 测试和优化性能
4. 收集用户反馈

---

*最后更新: 2025-11-06*
