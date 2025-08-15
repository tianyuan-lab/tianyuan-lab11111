#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3D脱硫塔工艺流程图 - 生产环境部署脚本
支持多种部署方式：静态文件服务器、Docker容器、云服务平台
"""

import os
import sys
import shutil
import json
import subprocess
from pathlib import Path
from datetime import datetime

class ProjectDeployer:
    """项目部署器"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.build_dir = self.project_root / 'dist'
        self.config = self.load_config()
        
    def load_config(self):
        """加载部署配置"""
        config_file = self.project_root / 'deploy-config.json'
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self.get_default_config()
    
    def get_default_config(self):
        """获取默认配置"""
        return {
            "project_name": "3d-desulfurization-tower",
            "version": "1.0.0",
            "build_dir": "dist",
            "exclude_files": [
                "*.md", "*.py", "*.bat", "requirements.txt",
                "debug-*.html", "test-*.html", "minimal-debug.html"
            ],
            "cdn": {
                "three_js": "https://cdn.skypack.dev/three@0.132.2",
                "orbit_controls": "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js"
            },
            "optimization": {
                "minify_js": False,
                "compress_assets": True,
                "generate_manifest": True
            }
        }
    
    def create_build_directory(self):
        """创建构建目录"""
        print(f"🏗️  创建构建目录: {self.build_dir}")
        
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        
        self.build_dir.mkdir(parents=True, exist_ok=True)
        print("✅ 构建目录创建完成")
    
    def copy_project_files(self):
        """复制项目文件到构建目录"""
        print("📁 复制项目文件...")
        
        exclude_patterns = self.config.get('exclude_files', [])
        
        # 复制主要文件和目录
        files_to_copy = [
            'index.html',
            'css/',
            'js/',
            'assets/',
            'config/',
            'data/'
        ]
        
        for item in files_to_copy:
            src_path = self.project_root / item
            if src_path.exists():
                if src_path.is_file():
                    dst_path = self.build_dir / item
                    dst_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_path, dst_path)
                    print(f"  ✓ 复制文件: {item}")
                else:
                    dst_path = self.build_dir / item
                    shutil.copytree(src_path, dst_path, ignore=shutil.ignore_patterns(*exclude_patterns))
                    print(f"  ✓ 复制目录: {item}")
        
        print("✅ 项目文件复制完成")
    
    def optimize_html(self):
        """优化HTML文件"""
        print("🔧 优化HTML文件...")
        
        index_file = self.build_dir / 'index.html'
        if not index_file.exists():
            print("❌ index.html 文件不存在")
            return
        
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 添加生产环境优化
        optimizations = [
            # 添加缓存控制
            '<meta http-equiv="Cache-Control" content="public, max-age=31536000">',
            # 添加预加载提示
            '<link rel="preload" href="js/main.js" as="script">',
            '<link rel="preload" href="css/style.css" as="style">',
            # 添加性能监控
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
        ]
        
        # 在head标签中插入优化代码
        head_end = content.find('</head>')
        if head_end != -1:
            optimized_content = content[:head_end] + '\n    ' + '\n    '.join(optimizations) + '\n' + content[head_end:]
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(optimized_content)
            
            print("✅ HTML优化完成")
    
    def generate_manifest(self):
        """生成部署清单"""
        print("📋 生成部署清单...")
        
        manifest = {
            "name": self.config['project_name'],
            "version": self.config['version'],
            "build_time": datetime.now().isoformat(),
            "files": [],
            "total_size": 0
        }
        
        # 遍历构建目录，记录所有文件
        for file_path in self.build_dir.rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(self.build_dir)
                file_size = file_path.stat().st_size
                
                manifest['files'].append({
                    "path": str(relative_path).replace('\\', '/'),
                    "size": file_size,
                    "type": file_path.suffix[1:] if file_path.suffix else "unknown"
                })
                
                manifest['total_size'] += file_size
        
        # 保存清单文件
        manifest_file = self.build_dir / 'manifest.json'
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 部署清单生成完成 (总大小: {manifest['total_size'] / 1024:.1f} KB)")
    
    def create_nginx_config(self):
        """创建Nginx配置文件"""
        print("🌐 创建Nginx配置文件...")
        
        nginx_config = f"""# 3D脱硫塔工艺流程图 - Nginx配置
server {{
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    root /var/www/{self.config['project_name']};
    index index.html;
    
    # 启用Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }}
    
    # HTML文件不缓存
    location ~* \.html$ {{
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }}
    
    # 主路由
    location / {{
        try_files $uri $uri/ /index.html;
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }}
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # 错误页面
    error_page 404 /index.html;
}}
"""
        
        nginx_file = self.build_dir / 'nginx.conf'
        with open(nginx_file, 'w', encoding='utf-8') as f:
            f.write(nginx_config)
        
        print("✅ Nginx配置文件创建完成")
    
    def create_docker_files(self):
        """创建Docker部署文件"""
        print("🐳 创建Docker部署文件...")
        
        # Dockerfile
        dockerfile_content = f"""# 3D脱硫塔工艺流程图 - Docker镜像
FROM nginx:alpine

# 复制项目文件
COPY . /usr/share/nginx/html/

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
"""
        
        dockerfile = self.build_dir / 'Dockerfile'
        with open(dockerfile, 'w', encoding='utf-8') as f:
            f.write(dockerfile_content)
        
        # docker-compose.yml
        compose_content = f"""version: '3.8'

services:
  {self.config['project_name']}:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NGINX_HOST=localhost
      - NGINX_PORT=80
    volumes:
      - ./logs:/var/log/nginx
"""
        
        compose_file = self.build_dir / 'docker-compose.yml'
        with open(compose_file, 'w', encoding='utf-8') as f:
            f.write(compose_content)
        
        print("✅ Docker文件创建完成")
    
    def create_deployment_scripts(self):
        """创建部署脚本"""
        print("📜 创建部署脚本...")
        
        # 部署脚本
        deploy_script = f"""#!/bin/bash
# 3D脱硫塔工艺流程图 - 部署脚本

set -e

echo "🚀 开始部署 {self.config['project_name']}..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 构建Docker镜像
echo "🏗️  构建Docker镜像..."
docker build -t {self.config['project_name']}:latest .

# 停止旧容器
echo "🛑 停止旧容器..."
docker stop {self.config['project_name']} 2>/dev/null || true
docker rm {self.config['project_name']} 2>/dev/null || true

# 启动新容器
echo "▶️  启动新容器..."
docker run -d --name {self.config['project_name']} -p 80:80 {self.config['project_name']}:latest

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost"
"""
        
        deploy_file = self.build_dir / 'deploy.sh'
        with open(deploy_file, 'w', encoding='utf-8') as f:
            f.write(deploy_script)
        
        # 设置执行权限
        os.chmod(deploy_file, 0o755)
        
        print("✅ 部署脚本创建完成")
    
    def create_readme(self):
        """创建部署说明文档"""
        print("📖 创建部署说明文档...")
        
        readme_content = f"""# {self.config['project_name']} - 生产环境部署

## 项目信息

- **项目名称**: 3D脱硫塔工艺流程图
- **版本**: {self.config['version']}
- **构建时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **技术栈**: Three.js, WebGL, HTML5

## 部署方式

### 方式一：Docker部署（推荐）

1. 确保已安装Docker和Docker Compose
2. 运行部署脚本：
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
3. 访问 http://localhost

### 方式二：Nginx静态部署

1. 将项目文件复制到Web服务器目录：
   ```bash
   sudo cp -r . /var/www/{self.config['project_name']}/
   ```

2. 配置Nginx：
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/{self.config['project_name']}
   sudo ln -s /etc/nginx/sites-available/{self.config['project_name']} /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

### 方式三：云服务部署

#### Vercel部署
1. 安装Vercel CLI: `npm i -g vercel`
2. 在项目目录运行: `vercel`
3. 按提示完成部署

#### Netlify部署
1. 将项目文件夹拖拽到 https://app.netlify.com/drop
2. 或使用Netlify CLI: `netlify deploy --prod --dir .`

## 性能优化

- ✅ 启用Gzip压缩
- ✅ 静态资源缓存
- ✅ CDN加速（Three.js库）
- ✅ 预加载关键资源
- ✅ 移动端适配

## 监控和维护

- 查看容器日志: `docker logs {self.config['project_name']}`
- 重启服务: `docker restart {self.config['project_name']}`
- 更新部署: 重新运行 `./deploy.sh`

## 故障排除

1. **端口冲突**: 修改docker-compose.yml中的端口映射
2. **资源加载失败**: 检查CDN链接和网络连接
3. **性能问题**: 启用浏览器硬件加速，检查WebGL支持

## 技术支持

如有问题，请检查：
- 浏览器控制台错误信息
- 服务器日志
- 网络连接状态
"""
        
        readme_file = self.build_dir / 'README_DEPLOY.md'
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print("✅ 部署说明文档创建完成")
    
    def build(self):
        """执行完整构建流程"""
        print("🚀 开始构建生产环境部署包...")
        print("=" * 50)
        
        try:
            self.create_build_directory()
            self.copy_project_files()
            self.optimize_html()
            self.generate_manifest()
            self.create_nginx_config()
            self.create_docker_files()
            self.create_deployment_scripts()
            self.create_readme()
            
            print("=" * 50)
            print("🎉 构建完成！")
            print(f"📁 构建目录: {self.build_dir}")
            print("\n📋 部署选项:")
            print("  1. Docker部署: cd dist && ./deploy.sh")
            print("  2. 静态部署: 复制dist目录到Web服务器")
            print("  3. 云服务部署: 参考 README_DEPLOY.md")
            
        except Exception as e:
            print(f"❌ 构建失败: {e}")
            sys.exit(1)

def main():
    """主函数"""
    deployer = ProjectDeployer()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--help' or sys.argv[1] == '-h':
            print("3D脱硫塔工艺流程图 - 部署工具")
            print("\n用法:")
            print("  python deploy.py        # 构建部署包")
            print("  python deploy.py --help # 显示帮助")
            return
    
    deployer.build()

if __name__ == '__main__':
    main()