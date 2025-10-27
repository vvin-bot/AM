# 部署指南 - 使用 GitHub Actions 构建跨平台应用

## 📋 前提条件

1. 一个 GitHub 账号
2. Git 已安装在你的电脑上
3. 项目代码已准备就绪

## 🚀 快速开始

### 步骤 1：创建 GitHub 仓库

1. 访问 [GitHub](https://github.com)
2. 点击右上角的 "+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `AM` （或你喜欢的名字）
   - **Description**: 增材制造平台
   - **Public/Private**: 根据需要选择
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

### 步骤 2：推送代码到 GitHub

打开终端或命令行，在项目目录下执行：

```bash
# 1. 初始化 Git 仓库（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 创建首次提交
git commit -m "Initial commit: 增材制造平台"

# 4. 添加远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的用户名/AM.git

# 5. 推送代码
git branch -M main
git push -u origin main
```

### 步骤 3：触发自动构建

#### 选项 A：通过标签触发（推荐）

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0
```

#### 选项 B：手动触发

1. 访问你的 GitHub 仓库
2. 点击 **"Actions"** 标签
3. 点击左侧的 **"Build Electron App"**
4. 点击右侧的 **"Run workflow"** 按钮
5. 选择 `main` 分支
6. 点击绿色的 **"Run workflow"** 按钮

### 步骤 4：等待构建完成

1. 在 Actions 页面可以看到构建进度
2. 构建时间约 10-15 分钟
3. ✅ 绿色勾号表示构建成功
4. ❌ 红色叉号表示构建失败（点击查看错误日志）

### 步骤 5：下载安装包

#### 如果使用标签触发：

1. 访问仓库的 **"Releases"** 页面
2. 找到对应版本的 Release
3. 在 "Assets" 部分下载文件：
   - Windows: `React Tailwind App Setup 1.0.0.exe`
   - macOS: `React Tailwind App-1.0.0.dmg`

#### 如果手动触发：

1. 在 Actions 页面点击完成的工作流运行
2. 向下滚动到 "Artifacts" 部分
3. 下载对应平台的压缩包：
   - `AM-windows-xxx.zip`
   - `AM-macos-xxx.zip`

## 📦 分发给用户

### Windows 用户

1. 将 `.exe` 文件发送给用户
2. 用户双击运行安装程序
3. 按照安装向导完成安装

### macOS 用户

1. 将 `.dmg` 文件发送给用户
2. 用户双击打开 DMG 文件
3. 将应用拖到 Applications 文件夹
4. **重要**：首次打开时，需要：
   - 右键点击应用
   - 选择 "打开"
   - 点击 "打开" 按钮确认
   - （这是因为应用未经过 Apple 签名）

## 🔄 更新版本

当你需要发布新版本时：

```bash
# 1. 修改代码后提交
git add .
git commit -m "修复了某个问题"
git push origin main

# 2. 创建新版本标签
git tag v1.0.1
git push origin v1.0.1

# 3. GitHub Actions 会自动开始构建
```

## 🛠️ 自定义配置

### 修改应用名称

编辑 `package.json`：

```json
{
  "build": {
    "productName": "你的应用名称"
  }
}
```

### 添加应用图标

1. 准备图标文件：
   - Windows: `icon.ico` (256x256 或更大)
   - macOS: `icon.icns`

2. 将图标放在 `assets` 目录

3. 更新 `package.json`：

```json
{
  "build": {
    "win": {
      "icon": "assets/icon.ico"
    },
    "mac": {
      "icon": "assets/icon.icns"
    }
  }
}
```

### 修改安装程序设置

编辑 `package.json` 的 `build` 部分：

```json
{
  "build": {
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns",
      "category": "public.app-category.productivity"
    }
  }
}
```

## 🐛 故障排除

### 构建失败

1. **检查错误日志**：
   - 在 Actions 页面点击失败的工作流
   - 查看详细的错误信息

2. **常见问题**：
   - 依赖安装失败 → 检查 `package.json` 中的依赖
   - 前端构建失败 → 本地运行 `npm run build:frontend` 测试
   - Electron 构建失败 → 检查 `main.js` 是否有错误

### macOS 应用无法打开

这是正常的，因为应用没有签名。解决方法：

1. 右键点击应用
2. 选择 "打开"
3. 在弹出的对话框中点击 "打开"

或者在终端中执行：

```bash
xattr -cr "/Applications/React Tailwind App.app"
```

### GitHub Actions 配额

- 公开仓库：无限制的免费构建时间
- 私有仓库：每月 2000 分钟免费时间
- 查看使用情况：Settings → Billing → Plans and usage

## 📚 相关资源

- [Electron Builder 文档](https://www.electron.build/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

## 💡 最佳实践

1. **使用语义化版本号**：
   - v1.0.0 → 首次发布
   - v1.0.1 → Bug 修复
   - v1.1.0 → 新功能
   - v2.0.0 → 重大更新

2. **编写发布说明**：
   - 在 GitHub Releases 中添加更新日志
   - 说明新功能和修复的问题

3. **测试后再发布**：
   - 本地运行 `npm run dev:electron` 测试
   - 确保所有功能正常工作

4. **保持依赖更新**：
   ```bash
   npm outdated  # 查看过期的包
   npm update    # 更新依赖
   ```

## 🎉 恭喜！

你现在可以轻松地为 Windows 和 macOS 用户构建和分发应用了！

