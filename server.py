#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3D脱硫塔工艺流程图 - Python本地服务器
用于启动Three.js前端项目的HTTP服务器
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# 服务器配置
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，支持CORS和正确的MIME类型"""
    
    def end_headers(self):
        # 添加CORS头部
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """改进MIME类型检测"""
        # 为JavaScript模块设置正确的MIME类型
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.mjs'):
            return 'application/javascript'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.glb'):
            return 'model/gltf-binary'
        elif path.endswith('.gltf'):
            return 'model/gltf+json'
        
        # 使用父类方法处理其他类型
        return super().guess_type(path)
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    """启动HTTP服务器"""
    
    # 确保在项目根目录运行
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    print(f"🚀 启动3D脱硫塔工艺流程图服务器...")
    print(f"📁 项目目录: {project_root}")
    print(f"🌐 服务地址: http://{HOST}:{PORT}")
    print(f"📄 主页面: http://{HOST}:{PORT}/index.html")
    print("\n📋 可用的测试页面:")
    
    # 列出所有HTML文件
    html_files = list(project_root.glob('*.html'))
    for html_file in sorted(html_files):
        if html_file.name != 'index.html':
            print(f"   • http://{HOST}:{PORT}/{html_file.name}")
    
    print("\n⚡ 服务器启动中...")
    print("💡 按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    try:
        # 创建服务器
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ 服务器已启动在 http://{HOST}:{PORT}")
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://{HOST}:{PORT}/index.html')
                print("🌐 已自动打开浏览器")
            except Exception as e:
                print(f"⚠️  无法自动打开浏览器: {e}")
                print(f"请手动访问: http://{HOST}:{PORT}/index.html")
            
            print("\n📊 服务器日志:")
            print("-" * 40)
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 服务器已停止")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Windows: Address already in use
            print(f"❌ 端口 {PORT} 已被占用")
            print(f"💡 请尝试使用其他端口: python server.py --port 8001")
        else:
            print(f"❌ 服务器启动失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # 支持命令行参数指定端口
    if len(sys.argv) > 1:
        if '--port' in sys.argv:
            try:
                port_index = sys.argv.index('--port') + 1
                PORT = int(sys.argv[port_index])
            except (ValueError, IndexError):
                print("❌ 无效的端口号")
                sys.exit(1)
        elif '--help' in sys.argv or '-h' in sys.argv:
            print("3D脱硫塔工艺流程图 - Python服务器")
            print("\n用法:")
            print("  python server.py              # 使用默认端口8000")
            print("  python server.py --port 8001  # 使用指定端口")
            print("  python server.py --help       # 显示帮助信息")
            sys.exit(0)
    
    main()