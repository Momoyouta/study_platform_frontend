# study_platform_frontend/deploy_frontend.ps1
$VM_USER = "root"
$VM_IP = "192.168.52.128"
$REMOTE_BASE = "/home/study_platform_project"

Write-Host ">>> Step 1: Building frontend..." -ForegroundColor Cyan
pnpm build

Write-Host ">>> Step 2: Packaging files..." -ForegroundColor Cyan
# 使用 tar 压缩 dist 文件夹 (Windows 10/11 自带 tar)
if (Test-Path "dist.tar.gz") { Remove-Item "dist.tar.gz" }
tar -czf dist.tar.gz dist

Write-Host ">>> Step 3: Syncing to VM..." -ForegroundColor Cyan
# 1. 确保父级目录存在
ssh $VM_USER@$VM_IP "mkdir -p $REMOTE_BASE/vite-app $REMOTE_BASE/nginx"

# 2. 传输压缩包
scp dist.tar.gz "$VM_USER@$VM_IP`:$REMOTE_BASE/vite-app/"

# 3. 远程解压并清理
# -C 表示切换到目录，--strip-components=1 可以把 dist/ 前缀去掉直接解压内容到当前目录
ssh $VM_USER@$VM_IP "cd $REMOTE_BASE/vite-app && rm -rf dist && mkdir dist && tar -xzf dist.tar.gz -C dist --strip-components=1 && rm dist.tar.gz"

# 4. 传输 nginx 配置
scp "nginx.conf" "$VM_USER@$VM_IP`:$REMOTE_BASE/nginx/nginx.conf"

Write-Host ">>> Step 4: Restarting Nginx container on VM..." -ForegroundColor Cyan
ssh $VM_USER@$VM_IP "cd $REMOTE_BASE && docker-compose restart nginx"

# 清理本地压缩包
if (Test-Path "dist.tar.gz") { Remove-Item "dist.tar.gz" }

Write-Host ">>> Frontend Deployment Complete!" -ForegroundColor Green
