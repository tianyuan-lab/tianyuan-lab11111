# 3D脱硫塔工艺流程图 - 部署检查清单

## 部署前准备

### 代码与资源检查

- [ ] 所有代码已完成测试并通过质量检查
- [ ] 移除所有调试代码、console.log 和开发注释
- [ ] 确认所有资源路径使用相对路径
- [ ] 检查所有 API 端点配置（如有）
- [ ] 确认所有第三方库引用使用生产版本
- [ ] 检查 Three.js 版本兼容性
- [ ] 确认所有 3D 模型已优化（压缩、LOD 等）
- [ ] 检查贴图分辨率是否适合生产环境

### 性能优化

- [ ] 执行资源压缩（JS、CSS、贴图）
- [ ] 使用 Draco 压缩 glTF/GLB 模型
- [ ] 使用 KTX2/Basis 压缩纹理（如适用）
- [ ] 合并小型 JS 文件减少 HTTP 请求
- [ ] 设置适当的资源缓存策略
- [ ] 检查并优化首次加载性能
- [ ] 实现懒加载策略（如适用）

### 兼容性检查

- [ ] 在主流桌面浏览器测试（Chrome、Firefox、Safari、Edge）
- [ ] 在主要移动设备浏览器测试（iOS Safari、Android Chrome）
- [ ] 检查 WebGL 兼容性和降级方案
- [ ] 验证响应式设计在不同屏幕尺寸下的表现

## 部署配置

### 基础配置

- [ ] 配置正确的 MIME 类型（特别是 .glb、.gltf、.bin 文件）
- [ ] 设置 CORS 头（允许模型和纹理加载）
- [ ] 配置 HTTP/2（如可用）提高并行加载性能
- [ ] 启用 Gzip/Brotli 压缩
- [ ] 设置适当的安全头（CSP、X-Content-Type-Options 等）

### 缓存策略

- [ ] 静态资源（JS、CSS）：长期缓存（1年）+ 版本化
- [ ] 3D 模型和贴图：长期缓存（1个月+）
- [ ] HTML 文件：短期或无缓存
- [ ] 配置 ETag 或 Last-Modified 头

### CDN 配置（如使用）

- [ ] 配置 CDN 缓存规则
- [ ] 设置正确的源站回源规则
- [ ] 配置 CDN HTTPS 设置
- [ ] 测试 CDN 资源加载性能

## 特定平台配置

### Vercel

- [ ] 创建并配置 vercel.json
- [ ] 设置环境变量（如需要）
- [ ] 配置构建命令（如需要）
- [ ] 设置自定义域名

```json
// vercel.json 配置示例
{
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)\\.(js|css|json|glb|gltf|bin|jpg|png|svg)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Netlify

- [ ] 创建并配置 netlify.toml
- [ ] 设置重定向规则（SPA 支持）
- [ ] 配置表单处理（如需要）
- [ ] 设置自定义域名

```toml
# netlify.toml 配置示例
[build]
  publish = "./"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.glb"
  [headers.values]
    Content-Type = "model/gltf-binary"
    Access-Control-Allow-Origin = "*"
```

### Docker

- [ ] 优化 Dockerfile
- [ ] 配置 Nginx 设置
- [ ] 设置健康检查
- [ ] 配置日志收集

```dockerfile
# Dockerfile 示例
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf 示例
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # MIME 类型
    types {
        model/gltf+json gltf;
        model/gltf-binary glb;
        application/octet-stream bin;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript model/gltf+json model/gltf-binary;
    
    # 缓存控制
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|glb|gltf|bin)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        add_header Access-Control-Allow-Origin *;
    }
    
    # SPA 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### GitHub Pages

- [ ] 创建 .nojekyll 文件
- [ ] 配置自定义域名（如需要）
- [ ] 设置 GitHub Actions 工作流（如需自动部署）

```yaml
# .github/workflows/deploy.yml 示例
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Build
        run: |
          npm ci
          npm run build
      
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: dist
```

## 部署后检查

### 功能验证

- [ ] 验证所有页面正常加载
- [ ] 确认所有 3D 模型正确显示
- [ ] 测试所有交互功能
- [ ] 验证动画和过渡效果
- [ ] 检查控制台是否有错误

### 性能验证

- [ ] 使用 Lighthouse 或 PageSpeed Insights 测试性能
- [ ] 检查首次加载时间
- [ ] 验证帧率是否稳定（特别是在移动设备上）
- [ ] 检查内存使用情况

### 安全检查

- [ ] 验证所有安全头是否正确设置
- [ ] 检查是否有敏感信息泄露
- [ ] 验证 HTTPS 配置

## 监控与维护

### 监控设置

- [ ] 配置错误跟踪（如 Sentry）
- [ ] 设置性能监控
- [ ] 配置可用性监控
- [ ] 设置日志收集和分析

### 维护计划

- [ ] 制定更新策略
- [ ] 设置备份流程
- [ ] 创建回滚计划
- [ ] 文档化维护流程

## 文档与支持

- [ ] 更新部署文档
- [ ] 创建故障排除指南
- [ ] 记录配置详情
- [ ] 提供支持联系信息

---

## 快速部署命令参考

### Docker 部署

```bash
# 构建镜像
docker build -t 3d-desulfurization-tower .

# 运行容器
docker run -d -p 80:80 --name 3d-tower 3d-desulfurization-tower

# 查看日志
docker logs 3d-tower
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Netlify 部署

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### 本地测试部署

```bash
# 使用 Python 简易服务器
python -m http.server 8000

# 使用 Node.js 服务器
npx serve .
```

---

> **注意**：此检查清单应根据项目具体需求进行调整。部署前务必进行全面测试，确保应用在目标环境中正常运行。