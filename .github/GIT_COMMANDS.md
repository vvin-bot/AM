# Git 命令速查表 - 快速参考

## 📦 首次推送到 GitHub

```bash
# 1. 初始化仓库
git init

# 2. 添加所有文件
git add .

# 3. 创建首次提交
git commit -m "Initial commit"

# 4. 在 GitHub 创建仓库后，添加远程地址
git remote add origin https://github.com/你的用户名/仓库名.git

# 5. 推送到 main 分支
git branch -M main
git push -u origin main
```

## 🔄 日常开发流程

### 提交并推送更改

```bash
# 1. 查看当前状态
git status

# 2. 添加修改的文件
git add .                    # 添加所有文件
# 或
git add 文件名               # 添加指定文件

# 3. 提交更改
git commit -m "描述你的修改"

# 4. 推送到 GitHub
git push origin main
```

### 快速提交命令（三步合一）

```bash
git add . && git commit -m "修改描述" && git push origin main
```

## 🏷️ 版本标签管理

### 创建并推送标签（触发自动构建）

```bash
# 创建标签
git tag v1.0.0

# 推送标签到 GitHub（会触发 GitHub Actions 构建）
git push origin v1.0.0

# 或者一次性推送所有标签
git push origin --tags
```

### 查看所有标签

```bash
git tag
```

### 删除标签

```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :refs/tags/v1.0.0
```

### 查看标签详情

```bash
git show v1.0.0
```

## 📋 常用版本号

```bash
# 首次发布
git tag v1.0.0 && git push origin v1.0.0

# 修复 Bug
git tag v1.0.1 && git push origin v1.0.1

# 新增功能
git tag v1.1.0 && git push origin v1.1.0

# 重大更新
git tag v2.0.0 && git push origin v2.0.0
```

## 🔍 查看历史

### 查看提交历史

```bash
# 简洁版
git log --oneline

# 完整版
git log

# 图形化显示
git log --graph --oneline --all

# 查看最近 5 条
git log -5
```

### 查看某个文件的修改历史

```bash
git log --follow 文件名
```

## 🌿 分支管理

### 创建和切换分支

```bash
# 创建新分支
git branch 分支名

# 切换分支
git checkout 分支名

# 创建并切换（一步完成）
git checkout -b 分支名
```

### 合并分支

```bash
# 切换到主分支
git checkout main

# 合并其他分支
git merge 分支名
```

### 删除分支

```bash
# 删除本地分支
git branch -d 分支名

# 强制删除
git branch -D 分支名
```

## ↩️ 撤销操作

### 撤销未提交的修改

```bash
# 撤销所有修改
git checkout .

# 撤销指定文件的修改
git checkout -- 文件名
```

### 撤销已添加但未提交的文件

```bash
# 取消暂存所有文件
git reset HEAD

# 取消暂存指定文件
git reset HEAD 文件名
```

### 修改最后一次提交

```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件到上一次提交
git add 遗漏的文件
git commit --amend --no-edit
```

## 🔄 同步远程仓库

### 拉取最新代码

```bash
# 拉取并合并
git pull origin main

# 等同于
git fetch origin
git merge origin/main
```

### 查看远程仓库信息

```bash
# 查看远程仓库
git remote -v

# 查看远程分支
git branch -r
```

## 🛠️ 实用技巧

### 暂存当前工作

```bash
# 暂存修改
git stash

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop

# 清除所有暂存
git stash clear
```

### 克隆仓库

```bash
# 克隆仓库
git clone https://github.com/用户名/仓库名.git

# 克隆指定分支
git clone -b 分支名 https://github.com/用户名/仓库名.git
```

### 查看文件差异

```bash
# 查看未暂存的修改
git diff

# 查看已暂存的修改
git diff --staged

# 比较两个分支
git diff 分支1 分支2
```

## 🚨 紧急情况

### 回退到上一个版本

```bash
# 软回退（保留修改）
git reset --soft HEAD~1

# 混合回退（修改变为未暂存）
git reset --mixed HEAD~1

# 硬回退（丢弃所有修改，危险！）
git reset --hard HEAD~1
```

### 回退到指定提交

```bash
# 查看提交历史获取 commit ID
git log --oneline

# 回退到指定提交
git reset --hard commit_id

# 推送到远程（需要强制推送）
git push origin main --force
```

⚠️ **注意**：`--force` 会覆盖远程历史，在团队协作时要谨慎使用！

## 📚 配置 Git

### 设置用户信息

```bash
# 设置用户名
git config --global user.name "你的名字"

# 设置邮箱
git config --global user.email "你的邮箱@example.com"

# 查看配置
git config --list
```

### 配置编辑器

```bash
# 设置默认编辑器为 VSCode
git config --global core.editor "code --wait"
```

### 配置别名（快捷命令）

```bash
# 设置常用别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'

# 使用别名
git st          # 等同于 git status
git co main     # 等同于 git checkout main
```

## 🎯 完整工作流示例

### 开发新功能并发布

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发并提交
git add .
git commit -m "实现新功能"

# 3. 切换回主分支
git checkout main

# 4. 合并功能分支
git merge feature/new-feature

# 5. 推送到远程
git push origin main

# 6. 创建版本标签
git tag v1.1.0
git push origin v1.1.0

# 7. 删除功能分支
git branch -d feature/new-feature
```

### 修复 Bug 并快速发布

```bash
# 1. 修改代码
# ... 修复 bug ...

# 2. 提交修复
git add .
git commit -m "修复：解决某个问题"
git push origin main

# 3. 发布补丁版本
git tag v1.0.1
git push origin v1.0.1
```

## 💡 实用命令组合

### 清理项目

```bash
# 删除所有未跟踪的文件和目录
git clean -fd

# 查看将要删除的文件（不实际删除）
git clean -n
```

### 搜索提交历史

```bash
# 搜索包含特定文本的提交
git log --all --grep="搜索词"

# 搜索修改了特定代码的提交
git log -S "要搜索的代码"
```

### 查看贡献者

```bash
# 查看所有贡献者
git shortlog -sn

# 查看某个文件的贡献者
git blame 文件名
```

## 🔗 有用的链接

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 文档](https://docs.github.com)
- [Git 命令速查表（PDF）](https://education.github.com/git-cheat-sheet-education.pdf)
- [学习 Git 分支（交互式）](https://learngitbranching.js.org/?locale=zh_CN)

---

💡 **提示**：将这个文件添加到书签，随时查看常用命令！

