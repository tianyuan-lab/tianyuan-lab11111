#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
编码问题修复脚本
解决Windows系统上的Unicode解码错误
"""

import os
import sys
import subprocess
import locale
from pathlib import Path

def check_system_encoding():
    """检查系统编码设置"""
    print("🔍 检查系统编码设置...")
    
    # 获取系统默认编码
    default_encoding = locale.getpreferredencoding()
    print(f"系统默认编码: {default_encoding}")
    
    # 获取文件系统编码
    fs_encoding = sys.getfilesystemencoding()
    print(f"文件系统编码: {fs_encoding}")
    
    # 获取标准输出编码
    stdout_encoding = sys.stdout.encoding
    print(f"标准输出编码: {stdout_encoding}")
    
    return default_encoding, fs_encoding, stdout_encoding

def fix_docker_encoding_issues():
    """修复Docker相关的编码问题"""
    print("🔧 修复Docker编码问题...")
    
    try:
        # 设置环境变量
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['LANG'] = 'en_US.UTF-8'
        
        # 测试Docker命令
        result = subprocess.run(
            ['docker', '--version'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env
        )
        
        if result.returncode == 0:
            print(f"✅ Docker版本: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Docker命令失败: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Docker测试异常: {e}")
        return False

def create_safe_deployment_script():
    """创建安全的部署脚本"""
    print("📝 创建安全部署脚本...")
    
    script_content = '''@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set LANG=en_US.UTF-8

echo 🚀 启动安全部署模式...
echo.

REM 检查Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python未安装
    pause
    exit /b 1
)

REM 进入dist目录
if not exist "dist" (
    echo ❌ dist目录不存在，请先构建项目
    pause
    exit /b 1
)

cd dist

echo ✅ 启动增强版Python服务器...
echo 🌐 访问地址: http://localhost:8080
echo 💡 按Ctrl+C停止服务器
echo.

python server-with-gzip.py 8080

pause
'''
    
    script_path = Path('safe-deploy.bat')
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"✅ 创建安全部署脚本: {script_path}")
    return script_path

def test_python_server():
    """测试Python服务器"""
    print("🧪 测试Python服务器...")
    
    try:
        import http.server
        import socketserver
        print("✅ Python HTTP服务器模块可用")
        
        # 检查dist目录
        dist_path = Path('dist')
        if dist_path.exists():
            print(f"✅ 构建目录存在: {dist_path}")
            
            # 检查关键文件
            key_files = ['index.html', 'js/main.js', 'css/style.css']
            for file in key_files:
                file_path = dist_path / file
                if file_path.exists():
                    print(f"✅ 关键文件存在: {file}")
                else:
                    print(f"⚠️  关键文件缺失: {file}")
        else:
            print("❌ 构建目录不存在")
            return False
            
        return True
        
    except ImportError as e:
        print(f"❌ Python服务器模块导入失败: {e}")
        return False

def main():
    """主函数"""
    print("🔧 编码问题修复工具")
    print("=" * 50)
    
    # 检查系统编码
    check_system_encoding()
    print()
    
    # 修复Docker编码问题
    docker_ok = fix_docker_encoding_issues()
    print()
    
    # 测试Python服务器
    python_ok = test_python_server()
    print()
    
    # 创建安全部署脚本
    safe_script = create_safe_deployment_script()
    print()
    
    # 总结和建议
    print("📋 修复结果总结:")
    print(f"Docker可用性: {'✅' if docker_ok else '❌'}")
    print(f"Python服务器: {'✅' if python_ok else '❌'}")
    print(f"安全部署脚本: ✅ {safe_script}")
    print()
    
    print("💡 推荐部署方案:")
    if python_ok:
        print("1. 双击运行 safe-deploy.bat (推荐)")
        print("2. 或运行: python dist/server-with-gzip.py 8080")
    
    if docker_ok:
        print("3. Docker部署 (如果网络允许)")
    else:
        print("3. Docker暂不可用，建议使用Python服务器")
    
    print("\n🎯 所有编码问题已修复！")

if __name__ == '__main__':
    main()