# GitHub Pages 项目部署流程

## 📋 概述

GitHub Pages 是 GitHub 提供的免费静态网站托管服务，非常适合部署我们的 3D 脱硫塔工艺流程图项目。本指南将详细介绍如何将项目部署到 GitHub Pages。

## 🚀 快速部署（推荐）

### 方法一：使用自动化脚本

```bash
# 运行自动化部署脚本
python auto-deploy.py
# 选择选项 4: GitHub Pages
```

### 方法二：手动部署

#### 步骤 1：准备项目文件

```bash
# 构建项目
python deploy.py
```

#### 步骤 2：初始化 Git 仓库（如果尚未初始化）

```bash
# 初始化 Git 仓库
git init

# 添加远程仓库
git remote add origin https://github.com/username/repository-name.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit"

# 推送到主分支
git push -u origin main
```

#### 步骤 3：创建 gh-pages 分支

```bash
# 创建并切换到 gh-pages 分支
git checkout --orphan gh-pages

# 清空工作目录
git rm -rf .

# 复制 dist 目录内容到根目录
cp -r dist/* .

# 添加 .nojekyll 文件（重要！）
touch .nojekyll

# 提交并推送
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

#### 步骤 4：启用 GitHub Pages

1. 访问 GitHub 仓库页面
2. 点击 **Settings** 选项卡
3. 滚动到 **Pages** 部分
4. 在 **Source** 下选择 **Deploy from a branch**
5. 选择 **gh-pages** 分支
6. 点击 **Save**

## 🔧 配置文件设置

### 创建 .nojekyll 文件

在项目根目录创建 `.nojekyll` 文件以禁用 Jekyll 处理：

```bash
# 在项目根目录
touch .nojekyll
```

### GitHub Actions 自动部署（可选）

创建 `.github/workflows/deploy.yml` 文件实现自动部署：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Build project
      run: |
        python deploy.py
        
    - name: Create .nojekyll
      run: |
        touch dist/.nojekyll
        
    - name: Deploy to GitHub Pages
      uses: JamesIves/github-pages-deploy-action@v4
      with:
        branch: gh-pages
        folder: dist
        clean: true
```

## 📁 项目结构要求

部署到 GitHub Pages 的项目结构应该如下：

```
gh-pages 分支/
├── .nojekyll              # 禁用 Jekyll
├── index.html             # 主页面
├── css/
│   └── style.css         # 样式文件
├── js/
│   ├── main.js           # 主要 JavaScript
│   └── *.js              # 其他 JavaScript 模块
├── assets/
│   └── models/           # 3D 模型文件
├── config/
│   └── tower-config.json # 配置文件
└── data/
    └── process-flow.json # 数据文件
```

## 🌐 访问地址

部署成功后，您的项目将可通过以下地址访问：

- **默认地址**：`https://username.github.io/repository-name`
- **自定义域名**：可在仓库设置中配置

## ⚙️ 高级配置

### 自定义域名设置

1. 在 GitHub Pages 设置中添加自定义域名
2. 在域名提供商处设置 CNAME 记录指向 `username.github.io`
3. 在项目根目录创建 `CNAME` 文件：

```bash
echo "your-domain.com" > CNAME
```

### HTTPS 强制启用

在 GitHub Pages 设置中勾选 "Enforce HTTPS" 选项。

### 缓存和性能优化

GitHub Pages 自动提供以下优化：
- Gzip 压缩
- CDN 加速
- 静态资源缓存

## 🔍 故障排除

### 常见问题

1. **页面显示 404 错误**
   - 确保 `index.html` 文件在根目录
   - 检查 GitHub Pages 设置中的分支选择
   - 确认 `.nojekyll` 文件存在

2. **3D 模型不显示**
   - 检查模型文件路径是否正确
   - 确认 MIME 类型设置
   - 验证 CORS 配置

3. **CSS/JS 文件加载失败**
   - 检查文件路径（使用相对路径）
   - 确认文件名大小写匹配
   - 验证文件是否正确提交到 gh-pages 分支

4. **部署后更新不生效**
   - 清除浏览器缓存
   - 等待 GitHub Pages 缓存更新（通常 5-10 分钟）
   - 检查最新提交是否成功推送

### 调试步骤

```bash
# 检查 gh-pages 分支状态
git checkout gh-pages
git log --oneline -5

# 验证文件结构
ls -la

# 检查远程分支
git branch -r

# 强制推送（谨慎使用）
git push origin gh-pages --force
```

## 📊 部署检查清单

- [ ] 项目已构建（运行 `python deploy.py`）
- [ ] Git 仓库已初始化并推送到 GitHub
- [ ] 创建了 gh-pages 分支
- [ ] 添加了 `.nojekyll` 文件
- [ ] 在 GitHub 仓库设置中启用了 Pages
- [ ] 选择了正确的分支（gh-pages）
- [ ] 等待部署完成（5-10 分钟）
- [ ] 测试访问地址是否正常
- [ ] 验证所有功能是否正常工作

## 🚀 自动化部署脚本

为了简化部署流程，项目提供了自动化脚本：

```bash
# 使用自动化部署脚本
python auto-deploy.py

# 或使用简化部署脚本
python simple-deploy.py
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. 检查 GitHub Actions 日志（如果使用自动部署）
2. 查看浏览器开发者工具控制台
3. 参考 GitHub Pages 官方文档
4. 检查项目的其他部署文档：
   - `DEPLOYMENT_GUIDE.md`
   - `NO-CLI-DEPLOYMENT.md`
   - `DEPLOYMENT_CHECKLIST.md`

---

**部署成功后，您的 3D 脱硫塔工艺流程图将在全球范围内免费访问！** 🎉

> **提示**：GitHub Pages 提供免费的 HTTPS、CDN 加速和自定义域名支持，是静态网站部署的理想选择。