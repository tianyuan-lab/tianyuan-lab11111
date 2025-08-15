@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 3D脱硫塔项目 - 快速部署工具
echo ========================================
echo.

:: 检查Python环境
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装或未添加到PATH
    echo 💡 请先安装Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查是否已构建
if not exist "dist" (
    echo 📦 检测到未构建，正在执行构建...
    python deploy.py
    if errorlevel 1 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
    echo ✅ 构建完成
    echo.
)

:: 显示部署选项
echo 请选择快速部署方式:
echo   1. 本地预览 (推荐 - 立即可用)
echo   2. Docker部署 (生产环境)
echo   3. 自动化部署 (多平台选择)
echo   0. 退出
echo.
set /p choice="请输入选择 (0-3): "

if "%choice%"=="0" (
    echo 👋 退出部署程序
    goto :end
)

if "%choice%"=="1" (
    echo.
    echo 🌐 启动本地预览服务器...
    echo 📍 访问地址: http://localhost:8000
    echo 💡 按Ctrl+C停止服务器
    echo.
    python server.py
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo 🐳 检查Docker环境...
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker未安装
        echo 💡 请先安装Docker: https://www.docker.com/get-started
        pause
        goto :end
    )
    
    echo ✅ Docker环境正常
    echo 🏗️  构建Docker镜像...
    cd dist
    docker build -t 3d-desulfurization-tower .
    if errorlevel 1 (
        echo ❌ Docker镜像构建失败
        cd ..
        pause
        goto :end
    )
    
    echo 🛑 停止旧容器...
    docker stop 3d-tower >nul 2>&1
    docker rm 3d-tower >nul 2>&1
    
    echo ▶️  启动新容器...
    docker run -d --name 3d-tower -p 80:80 3d-desulfurization-tower
    if errorlevel 1 (
        echo ❌ Docker容器启动失败
        cd ..
        pause
        goto :end
    )
    
    echo ✅ Docker部署成功！
    echo 🌐 访问地址: http://localhost
    echo 💡 管理命令:
    echo     docker stop 3d-tower    # 停止容器
    echo     docker start 3d-tower   # 启动容器
    echo     docker logs 3d-tower    # 查看日志
    cd ..
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo 🚀 启动自动化部署程序...
    python auto-deploy.py
    goto :end
)

echo ❌ 无效选择

:end
echo.
echo 按任意键退出...
pause >nul