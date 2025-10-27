# AM - 增材制造平台

这是一个使用 React 18 和 Tailwind CSS 构建的现代化增材制造平台，支持 Electron 桌面应用和与后端 API 的远程连接。

## 🚀 技术栈

- **React 18** - 现代化的用户界面库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Vite** - 快速的构建工具
- **Electron** - 跨平台桌面应用框架
- **React Router** - 客户端路由
- **Axios** - HTTP 客户端
- **ESLint** - 代码质量检查
- **GitHub Actions** - 自动化 CI/CD 构建

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   └── Layout.jsx      # 布局组件
├── pages/              # 页面组件
│   ├── Home.jsx        # 首页
│   ├── About.jsx       # 关于页面
│   └── Contact.jsx     # 联系页面
├── services/           # API 服务
│   └── api.js          # API 配置和封装
├── hooks/              # 自定义 Hooks
│   └── useApi.js       # API 调用 Hook
├── utils/              # 工具函数
│   └── constants.js    # 常量定义
├── App.jsx             # 主应用组件
├── main.jsx            # 应用入口
└── index.css           # 全局样式
```

## 🛠️ 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `env.example` 文件为 `.env` 并配置你的环境变量：

```bash
cp env.example .env
```

编辑 `.env` 文件，设置你的 API 地址：

```env
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. 启动开发服务器

#### Web 开发模式
```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

#### Electron 开发模式
```bash
npm run dev:electron
```

将启动 Electron 桌面应用。

### 4. 构建生产版本

#### 构建前端
```bash
npm run build:frontend
```

#### 构建 Electron 应用
```bash
# Windows
npm run package:win

# macOS
npm run package:mac

# Linux
npm run package:linux
```

## 🔧 配置说明

### API 配置

项目使用 Axios 进行 API 调用，配置文件位于 `src/services/api.js`：

- 支持请求/响应拦截器
- 自动添加认证 token
- 统一的错误处理
- 请求超时配置

### 自定义 Hooks

项目提供了几个实用的自定义 Hooks：

- `useApi` - 用于 GET 请求
- `useApiMutation` - 用于 POST/PUT/DELETE 请求
- `usePaginatedApi` - 用于分页数据

### 样式配置

Tailwind CSS 配置位于 `tailwind.config.js`，包含：

- 自定义颜色主题
- 响应式断点
- 自定义组件类

## 📝 使用示例

### API 调用示例

```javascript
import { useApi, useApiMutation } from './hooks/useApi'

// GET 请求
const { data, loading, error } = useApi('/users')

// POST 请求
const { mutate, loading } = useApiMutation('/users', 'POST')
const handleSubmit = () => {
  mutate({ name: 'John', email: 'john@example.com' })
}
```

### 组件使用示例

```javascript
import { apiService } from './services/api'

const fetchUsers = async () => {
  try {
    const users = await apiService.users.getAll()
    console.log(users)
  } catch (error) {
    console.error('获取用户失败:', error)
  }
}
```

## 🎨 样式指南

项目使用 Tailwind CSS 的实用类，同时提供了一些自定义组件类：

- `.btn-primary` - 主要按钮样式
- `.btn-secondary` - 次要按钮样式
- `.card` - 卡片容器样式
- `.input-field` - 输入框样式

## 🔗 后端集成

项目已经配置好与后端 API 的集成：

1. 在 `.env` 文件中设置 `REACT_APP_API_URL`
2. 使用提供的 API 服务进行数据交互
3. 支持 JWT 认证
4. 统一的错误处理

## 📦 构建和部署

### Web 应用部署

#### 构建

```bash
npm run build
```

构建文件将生成在 `dist/` 目录中。

#### 部署

可以将 `dist/` 目录部署到任何静态文件服务器，如：

- Nginx
- Apache
- Vercel
- Netlify
- GitHub Pages

### 📱 Electron 桌面应用部署

#### 使用 GitHub Actions 自动构建（推荐）

本项目已配置 GitHub Actions，可以自动为 Windows 和 macOS 构建安装包。

**快速开始：**

1. 将代码推送到 GitHub
2. 创建版本标签触发构建：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. 在 GitHub Releases 页面下载构建好的安装包

**详细文档：**
- 📖 [完整部署指南](DEPLOYMENT.md) - 详细的 GitHub Actions 使用说明
- 📖 [本地构建测试](test-build.md) - 推送前的本地测试指南
- 📖 [Git 命令速查](.github/GIT_COMMANDS.md) - 常用 Git 命令参考
- 📖 [工作流说明](.github/workflows/README.md) - GitHub Actions 工作流详解

#### 本地构建

如果需要在本地构建：

```bash
# Windows
npm run package:win

# macOS (仅在 macOS 系统上)
npm run package:mac

# Linux
npm run package:linux
```

构建产物将生成在 `dist-electron/` 目录中。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
