# 🚀 快速开始 - 5 分钟构建 Windows 和 macOS 应用

## 第一步：推送代码到 GitHub

### 如果还没有 GitHub 仓库：

```bash
# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 创建提交
git commit -m "Initial commit: 增材制造平台"

# 4. 在 GitHub 创建仓库后，连接远程仓库
# 将下面的 YOUR_USERNAME 和 YOUR_REPO 替换为实际的值
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

### 如果已有 GitHub 仓库：

```bash
# 提交并推送最新代码
git add .
git commit -m "配置 GitHub Actions 自动构建"
git push origin main
```

## 第二步：触发构建

### 方法 A：使用标签触发（推荐）

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签（会自动触发构建）
git push origin v1.0.0
```

### 方法 B：手动触发

1. 访问你的 GitHub 仓库
2. 点击顶部的 **"Actions"** 标签
3. 左侧选择 **"Build Electron App"**
4. 点击右侧的 **"Run workflow"** 按钮
5. 选择 `main` 分支
6. 点击绿色的 **"Run workflow"** 确认

## 第三步：等待构建完成

1. 在 Actions 页面可以实时查看构建进度
2. 两个平台会同时构建（约 10-15 分钟）
3. ✅ 绿色勾号 = 构建成功
4. ❌ 红色叉号 = 构建失败（点击查看日志）

## 第四步：下载安装包

### 如果使用标签触发：

1. 访问仓库首页
2. 点击右侧的 **"Releases"**
3. 找到你的版本（如 v1.0.0）
4. 在 **"Assets"** 区域下载：
   - Windows: `React Tailwind App Setup 1.0.0.exe`
   - macOS: `React Tailwind App-1.0.0.dmg`

### 如果手动触发：

1. 在 Actions 页面点击完成的工作流
2. 向下滚动到 **"Artifacts"** 区域
3. 下载：
   - `AM-windows.zip`
   - `AM-macos.zip`

## 第五步：分发给用户

### Windows 用户：
1. 直接发送 `.exe` 文件
2. 双击运行安装

### macOS 用户：
1. 发送 `.dmg` 文件
2. 双击打开 DMG
3. 拖动应用到 Applications 文件夹
4. **首次运行**：右键 → "打开" → 确认（因为未签名）

---

## 📝 常用命令速查

```bash
# 提交并推送代码
git add .
git commit -m "描述你的更改"
git push origin main

# 发布新版本（触发构建）
git tag v1.0.1
git push origin v1.0.1

# 查看所有标签
git tag

# 查看提交历史
git log --oneline

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1
```

---

## 🐛 常见问题

### Q: 构建失败怎么办？

**A:** 点击 Actions 页面的失败任务，查看详细错误日志。常见原因：
- 依赖安装失败 → 检查 `package.json`
- 前端构建失败 → 本地运行 `npm run build:frontend` 测试
- 权限问题 → 确保仓库 Actions 已启用

### Q: macOS 用户说打不开应用？

**A:** 这是正常的！因为应用没有 Apple 签名。解决方法：
1. 右键点击应用
2. 选择 "打开"
3. 在弹窗中再次点击 "打开"

或在终端运行：
```bash
xattr -cr "/Applications/React Tailwind App.app"
```

### Q: 如何修改应用名称？

**A:** 编辑 `package.json` 中的 `build.productName`：
```json
{
  "build": {
    "productName": "你的应用名称"
  }
}
```

### Q: 想删除某个标签怎么办？

**A:** 
```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :refs/tags/v1.0.0
```

---

## 📚 更多帮助

- 📖 [完整部署指南](DEPLOYMENT.md) - 详细的使用说明
- 📖 [本地测试指南](test-build.md) - 推送前的测试
- 📖 [Git 命令大全](.github/GIT_COMMANDS.md) - Git 命令参考

---

## 🎉 完成！

现在你可以：
- ✅ 为 Windows 和 macOS 用户构建应用
- ✅ 不需要 macOS 电脑就能构建 macOS 应用
- ✅ 自动创建 Release 并上传安装包
- ✅ 每次发布新版本只需一行命令

**下次发布新版本时，只需要：**
```bash
git add .
git commit -m "v1.0.1: 修复某个问题"
git push origin main
git tag v1.0.1 && git push origin v1.0.1
```

