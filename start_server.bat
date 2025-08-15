@echo off
echo 正在启动3D脱硫塔工艺流程图服务器...
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python安装。
    echo 请安装Python 3.6+后再试。
    echo 可以从 https://www.python.org/downloads/ 下载Python。
    echo.
    pause
    exit /b 1
)

:: 启动服务器
echo [信息] 正在启动Python服务器...
echo [信息] 服务器启动后将自动打开浏览器。
echo [信息] 按Ctrl+C可以停止服务器。
echo.

python server.py

:: 如果服务器异常退出
if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器启动失败，请检查错误信息。
    pause
)