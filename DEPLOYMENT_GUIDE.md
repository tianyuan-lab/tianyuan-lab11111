# 3D脱硫塔工艺流程图 - 完整部署指南

## 🚀 快速开始

### 1. 构建部署包

```bash
# 生成生产环境部署包
python deploy.py
```

构建完成后，所有部署文件将生成在 `dist/` 目录中。

## 📦 部署方式选择

### 🐳 方式一：Docker部署（推荐）

**适用场景**：服务器环境、容器化部署

```bash
# 进入构建目录
cd dist

# 一键部署
./deploy.sh

# 或手动部署
docker build -t 3d-desulfurization-tower .
docker run -d -p 80:80 --name 3d-tower 3d-desulfurization-tower
```

**访问地址**：http://localhost

### 🌐 方式二：云平台部署

#### Vercel部署（推荐）

**适用场景**：快速上线、全球CDN加速

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

或直接拖拽项目文件夹到 [Vercel Dashboard](https://vercel.com/new)

#### Netlify部署

**适用场景**：静态站点托管、表单处理

```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署到Netlify
netlify deploy --prod --dir .
```

或直接拖拽项目文件夹到 [Netlify Drop](https://app.netlify.com/drop)

#### GitHub Pages部署

**快速部署（推荐）**：
```bash
# 使用专用部署脚本
python deploy-to-github-pages.py

# 或使用批处理文件（Windows）
deploy-to-github-pages.bat

# 或使用自动化脚本
python auto-deploy.py  # 选择选项 4
```

**手动部署**：
1. 构建项目：`python deploy.py`
2. 创建gh-pages分支并推送dist目录内容
3. 在GitHub仓库设置中启用Pages
4. 选择gh-pages分支作为源
5. 访问 `https://username.github.io/repository-name`

**详细说明**：参见 `GITHUB-PAGES-DEPLOYMENT.md`

### 🖥️ 方式三：传统服务器部署

#### Nginx部署

```bash
# 复制文件到Web目录
sudo cp -r dist/* /var/www/html/

# 配置Nginx
sudo cp dist/nginx.conf /etc/nginx/sites-available/3d-tower
sudo ln -s /etc/nginx/sites-available/3d-tower /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Apache部署

```bash
# 复制文件到Web目录
sudo cp -r dist/* /var/www/html/

# 创建.htaccess文件
echo "RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]" > /var/www/html/.htaccess
```

### 💻 方式四：本地开发服务器

```bash
# Python服务器（已配置）
python server.py

# Node.js服务器
npx http-server . -p 8000 -c-1

# PHP服务器
php -S localhost:8000
```

## 🔧 配置说明

### 部署配置文件

- `deploy-config.json`：部署参数配置
- `vercel.json`：Vercel平台配置
- `netlify.toml`：Netlify平台配置
- `nginx.conf`：Nginx服务器配置
- `Dockerfile`：Docker容器配置

### 性能优化配置

- ✅ **Gzip压缩**：减少传输大小
- ✅ **静态资源缓存**：1年缓存期
- ✅ **CDN加速**：Three.js库使用CDN
- ✅ **预加载**：关键资源预加载
- ✅ **CORS支持**：跨域资源共享

## 🌍 域名和SSL配置

### 自定义域名

1. **Vercel**：在项目设置中添加自定义域名
2. **Netlify**：在域名管理中添加域名
3. **传统服务器**：修改nginx.conf中的server_name

### SSL证书

- **云平台**：自动提供免费SSL证书
- **传统服务器**：使用Let's Encrypt免费证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

## 📊 监控和维护

### 性能监控

- 使用浏览器开发者工具监控加载性能
- 检查WebGL渲染性能
- 监控内存使用情况

### 日志查看

```bash
# Docker日志
docker logs 3d-tower

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新部署

```bash
# 重新构建
python deploy.py

# Docker更新
cd dist && ./deploy.sh

# 云平台更新
vercel --prod  # 或 netlify deploy --prod
```

## 🔍 故障排除

### 常见问题

1. **资源加载失败**
   - 检查网络连接
   - 验证CDN链接可用性
   - 检查CORS配置

2. **3D模型不显示**
   - 确认WebGL支持
   - 检查浏览器兼容性
   - 验证模型文件路径

3. **性能问题**
   - 启用硬件加速
   - 检查内存使用
   - 优化模型复杂度

### 浏览器兼容性

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ❌ IE（不支持）

## 📞 技术支持

如遇到部署问题，请检查：

1. 浏览器控制台错误信息
2. 服务器日志文件
3. 网络连接状态
4. 防火墙设置

---

**部署成功后，您的3D脱硫塔工艺流程图将可以在全球范围内访问！** 🎉