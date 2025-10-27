# ✅ 推送前检查清单

在推送到 GitHub 触发自动构建之前，请完成以下检查：

## 📦 基本检查

- [ ] **依赖安装成功**
  ```bash
  npm install
  ```
  没有错误信息

- [ ] **前端构建成功**
  ```bash
  npm run build:frontend
  ```
  在 `dist/` 目录生成了文件

- [ ] **Electron 应用能正常运行**
  ```bash
  npm run dev:electron
  ```
  窗口打开且应用正常显示

## 🔧 配置检查

- [ ] **package.json 配置正确**
  - `version` 字段已更新
  - `productName` 符合预期
  - `build.appId` 已设置
  - `build.directories.output` 为 `dist-electron`

- [ ] **.gitignore 包含构建目录**
  - `dist/`
  - `dist-electron/`
  - `node_modules/`

- [ ] **GitHub Actions 工作流存在**
  - `.github/workflows/build.yml` 文件存在
  - 配置了 Windows 和 macOS 构建

## 📁 文件检查

- [ ] **必需文件都存在**
  - `main.js`
  - `preload.js`
  - `package.json`
  - `vite.config.js`
  - `src/` 目录
  - `index.html`

- [ ] **构建产物已生成**
  ```bash
  ls dist/
  # 应该看到 index.html 和 assets/ 目录
  ```

## 🧪 本地测试（可选但推荐）

- [ ] **测试本地打包（Windows）**
  ```bash
  npm run package:win
  ```
  - 构建成功
  - 在 `dist-electron/` 生成 `.exe` 文件
  - 可以安装并运行

## 🔍 代码检查

- [ ] **没有语法错误**
  - 运行 `npm run dev` 无错误
  - 浏览器控制台无错误

- [ ] **所有修改已提交**
  ```bash
  git status
  # 应该显示 "nothing to commit, working tree clean"
  ```

## 🚀 准备推送

- [ ] **版本号已更新**
  - `package.json` 中的 `version` 字段
  - 遵循语义化版本规范（如 1.0.0）

- [ ] **提交信息清晰**
  ```bash
  git log -1
  # 检查最后一次提交信息
  ```

## 📝 GitHub 检查

- [ ] **GitHub 仓库已创建**
- [ ] **远程仓库地址正确**
  ```bash
  git remote -v
  ```
- [ ] **有推送权限**

## ⚠️ 常见问题预检

- [ ] **端口 3000 未被占用**（开发时）
- [ ] **网络连接正常**（需要下载依赖）
- [ ] **磁盘空间充足**（至少 2GB）
- [ ] **Node.js 版本符合要求**（建议 18.x）
  ```bash
  node --version
  ```

---

## ✅ 全部检查完成后

### 推送代码
```bash
git push origin main
```

### 创建标签并触发构建
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 监控构建
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看构建进度

---

## 🆘 如果遇到问题

### 本地测试失败
1. 检查错误日志
2. 修复问题
3. 重新测试
4. **不要推送失败的代码**

### GitHub Actions 失败
1. 查看 Actions 页面的错误日志
2. 在本地复现问题
3. 修复后重新推送
4. 考虑删除失败的标签：
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

### 需要帮助
- 查看 [DEPLOYMENT.md](../DEPLOYMENT.md)
- 查看 [test-build.md](../test-build.md)
- 查看 GitHub Actions 日志

---

## 💡 专业提示

1. **先本地测试，后推送到 GitHub**
   - 节省 CI/CD 时间
   - 避免多次失败的构建

2. **使用有意义的提交信息**
   ```bash
   git commit -m "feat: 添加新功能"
   git commit -m "fix: 修复登录问题"
   git commit -m "docs: 更新文档"
   ```

3. **版本号规范**
   - `v1.0.0` - 首次发布
   - `v1.0.1` - Bug 修复
   - `v1.1.0` - 新功能
   - `v2.0.0` - 重大更新

4. **定期清理**
   ```bash
   # 清理旧的构建产物
   rm -rf dist dist-electron
   
   # 重新安装依赖（如果有问题）
   rm -rf node_modules package-lock.json
   npm install
   ```

---

**准备好了吗？开始推送吧！** 🚀

