---
version: alpha
name: "MediaRouter 创作工作台"
description: "面向视频创作者的中文 AI 视频生成工作台，以电影制作控制台的秩序感组织创作、费用与成片。"
colors:
  primary: "#0E7490"
  accent: "#F59E0B"
  background: "#F5F8F8"
  surface: "#FFFFFF"
  ink: "#0F172A"
  muted: "#64748B"
  danger: "#DC2626"
  on-primary: "#FFFFFF"
typography:
  sans:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  DEFAULT: "0.5rem"
  sm: "0.375rem"
  md: "0.625rem"
  lg: "1rem"
spacing:
  section-gap: "2.5rem"
  page-max: "72rem"
components:
  page:
    backgroundColor: "#F5F8F8"
    textColor: "#0F172A"
  button:
    backgroundColor: "#0E7490"
    textColor: "#FFFFFF"
    height: "2.75rem"
    rounded: "0.625rem"
  card:
    backgroundColor: "#FFFFFF"
    textColor: "#0F172A"
    rounded: "1rem"
  status:
    backgroundColor: "#0E7490"
    textColor: "#FFFFFF"
    rounded: "9999px"
  meta:
    textColor: "#64748B"
  cost:
    backgroundColor: "#F59E0B"
---

# MediaRouter 创作工作台设计系统

## Overview

### Creative North Star

这是一个“电影制作控制台”而不是开发者 API 控制台：创作者先描述镜头，再配置少量关键参数，最后在同一工作区看到可播放的成片。深色导航像剪辑室的工作台，浅色内容面保证长时间创作时的阅读舒适度。

### Product context and register

- **Audience and primary job:** 使用 AI 生成短视频的创作者；核心任务是提交提示词、控制生成成本、查看并播放成片。
- **Target market(s) and evidence:** 中文界面需求来自当前产品任务；不引入额外市场或支付规则。
- **Locale(s) and language policy:** 默认简体中文，模型名、Provider 名、API 字段和技术错误原文保留其技术表达。
- **Usage scene:** 桌面端为主，也要支持窄屏浏览；生成任务是异步的，状态和费用必须持续可见。
- **Register:** 产品型工具，品牌表达集中在导航和创作页头部，表单与数据页保持克制。
- **Memorable signature:** “创作状态带”——生成页将模型、时长、比例和预估费用组织成一个明确的创作配置面板。
- **Restraint:** 不使用大面积渐变、装饰性动画或开发者术语堆叠；视频内容和状态优先。
- **Anti-references:** 不做通用 SaaS 仪表盘、紫色 AI 模板或密集 API 文档页。
- **Token ownership/runtime mapping:** `frontend/src/index.css` 的 CSS 变量是运行时规范；Tailwind 配置和共享 UI 组件消费这些变量，本文件记录已接受的语义角色。

## Colors

青绿色 `#0E7490` 是主要创作动作与焦点色，橙色 `#F59E0B` 只用于费用和提醒。`#F5F8F8` 页面背景与白色内容面形成层次，深色导航使用产品前景色。危险操作使用 `#DC2626`，不能只依赖颜色表达状态，必须同时显示中文标签。

## Typography

使用系统无衬线字体栈，优先保证中文字体的字面和行高稳定。页面标题使用较大字号和半粗体，字段与状态使用清晰的中等字重，模型名、任务 ID 等技术值可使用等宽字体。中英文混排保留自然空格，不强制大写。

## Layout

页面内容最大宽度约 72rem，桌面端采用“配置面板 + 结果/说明面板”的双栏结构，窄屏退化为单列。导航固定视觉层级但不遮挡内容；视频区域预留 16:9 比例，状态和费用区域不因异步刷新改变主要布局。

## Elevation & Depth

层次主要通过背景、边框和轻微阴影表达。创作面板和视频结果卡片可以使用低强度阴影，数据说明和筛选区域以边框为主。禁止用多层阴影或强烈玻璃拟态抢夺视频内容的注意力。

## Shapes

控件使用 `0.625rem` 中等圆角，内容卡片使用 `1rem` 圆角，状态徽章使用胶囊形。危险按钮与普通操作保持明确间距。输入框、下拉框和按钮共享相同的高度与焦点环。

## Components

### Foundational visual states

控件必须有默认、悬停、键盘焦点、按下、禁用和忙碌状态；异步生成使用“排队中 / 生成中 / 已完成 / 失败”中文状态。加载、空结果和失败均保留稳定布局，并给出下一步行动。

### Buttons and actions

主操作使用青绿色实心按钮，次操作使用描边按钮，删除使用危险样式并与下载动作分离。忙碌状态替换按钮文字但不改变按钮宽度或位置。

### Navigation and data display

导航项使用图标加中文标签。视频库采用响应式卡片网格，视频缩略区域保持比例；费用、时长、模型和创建日期位于视频下方，长提示词截断但保留完整文本的可读区域。

### Forms and overlays

生成表单按“提示词 → 模型与画幅 → 时长与随机种子 → 费用 → 生成”组织。字段使用真实 label；错误显示在相关区域。删除操作使用应用内确认对话框，不使用浏览器原生确认框。

### Iconography

使用现有 `lucide-react` 线性图标，图标用于帮助扫描，不替代中文文字标签；常规图标 16–20px，主视觉图标 20–24px。

### Motion

只使用短暂、可中断的颜色和透明度过渡来表达交互反馈；生成轮询不添加装饰性动画。遵守 `prefers-reduced-motion`，不让动效成为理解状态的必要条件。

### Content and data visualization

按钮使用动作动词，费用显示美元金额并明确“预估”或“实际”语义，时长统一使用“秒/分钟”。原始模型名和 Provider 名保持可复制的技术格式。

## Do's and Don'ts

- **Do:** 让创作者在生成页同时看到配置、预估费用和任务状态。
- **Do:** 在视频库中保持状态、费用、时长和播放入口的一致位置。
- **Don't:** 把 API 路径、内部状态名或英文错误直接作为主要用户文案。
- **Don't:** 用装饰性渐变、自动播放或高强度动效分散对成片的注意力。
