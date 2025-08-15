# 无CLI工具部署指南

## 概述

如果您没有安装 Vercel CLI、Netlify CLI 等外部部署工具，不用担心！我们为您提供了多种简单的部署方案。

## 🚀 快速开始

### 方案一：本地预览（推荐）

最简单的方式，无需安装任何额外工具：

```bash
# 使用简化部署脚本
python simple-deploy.py

# 或直接启动服务器
python server.py
```

**访问地址：** http://localhost:8000

### 方案二：Docker部署

如果您已安装Docker：

```bash
# 使用简化部署脚本
python simple-deploy.py
# 选择选项 2

# 或手动Docker部署
python deploy.py  # 先构建项目
cd dist
docker build -t 3d-tower .
docker run -d -p 80:80 --name 3d-tower 3d-tower
```

**访问地址：** http://localhost

### 方案三：静态文件包

创建可上传到任何静态托管服务的文件包：

```bash
python simple-deploy.py
# 选择选项 4
```

生成的 `3d-desulfurization-tower-static.zip` 可以上传到：
- GitHub Pages
- Surge.sh
- Firebase Hosting
- 任何支持静态文件的托管服务

## 📋 部署选项对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 本地预览 | 零配置，即开即用 | 仅本地访问 | 开发测试 |
| Docker | 容器化，易迁移 | 需要Docker | 本地/服务器部署 |
| 静态文件包 | 兼容性好，易分享 | 需要手动上传 | 第三方托管 |

## 🛠️ 简化部署脚本功能

`simple-deploy.py` 提供以下功能：

1. **本地预览服务器**
   - 支持自定义端口
   - 自动CORS配置
   - 正确的MIME类型

2. **Docker部署**
   - 自动构建镜像
   - 容器管理
   - 端口映射

3. **项目构建**
   - 文件复制和整理
   - 依赖检查
   - 结构优化

4. **静态文件打包**
   - ZIP压缩
   - 完整文件结构
   - 即用格式

5. **系统状态检查**
   - 环境检测
   - 文件完整性
   - 依赖状态

## 🔧 故障排除

### 端口被占用
```bash
# 使用不同端口
python server.py --port 8001
```

### Python版本问题
确保使用 Python 3.6+：
```bash
python --version
```

### 文件权限问题
在Windows上，确保以管理员身份运行PowerShell或命令提示符。

### Docker问题
```bash
# 检查Docker状态
docker --version
docker ps

# 清理旧容器
docker stop 3d-tower
docker rm 3d-tower
```

## 📁 项目结构

```
gongyi/
├── simple-deploy.py     # 简化部署脚本
├── server.py           # 本地服务器
├── deploy.py           # 项目构建脚本
├── index.html          # 主页面
├── js/                 # JavaScript文件
├── css/                # 样式文件
├── assets/             # 3D模型等资源
└── dist/               # 构建输出目录
```

## 🌐 在线部署（手动）

如果您想部署到在线平台但没有CLI工具：

### GitHub Pages
1. 将项目推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择源分支（通常是main或gh-pages）

### Netlify（拖拽部署）
1. 运行 `python simple-deploy.py` 选择选项4创建静态包
2. 访问 https://app.netlify.com/drop
3. 拖拽生成的ZIP文件到页面

### Vercel（拖拽部署）
1. 创建静态文件包
2. 访问 https://vercel.com/new
3. 选择"Import from ZIP"

## 💡 最佳实践

1. **开发阶段**：使用本地预览服务器
2. **测试阶段**：使用Docker部署验证
3. **生产阶段**：创建静态包上传到CDN
4. **定期备份**：保存构建好的静态包

## 🆘 获取帮助

```bash
# 查看帮助信息
python simple-deploy.py --help
python server.py --help
```

---

**提示：** 这些方案都不需要安装额外的CLI工具，只需要Python环境即可运行！