#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3D脱硫塔工艺流程图 - 简化部署脚本
专为没有安装外部CLI工具的用户设计
支持本地预览、Docker部署和静态文件打包
"""

import os
import sys
import subprocess
import shutil
import webbrowser
import time
from pathlib import Path

class SimpleDeployer:
    """简化部署器 - 无需外部CLI工具"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dist_dir = self.project_root / 'dist'
        
    def check_python_server(self):
        """检查Python服务器是否可用"""
        try:
            import http.server
            import socketserver
            return True
        except ImportError:
            return False
    
    def check_docker(self):
        """检查Docker是否可用"""
        try:
            result = subprocess.run(['docker', '--version'], 
                                  capture_output=True, text=True, 
                                  encoding='utf-8', errors='ignore')
            return result.returncode == 0
        except (FileNotFoundError, UnicodeDecodeError):
            return False
    
    def build_project(self):
        """构建项目（复制文件到dist目录）"""
        print("🏗️  构建项目...")
        
        # 创建dist目录
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
        self.dist_dir.mkdir()
        
        # 复制必要文件
        files_to_copy = [
            'index.html',
            'css',
            'js',
            'assets',
            'config',
            'data'
        ]
        
        for item in files_to_copy:
            src = self.project_root / item
            if src.exists():
                if src.is_file():
                    shutil.copy2(src, self.dist_dir)
                else:
                    shutil.copytree(src, self.dist_dir / item)
                print(f"✅ 复制: {item}")
            else:
                print(f"⚠️  跳过: {item} (不存在)")
        
        # 复制部署相关文件
        deploy_files = ['Dockerfile', 'nginx.conf', 'docker-compose.yml']
        for file in deploy_files:
            src = self.project_root / file
            if src.exists():
                shutil.copy2(src, self.dist_dir)
                print(f"✅ 复制部署文件: {file}")
        
        print("✅ 项目构建完成！")
        return True
    
    def start_local_server(self, port=8000):
        """启动本地服务器"""
        print(f"🚀 启动本地服务器 (端口: {port})...")
        
        if not self.check_python_server():
            print("❌ Python HTTP服务器不可用")
            return False
        
        try:
            # 切换到项目根目录
            os.chdir(self.project_root)
            
            print(f"🌐 服务器地址: http://localhost:{port}")
            print(f"📁 服务目录: {self.project_root}")
            print("\n按 Ctrl+C 停止服务器")
            print("=" * 50)
            
            # 启动服务器
            subprocess.run([sys.executable, 'server.py', '--port', str(port)])
            
        except KeyboardInterrupt:
            print("\n👋 服务器已停止")
        except Exception as e:
            print(f"❌ 服务器启动失败: {e}")
            return False
        
        return True
    
    def deploy_with_docker(self):
        """使用Docker部署"""
        print("🐳 Docker部署...")
        
        if not self.check_docker():
            print("❌ Docker未安装或不可用")
            print("💡 请先安装Docker: https://www.docker.com/get-started")
            return False
        
        if not self.dist_dir.exists():
            print("📦 构建目录不存在，先构建项目...")
            if not self.build_project():
                return False
        
        try:
            # 切换到构建目录
            os.chdir(self.dist_dir)
            
            # 构建Docker镜像
            print("🏗️  构建Docker镜像...")
            build_cmd = ['docker', 'build', '-t', '3d-desulfurization-tower', '.']
            result = subprocess.run(build_cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
            
            if result.returncode != 0:
                print(f"❌ Docker镜像构建失败: {result.stderr}")
                print("💡 提示: 如果是网络问题，请尝试使用本地预览服务器")
                return False
            
            # 停止旧容器
            print("🛑 停止旧容器...")
            subprocess.run(['docker', 'stop', '3d-tower'], capture_output=True, encoding='utf-8', errors='ignore')
            subprocess.run(['docker', 'rm', '3d-tower'], capture_output=True, encoding='utf-8', errors='ignore')
            
            # 启动新容器
            print("▶️  启动新容器...")
            run_cmd = ['docker', 'run', '-d', '--name', '3d-tower', 
                      '-p', '80:80', '3d-desulfurization-tower']
            result = subprocess.run(run_cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
            
            if result.returncode == 0:
                print("✅ Docker部署成功！")
                print("🌐 访问地址: http://localhost")
                return True
            else:
                print(f"❌ Docker容器启动失败: {result.stderr}")
                print("💡 建议: 使用增强版Python服务器 (dist/server-with-gzip.py)")
                return False
                
        except Exception as e:
            print(f"❌ Docker部署异常: {str(e)}")
            print("💡 替代方案: 运行 python dist/server-with-gzip.py 8080")
            return False
    
    def create_static_package(self):
        """创建静态文件包"""
        print("📦 创建静态文件包...")
        
        if not self.build_project():
            return False
        
        # 创建压缩包
        package_name = '3d-desulfurization-tower-static'
        package_path = self.project_root / f'{package_name}.zip'
        
        try:
            import zipfile
            
            with zipfile.ZipFile(package_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(self.dist_dir):
                    for file in files:
                        file_path = Path(root) / file
                        arc_name = file_path.relative_to(self.dist_dir)
                        zipf.write(file_path, arc_name)
            
            print(f"✅ 静态文件包创建成功: {package_path}")
            print("💡 您可以将此文件上传到任何静态托管服务")
            return True
            
        except Exception as e:
            print(f"❌ 创建静态文件包失败: {e}")
            return False
    
    def show_menu(self):
        """显示部署菜单"""
        print("\n" + "=" * 50)
        print("🚀 3D脱硫塔 - 简化部署工具")
        print("=" * 50)
        print("选择部署方式:")
        print("  1. 本地预览服务器 (推荐)")
        print("  2. Docker部署 (需要Docker)")
        print("  3. 构建项目文件")
        print("  4. 创建静态文件包")
        print("  5. 显示系统状态")
        print("  0. 退出")
        print("=" * 50)
    
    def show_system_status(self):
        """显示系统状态"""
        print("\n📊 系统状态检查:")
        print("=" * 30)
        
        # Python版本
        print(f"🐍 Python: {sys.version.split()[0]}")
        
        # 项目文件检查
        key_files = ['index.html', 'js/main.js', 'css/style.css']
        for file in key_files:
            path = self.project_root / file
            status = "✅" if path.exists() else "❌"
            print(f"{status} {file}")
        
        # 构建目录
        dist_status = "✅" if self.dist_dir.exists() else "❌"
        print(f"{dist_status} 构建目录 (dist/)")
        
        # Docker状态
        docker_status = "✅" if self.check_docker() else "❌"
        print(f"{docker_status} Docker")
        
        print("=" * 30)
    
    def run(self):
        """运行简化部署器"""
        while True:
            self.show_menu()
            choice = input("\n请输入选择 (0-5): ").strip()
            
            if choice == '0':
                print("👋 退出部署程序")
                break
            elif choice == '1':
                port = input("输入端口号 (默认8000): ").strip()
                port = int(port) if port.isdigit() else 8000
                self.start_local_server(port)
            elif choice == '2':
                self.deploy_with_docker()
            elif choice == '3':
                self.build_project()
            elif choice == '4':
                self.create_static_package()
            elif choice == '5':
                self.show_system_status()
            else:
                print("❌ 无效选择，请重新输入")
            
            if choice != '1':  # 本地服务器会阻塞，不需要暂停
                input("\n按回车键继续...")

def main():
    """主函数"""
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--help', '-h']:
            print("3D脱硫塔 - 简化部署工具")
            print("\n特点:")
            print("  ✅ 无需安装外部CLI工具")
            print("  ✅ 支持本地预览")
            print("  ✅ 支持Docker部署")
            print("  ✅ 支持静态文件打包")
            print("\n用法:")
            print("  python simple-deploy.py        # 交互式部署")
            print("  python simple-deploy.py --help # 显示帮助")
            return
    
    deployer = SimpleDeployer()
    deployer.run()

if __name__ == '__main__':
    main()