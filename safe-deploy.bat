@echo off
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
