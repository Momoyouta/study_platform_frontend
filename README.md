# 学习通在线学习平台 - 用户端 (Study Platform Frontend)

## 项目简介

本项目是仿学习通的在线学习平台用户端，旨在提供一个功能完善、界面友好的在线学习环境。本项目采用现代化的前端技术栈，结合 B/S 架构，与 NestJS 实现的后端 API 进行交互。

## 技术栈

本项目基于以下核心技术构建：

- **框架**: [React 19](https://react.dev/) - 用于构建用户界面的 JavaScript 库。
- **构建工具**: [Vite](https://vitejs.dev/) - 下一代前端构建工具，提供极速的热更新体验。
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 强类型的 JavaScript 超集。
- **UI 组件库**: [Ant Design (antd)](https://ant.design/) - 企业级 UI 设计语言和 React 组件库。
- **状态管理**: [MobX](https://mobx.js.org/) - 简单、可扩展的状态管理。
- **路由**: [React Router 7](https://reactrouter.com/) - 声明式的路由管理。
- **网络请求**: [Axios](https://axios-http.com/) - 基于 Promise 的 HTTP 客户端。
- **样式**: [Less](https://lesscss.org/) - 动态样式语言，支持变量和混合。

## 目录结构

```text
E:\毕设\study_platform_frontend\
├── src/
│   ├── assets/             # 静态资源 (图片、图标等)
│   ├── components/         # 通用业务组件
│   ├── config/             # 项目配置文件
│   ├── env/                # 环境变量配置 (.env.dev, .env.prod)
│   ├── http/               # 网络请求配置及封装
│   ├── pages/              # 页面级组件 (Home, Login 等)
│   ├── router/             # 路由配置
│   ├── store/              # MobX 状态管理
│   ├── theme/              # 主题样式及全局变量 (Less)
│   ├── App.jsx             # 根组件
│   └── main.jsx            # 入口文件
├── public/                 # 公共静态资源
├── openspec/               # 项目规范及任务管理
├── package.json            # 项目依赖及脚本
└── tsconfig.json           # TypeScript 配置
```

## 快速开始

### 1. 环境准备

确保您的本地环境已安装 [Node.js](https://nodejs.org/) (建议使用 v18+) 和 [pnpm](https://pnpm.io/)。

### 2. 安装依赖

```bash
pnpm install
```

### 3. 本地开发

启动开发服务器：

```bash
pnpm run dev
```

### 4. 项目打包

生成生产环境产物：

```bash
pnpm run build
```

### 5. 代码校验

运行 ESLint 进行静态代码检查：

```bash
pnpm run lint
```

## 环境配置

项目使用 Vite 的模式系统管理环境变量，配置文件位于 `src/env/`：

- `.env.dev`: 开发环境配置
- `.env.prod`: 生产环境配置

## OpenSpec 规范

本项目严格遵循 OpenSpec 规范进行开发和变更管理：

- **变更建议**: 使用 `openspec-propose` 发起。
- **任务实施**: 使用 `openspec-apply-change` 执行。
- **规范定义**: 详见 `openspec/config.yaml`。

## 许可证

[MIT License](LICENSE) (如果有)
