#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
3D脱硫塔工艺流程图 - GitHub Pages 部署脚本

此脚本用于将项目部署到GitHub Pages，包括：
1. 构建项目
2. 创建gh-pages分支
3. 复制文件到gh-pages分支
4. 添加.nojekyll文件
5. 推送到GitHub
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import time


class GitHubPagesDeployer:
    def __init__(self):
        self.project_root = Path(os.getcwd()).resolve()
        self.dist_dir = self.project_root / 'dist'
        self.temp_dir = self.project_root / 'temp_gh_pages'
        self.branch_name = 'gh-pages'
        
        print("\n" + "=" * 60)
        print("🚀 3D脱硫塔工艺流程图 - GitHub Pages 部署工具")
        print("=" * 60)
    
    def check_git(self):
        """检查Git是否安装"""
        try:
            subprocess.run(['git', '--version'], 
                         capture_output=True, check=True)
            return True
        except (subprocess.SubprocessError, FileNotFoundError):
            print("❌ Git未安装或不在PATH中")
            print("💡 请安装Git: https://git-scm.com/downloads")
            return False
    
    def check_git_repo(self):
        """检查当前目录是否为Git仓库"""
        try:
            subprocess.run(['git', 'status'], 
                         capture_output=True, check=True)
            return True
        except subprocess.SubprocessError:
            print("❌ 当前目录不是Git仓库")
            choice = input("是否初始化Git仓库? (y/n): ").strip().lower()
            if choice == 'y':
                try:
                    subprocess.run(['git', 'init'], check=True)
                    print("✅ Git仓库已初始化")
                    
                    # 询问远程仓库
                    remote_url = input("请输入GitHub仓库URL (例如: https://github.com/username/repo.git): ").strip()
                    if remote_url:
                        subprocess.run(['git', 'remote', 'add', 'origin', remote_url], check=True)
                        print(f"✅ 已添加远程仓库: {remote_url}")
                    
                    return True
                except subprocess.SubprocessError as e:
                    print(f"❌ 初始化Git仓库失败: {e}")
                    return False
            else:
                return False
    
    def build_project(self):
        """构建项目"""
        print("\n📦 构建项目...")
        
        # 检查是否存在deploy.py
        if not (self.project_root / 'deploy.py').exists():
            print("❌ 未找到deploy.py脚本")
            return False
        
        try:
            # 运行deploy.py构建项目
            subprocess.run([sys.executable, 'deploy.py'], check=True)
            
            # 检查dist目录是否存在
            if not self.dist_dir.exists() or not self.dist_dir.is_dir():
                print("❌ 构建失败: 未找到dist目录")
                return False
            
            print("✅ 项目构建成功")
            return True
        except subprocess.SubprocessError as e:
            print(f"❌ 构建项目失败: {e}")
            return False
    
    def prepare_gh_pages(self):
        """准备gh-pages分支"""
        print("\n🔄 准备gh-pages分支...")
        
        try:
            # 获取当前分支
            current_branch = subprocess.run(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                capture_output=True, text=True, check=True
            ).stdout.strip()
            
            # 检查远程分支
            remote_branches = subprocess.run(
                ['git', 'branch', '-r'],
                capture_output=True, text=True, check=True
            ).stdout
            
            # 检查本地分支
            local_branches = subprocess.run(
                ['git', 'branch'],
                capture_output=True, text=True, check=True
            ).stdout
            
            # 创建临时目录
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
            self.temp_dir.mkdir(parents=True)
            
            # 复制dist目录内容到临时目录
            for item in self.dist_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, self.temp_dir)
                else:
                    dst = self.temp_dir / item.name
                    if dst.exists():
                        shutil.rmtree(dst)
                    shutil.copytree(item, dst)
            
            # 创建.nojekyll文件
            (self.temp_dir / '.nojekyll').touch()
            
            # 如果远程或本地存在gh-pages分支
            if f'origin/{self.branch_name}' in remote_branches or self.branch_name in local_branches:
                # 切换到gh-pages分支
                if self.branch_name in local_branches:
                    subprocess.run(['git', 'checkout', self.branch_name], check=True)
                else:
                    subprocess.run(['git', 'checkout', '-b', self.branch_name, f'origin/{self.branch_name}'], check=True)
                
                # 清空当前目录（保留.git）
                for item in self.project_root.iterdir():
                    if item.name != '.git' and item.name != str(self.temp_dir.name):
                        if item.is_file():
                            item.unlink()
                        else:
                            shutil.rmtree(item)
            else:
                # 创建新的gh-pages分支
                subprocess.run(['git', 'checkout', '--orphan', self.branch_name], check=True)
                # 清空工作目录
                subprocess.run(['git', 'rm', '-rf', '.'], check=True)
            
            # 复制临时目录内容到项目根目录
            for item in self.temp_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, self.project_root)
                else:
                    dst = self.project_root / item.name
                    if dst.exists():
                        shutil.rmtree(dst)
                    shutil.copytree(item, dst)
            
            print("✅ gh-pages分支准备完成")
            return current_branch
        except subprocess.SubprocessError as e:
            print(f"❌ 准备gh-pages分支失败: {e}")
            return None
        finally:
            # 清理临时目录
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
    
    def commit_and_push(self):
        """提交并推送到GitHub"""
        print("\n📤 提交并推送到GitHub...")
        
        try:
            # 添加所有文件
            subprocess.run(['git', 'add', '.'], check=True)
            
            # 提交更改
            commit_msg = f"Deploy to GitHub Pages - {time.strftime('%Y-%m-%d %H:%M:%S')}"
            subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
            
            # 推送到GitHub
            push_result = subprocess.run(
                ['git', 'push', 'origin', self.branch_name],
                capture_output=True, text=True
            )
            
            if push_result.returncode == 0:
                print("✅ 成功推送到GitHub")
                return True
            else:
                print(f"❌ 推送失败: {push_result.stderr}")
                
                # 询问是否强制推送
                choice = input("是否强制推送? (y/n): ").strip().lower()
                if choice == 'y':
                    force_push = subprocess.run(
                        ['git', 'push', '-f', 'origin', self.branch_name],
                        capture_output=True, text=True
                    )
                    if force_push.returncode == 0:
                        print("✅ 强制推送成功")
                        return True
                    else:
                        print(f"❌ 强制推送失败: {force_push.stderr}")
                        return False
                else:
                    return False
        except subprocess.SubprocessError as e:
            print(f"❌ 提交并推送失败: {e}")
            return False
    
    def switch_back(self, original_branch):
        """切换回原始分支"""
        if original_branch:
            try:
                subprocess.run(['git', 'checkout', original_branch], check=True)
                print(f"✅ 已切换回 {original_branch} 分支")
            except subprocess.SubprocessError as e:
                print(f"❌ 切换回原始分支失败: {e}")
    
    def show_instructions(self):
        """显示GitHub Pages设置说明"""
        print("\n" + "=" * 60)
        print("🎉 部署完成! 请按照以下步骤启用GitHub Pages:")
        print("=" * 60)
        print("1. 访问GitHub仓库页面")
        print("2. 点击 'Settings' 选项卡")
        print("3. 在左侧菜单中点击 'Pages'")
        print("4. 在 'Source' 部分选择 'Deploy from a branch'")
        print("5. 在 'Branch' 下拉菜单中选择 'gh-pages'")
        print("6. 点击 'Save'")
        print("7. 等待几分钟，然后访问您的GitHub Pages网站")
        print("   URL格式: https://username.github.io/repository-name")
        print("=" * 60)
        print("💡 提示: 如果您想使用自定义域名，可以在GitHub Pages设置中配置")
        print("=" * 60)
    
    def run(self):
        """运行部署流程"""
        # 检查Git
        if not self.check_git():
            return
        
        # 检查Git仓库
        if not self.check_git_repo():
            return
        
        # 构建项目
        if not self.build_project():
            return
        
        # 准备gh-pages分支
        original_branch = self.prepare_gh_pages()
        if original_branch is None:
            return
        
        # 提交并推送
        success = self.commit_and_push()
        
        # 切换回原始分支
        self.switch_back(original_branch)
        
        # 显示说明
        if success:
            self.show_instructions()


def main():
    deployer = GitHubPagesDeployer()
    deployer.run()


if __name__ == '__main__':
    main()