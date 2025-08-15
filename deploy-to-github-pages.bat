@echo off
echo ===================================================
echo  GitHub Pages 一键部署工具 - 3D脱硫塔工艺流程图
echo ===================================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请安装Python 3.6+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查Git是否安装
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Git，请安装Git
    echo 下载地址: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [信息] 开始部署到GitHub Pages...
echo.

:: 运行部署脚本
python deploy-to-github-pages.py

if %errorlevel% neq 0 (
    echo.
    echo [错误] 部署失败，请查看上方错误信息
    pause
    exit /b 1
)

echo.
echo [成功] 部署脚本执行完成!
echo.
echo 请按任意键退出...
pause >nul