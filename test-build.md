# 本地构建测试指南

在推送到 GitHub 触发自动构建之前，建议先在本地测试构建是否正常。

## 🧪 本地测试步骤

### 1. 测试前端构建

```bash
npm run build:frontend
```

**预期结果**：
- ✅ 命令成功完成
- ✅ 在 `dist` 目录下生成文件
- ✅ 没有错误信息

**如果失败**：
- 检查 `src` 目录下的代码是否有语法错误
- 运行 `npm run dev` 查看是否能正常启动开发服务器
- 检查控制台的错误信息

### 2. 测试 Electron 应用

```bash
npm run dev:electron
```

**预期结果**：
- ✅ Electron 窗口打开
- ✅ 应用正常显示
- ✅ 所有功能正常工作

**如果失败**：
- 检查 `main.js` 和 `preload.js` 是否有错误
- 查看终端的错误日志
- 按 F12 打开 DevTools 查看浏览器控制台错误

### 3. 测试完整打包（Windows）

```bash
npm run package:win
```

**预期结果**：
- ✅ 构建过程无错误
- ✅ 在 `dist-electron` 目录生成安装程序
- ✅ 可以运行安装程序并测试应用

**构建时间**：约 3-5 分钟

**输出文件**：
- `dist-electron/React Tailwind App Setup 1.0.0.exe`

### 4. 测试完整打包（macOS）

⚠️ **注意**：只能在 macOS 系统上构建 macOS 应用

```bash
npm run package:mac
```

**预期结果**：
- ✅ 构建过程无错误
- ✅ 在 `dist-electron` 目录生成 DMG 文件
- ✅ 可以打开 DMG 并安装应用

**输出文件**：
- `dist-electron/React Tailwind App-1.0.0.dmg`

## 📋 构建前检查清单

在运行构建之前，确保：

- [ ] 所有依赖都已安装：`npm install`
- [ ] 代码没有语法错误
- [ ] 开发服务器可以正常运行：`npm run dev`
- [ ] 所有必需的文件都存在：
  - [ ] `main.js`
  - [ ] `preload.js`
  - [ ] `package.json`
  - [ ] `src/` 目录及其内容
  - [ ] `index.html`

## 🔍 验证构建产物

### 检查前端构建

```bash
# 在 dist 目录应该看到：
dist/
  ├── index.html
  ├── assets/
  │   ├── index-*.js
  │   └── index-*.css
  └── AM.jpg
```

### 检查 Electron 构建

```bash
# 在 dist-electron 目录应该看到：
dist-electron/
  ├── React Tailwind App Setup 1.0.0.exe  (Windows)
  └── React Tailwind App-1.0.0.dmg        (macOS)
```

## 🛠️ 常见问题和解决方法

### 问题 1：`npm run build:frontend` 失败

**可能原因**：
- 代码有语法错误
- 缺少依赖

**解决方法**：
```bash
# 1. 检查并修复代码错误
npm run dev

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 再次尝试构建
npm run build:frontend
```

### 问题 2：Electron 窗口打不开

**可能原因**：
- `main.js` 配置错误
- 路径问题

**解决方法**：
- 检查 `main.js` 中的路径配置
- 确保 `preload.js` 路径正确
- 查看终端错误日志

### 问题 3：打包后的应用无法运行

**可能原因**：
- 资源路径不正确
- 缺少必要文件

**解决方法**：
- 确保 `vite.config.js` 中有 `base: './'`
- 检查 `package.json` 中的 `build.files` 配置
- 验证所有资源文件都被包含

### 问题 4：构建时内存不足

**解决方法**：
```bash
# 增加 Node.js 内存限制
$env:NODE_OPTIONS="--max-old-space-size=4096"  # Windows PowerShell
export NODE_OPTIONS="--max-old-space-size=4096" # macOS/Linux

# 然后再次运行构建
npm run package:win
```

### 问题 5：electron-builder 下载慢

**原因**：网络问题

**解决方法**：
```bash
# 设置淘宝镜像
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/

# 重新安装
npm install
```

## 📊 构建性能参考

### 构建时间（参考）

| 操作 | 预计时间 |
|------|---------|
| `npm install` | 2-5 分钟 |
| `npm run build:frontend` | 10-30 秒 |
| `npm run dev:electron` | 5-10 秒 |
| `npm run package:win` | 3-5 分钟 |
| `npm run package:mac` | 3-5 分钟 |

### 磁盘空间需求

- `node_modules`: ~500 MB
- `dist`: ~5 MB
- `dist-electron` (Windows): ~150 MB
- `dist-electron` (macOS): ~200 MB

## ✅ 准备推送到 GitHub

当所有本地测试都通过后：

1. **清理构建产物**（可选）：
```bash
rm -rf dist dist-electron
```

2. **提交代码**：
```bash
git add .
git commit -m "准备发布 v1.0.0"
git push origin main
```

3. **创建标签触发 CI/CD**：
```bash
git tag v1.0.0
git push origin v1.0.0
```

4. **监控 GitHub Actions**：
   - 访问 GitHub 仓库的 Actions 页面
   - 查看构建进度
   - 下载构建产物

## 🎯 推荐工作流

```bash
# 完整的测试和发布流程
npm install                    # 1. 安装依赖
npm run dev                    # 2. 测试开发服务器
npm run build:frontend         # 3. 测试前端构建
npm run dev:electron          # 4. 测试 Electron 应用
git add .                      # 5. 提交代码
git commit -m "发布 v1.0.0"
git push origin main
git tag v1.0.0                # 6. 创建标签
git push origin v1.0.0        # 7. 触发自动构建
```

## 💡 提示

- 本地测试可以节省 GitHub Actions 的构建时间
- 在本地先修复所有错误，避免多次推送触发构建
- 本地只需要测试当前平台，GitHub Actions 会同时构建两个平台
- 记得在 `.gitignore` 中忽略 `dist-electron` 目录

---

**下一步**：查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解如何使用 GitHub Actions 自动构建

