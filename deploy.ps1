# Couple App 一键部署脚本
# 用法: .\deploy.ps1 "更新说明"

param(
    [string]$message = "Update build"
)

Write-Host "🚀 开始部署 Couple App..." -ForegroundColor Cyan

# 添加构建文件
Write-Host "📦 添加构建文件..." -ForegroundColor Yellow
git add dist/build/web/

# 提交
Write-Host "💾 提交更改..." -ForegroundColor Yellow
git commit -m $message

# 推送
Write-Host "️  推送到 GitHub..." -ForegroundColor Yellow
git push

Write-Host "✅ 部署完成! Netlify 将自动部署..." -ForegroundColor Green
Write-Host " 访问: https://couple-app-dada.netlify.app" -ForegroundColor Cyan
