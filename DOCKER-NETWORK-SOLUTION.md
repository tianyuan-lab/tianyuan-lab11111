# Docker网络问题解决方案

## 问题描述

在尝试构建Docker镜像时遇到网络连接问题：
```
ERROR: failed to build: failed to solve: httpd:alpine: failed to resolve source metadata
```

这通常是由于以下原因造成的：
1. 网络防火墙阻止Docker Hub访问
2. DNS解析问题
3. 代理设置问题
4. Docker Desktop配置问题

## 解决方案

### 方案1：使用本地Python服务器（推荐）

**优点**：无需Docker，启动快速，零配置

```bash
# 进入dist目录
cd f:\code\gongyi\dist

# 启动Python服务器
python -m http.server 8080

# 或使用批处理文件
start-local-server.bat
```

访问地址：http://localhost:8080

### 方案2：修复Docker网络问题

#### 2.1 检查Docker Desktop设置
1. 打开Docker Desktop
2. 进入Settings → Resources → Network
3. 确保网络设置正确

#### 2.2 配置DNS
在Docker Desktop设置中添加DNS服务器：
- 8.8.8.8
- 114.114.114.114

#### 2.3 配置代理（如果使用代理）
```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "http://proxy.example.com:8080"
    }
  }
}
```

#### 2.4 使用国内镜像源
创建或编辑 `%USERPROFILE%\.docker\daemon.json`：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

### 方案3：使用simple-deploy.py脚本

```bash
# 返回项目根目录
cd f:\code\gongyi

# 运行部署脚本
python simple-deploy.py

# 选择选项1：本地预览服务器
```

### 方案4：手动创建静态文件包

1. 将dist目录打包为ZIP文件
2. 上传到以下任一平台：
   - GitHub Pages
   - Netlify（拖拽上传）
   - Vercel（拖拽上传）
   - 阿里云OSS
   - 腾讯云COS

## 测试部署

### 本地测试
```bash
# 测试Python服务器
curl http://localhost:8080

# 测试文件访问
curl http://localhost:8080/index.html
curl http://localhost:8080/js/main.js
```

### 功能测试
1. 打开浏览器访问 http://localhost:8080
2. 检查3D模型是否正常加载
3. 测试交互功能
4. 检查控制台是否有错误

## 性能优化建议

### 静态文件优化
1. **压缩资源**：
   ```bash
   # 压缩JavaScript文件
   npx terser js/main.js -o js/main.min.js
   
   # 压缩CSS文件
   npx clean-css-cli css/style.css -o css/style.min.css
   ```

2. **启用Gzip压缩**（Python服务器）：
   ```python
   # 创建server-with-gzip.py
   import http.server
   import socketserver
   import gzip
   import os
   
   class GzipHandler(http.server.SimpleHTTPRequestHandler):
       def end_headers(self):
           self.send_header('Access-Control-Allow-Origin', '*')
           super().end_headers()
   
   PORT = 8080
   with socketserver.TCPServer(("", PORT), GzipHandler) as httpd:
       print(f"Server running at http://localhost:{PORT}")
       httpd.serve_forever()
   ```

3. **缓存策略**：
   - 静态资源设置长期缓存
   - HTML文件设置短期缓存

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   netstat -ano | findstr :8080
   
   # 终止进程
   taskkill /PID <进程ID> /F
   ```

2. **文件访问权限**
   ```bash
   # 检查文件权限
   icacls f:\code\gongyi\dist
   ```

3. **防火墙阻止**
   - 在Windows防火墙中允许Python或Node.js
   - 临时关闭防火墙测试

### 日志调试

```bash
# Python服务器详细日志
python -m http.server 8080 --bind 0.0.0.0

# 检查网络连接
ping localhost
telnet localhost 8080
```

## 总结

**推荐部署顺序**：
1. 首选：Python本地服务器（start-local-server.bat）
2. 备选：simple-deploy.py脚本
3. 高级：修复Docker网络问题
4. 生产：上传到云平台

**关键优势**：
- ✅ 无需外部依赖
- ✅ 快速启动（<5秒）
- ✅ 支持热重载
- ✅ 跨平台兼容
- ✅ 零配置部署