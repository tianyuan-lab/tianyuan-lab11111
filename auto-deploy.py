#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3D脱硫塔工艺流程图 - 自动化部署脚本
支持一键部署到多个平台：Vercel、Netlify、Docker等
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class AutoDeployer:
    """自动化部署器"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dist_dir = self.project_root / 'dist'
        
    def check_prerequisites(self):
        """检查部署前置条件"""
        print("🔍 检查部署前置条件...")
        
        # 检查dist目录是否存在
        if not self.dist_dir.exists():
            print("❌ 构建目录不存在，请先运行: python deploy.py")
            return False
        
        print("✅ 构建目录检查通过")
        return True
    
    def check_command(self, command):
        """检查命令是否可用"""
        try:
            subprocess.run([command, '--version'], 
                         capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def deploy_to_vercel(self):
        """部署到Vercel"""
        print("🚀 部署到Vercel...")
        
        if not self.check_command('vercel'):
            print("❌ Vercel CLI未安装")
            print("💡 安装命令: npm i -g vercel")
            return False
        
        try:
            # 切换到项目根目录
            os.chdir(self.project_root)
            
            # 部署到Vercel
            result = subprocess.run(['vercel', '--prod', '--yes'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Vercel部署成功！")
                # 提取部署URL
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines:
                    if 'https://' in line and 'vercel.app' in line:
                        print(f"🌐 访问地址: {line.strip()}")
                        break
                return True
            else:
                print(f"❌ Vercel部署失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Vercel部署异常: {e}")
            return False
    
    def deploy_to_netlify(self):
        """部署到Netlify"""
        print("🚀 部署到Netlify...")
        
        if not self.check_command('netlify'):
            print("❌ Netlify CLI未安装")
            print("💡 安装命令: npm i -g netlify-cli")
            return False
        
        try:
            # 切换到项目根目录
            os.chdir(self.project_root)
            
            # 部署到Netlify
            result = subprocess.run(['netlify', 'deploy', '--prod', '--dir', '.'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Netlify部署成功！")
                # 提取部署URL
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines:
                    if 'Live Draft URL:' in line or 'Website URL:' in line:
                        url = line.split(': ')[-1].strip()
                        print(f"🌐 访问地址: {url}")
                        break
                return True
            else:
                print(f"❌ Netlify部署失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Netlify部署异常: {e}")
            return False
    
    def deploy_to_docker(self):
        """部署到Docker"""
        print("🚀 部署到Docker...")
        
        if not self.check_command('docker'):
            print("❌ Docker未安装")
            print("💡 请先安装Docker: https://www.docker.com/get-started")
            return False
        
        try:
            # 切换到构建目录
            os.chdir(self.dist_dir)
            
            # 构建Docker镜像
            print("🏗️  构建Docker镜像...")
            build_result = subprocess.run(['docker', 'build', '-t', '3d-desulfurization-tower', '.'], 
                                        capture_output=True, text=True)
            
            if build_result.returncode != 0:
                print(f"❌ Docker镜像构建失败: {build_result.stderr}")
                return False
            
            # 停止旧容器
            print("🛑 停止旧容器...")
            subprocess.run(['docker', 'stop', '3d-tower'], capture_output=True)
            subprocess.run(['docker', 'rm', '3d-tower'], capture_output=True)
            
            # 启动新容器
            print("▶️  启动新容器...")
            run_result = subprocess.run(['docker', 'run', '-d', '--name', '3d-tower', 
                                       '-p', '80:80', '3d-desulfurization-tower'], 
                                      capture_output=True, text=True)
            
            if run_result.returncode == 0:
                print("✅ Docker部署成功！")
                print("🌐 访问地址: http://localhost")
                return True
            else:
                print(f"❌ Docker容器启动失败: {run_result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Docker部署异常: {e}")
            return False
    
    def deploy_to_github_pages(self):
        """部署到GitHub Pages"""
        print("🚀 部署到GitHub Pages...")
        
        if not self.check_command('git'):
            print("❌ Git未安装")
            return False
        
        try:
            # 检查是否在Git仓库中
            git_check = subprocess.run(['git', 'status'], 
                                     capture_output=True, text=True)
            
            if git_check.returncode != 0:
                print("❌ 当前目录不是Git仓库")
                print("💡 请先初始化Git仓库并推送到GitHub")
                return False
            
            # 切换到项目根目录
            os.chdir(self.project_root)
            
            # 创建gh-pages分支并推送
            print("📤 推送到gh-pages分支...")
            
            # 检查是否有gh-pages分支
            branch_check = subprocess.run(['git', 'branch', '-r'], 
                                        capture_output=True, text=True)
            
            if 'origin/gh-pages' not in branch_check.stdout:
                # 创建新的gh-pages分支
                subprocess.run(['git', 'checkout', '--orphan', 'gh-pages'], 
                             capture_output=True)
                subprocess.run(['git', 'rm', '-rf', '.'], capture_output=True)
            else:
                # 切换到现有gh-pages分支
                subprocess.run(['git', 'checkout', 'gh-pages'], capture_output=True)
                subprocess.run(['git', 'pull', 'origin', 'gh-pages'], capture_output=True)
            
            # 复制dist目录内容到根目录
            import shutil
            for item in self.dist_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, self.project_root)
                else:
                    dst = self.project_root / item.name
                    if dst.exists():
                        shutil.rmtree(dst)
                    shutil.copytree(item, dst)
            
            # 提交并推送
            subprocess.run(['git', 'add', '.'], capture_output=True)
            subprocess.run(['git', 'commit', '-m', 'Deploy to GitHub Pages'], 
                         capture_output=True)
            push_result = subprocess.run(['git', 'push', 'origin', 'gh-pages'], 
                                       capture_output=True, text=True)
            
            if push_result.returncode == 0:
                print("✅ GitHub Pages部署成功！")
                print("💡 请在GitHub仓库设置中启用GitHub Pages")
                print("🌐 访问地址: https://username.github.io/repository-name")
                return True
            else:
                print(f"❌ GitHub Pages推送失败: {push_result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ GitHub Pages部署异常: {e}")
            return False
    
    def show_menu(self):
        """显示部署菜单"""
        print("\n" + "=" * 50)
        print("🚀 3D脱硫塔工艺流程图 - 自动化部署")
        print("=" * 50)
        print("请选择部署平台:")
        print("  1. Vercel (推荐 - 全球CDN)")
        print("  2. Netlify (静态托管)")
        print("  3. Docker (本地/服务器)")
        print("  4. GitHub Pages (免费托管)")
        print("  5. 全部部署")
        print("  0. 退出")
        print("=" * 50)
    
    def run(self):
        """运行自动化部署"""
        if not self.check_prerequisites():
            return
        
        while True:
            self.show_menu()
            choice = input("\n请输入选择 (0-5): ").strip()
            
            if choice == '0':
                print("👋 退出部署程序")
                break
            elif choice == '1':
                self.deploy_to_vercel()
            elif choice == '2':
                self.deploy_to_netlify()
            elif choice == '3':
                self.deploy_to_docker()
            elif choice == '4':
                self.deploy_to_github_pages()
            elif choice == '5':
                print("🚀 开始全平台部署...")
                platforms = [
                    ('Vercel', self.deploy_to_vercel),
                    ('Netlify', self.deploy_to_netlify),
                    ('Docker', self.deploy_to_docker),
                    ('GitHub Pages', self.deploy_to_github_pages)
                ]
                
                results = []
                for name, deploy_func in platforms:
                    print(f"\n📦 部署到 {name}...")
                    success = deploy_func()
                    results.append((name, success))
                
                print("\n" + "=" * 30)
                print("📊 部署结果汇总:")
                for name, success in results:
                    status = "✅ 成功" if success else "❌ 失败"
                    print(f"  {name}: {status}")
                print("=" * 30)
            else:
                print("❌ 无效选择，请重新输入")
            
            input("\n按回车键继续...")

def main():
    """主函数"""
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--help', '-h']:
            print("3D脱硫塔工艺流程图 - 自动化部署工具")
            print("\n用法:")
            print("  python auto-deploy.py        # 交互式部署")
            print("  python auto-deploy.py --help # 显示帮助")
            return
    
    deployer = AutoDeployer()
    deployer.run()

if __name__ == '__main__':
    main()