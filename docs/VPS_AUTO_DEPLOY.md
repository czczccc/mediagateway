# VPS 自动部署

本项目在 `main` 分支的 Docker 镜像构建成功后，会由 GitHub Actions 自动通过 SSH 更新 VPS：

```text
合并到 main → 构建并推送 backend/frontend 镜像 → SSH 更新 VPS → 健康检查
```

生产 compose 使用以下镜像地址：

```text
ghcr.io/czczccc/mediagateway-backend:latest
ghcr.io/czczccc/mediagateway-frontend:latest
```

## 一次性配置 VPS

在 VPS 上准备一个专用部署目录，并确保该目录是仓库的 `main` 分支工作区：

```bash
git clone https://github.com/czczccc/mediagateway.git /opt/mediagateway
cd /opt/mediagateway
mkdir -p storage/videos storage/temp
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 ENCRYPTION_KEY、SECRET_KEY 和 Provider 配置
docker compose up -d
```

如果仓库是私有仓库，需要在 VPS 上为部署用户配置 GitHub 只读 Deploy Key，并将 `origin` 设置为 SSH 地址。不要把个人账号密码写入脚本。

如果 GHCR 镜像不是公开可拉取的，需要在 VPS 上使用只读 GHCR Token 登录一次：

```bash
echo '<GHCR_READ_TOKEN>' | docker login ghcr.io -u '<GITHUB_USERNAME>' --password-stdin
```

Token 不要提交到仓库或写入文档。

## 配置 GitHub Environment

在 GitHub 仓库的 `Settings → Environments` 创建环境 `production`，添加以下 Environment secrets：

| Secret | 内容 |
|---|---|
| `VPS_HOST` | `124.223.112.9` |
| `VPS_PORT` | SSH 端口，默认可填 `22` |
| `VPS_USER` | VPS 部署用户 |
| `VPS_APP_DIR` | VPS 上仓库绝对路径，例如 `/opt/mediagateway` |
| `VPS_SSH_KEY` | 部署用户对应的 SSH 私钥，完整多行内容 |
| `VPS_KNOWN_HOSTS` | VPS 的已核验 SSH host key |

`VPS_KNOWN_HOSTS` 必须来自你确认过的服务器指纹。可以在可信环境中执行：

```bash
ssh-keyscan -H 124.223.112.9
```

请先通过 VPS 控制台、服务商面板或其他可信渠道核对指纹，再把结果保存为 Secret；不要盲目接受未知 host key。

## 运行方式

现有 `.github/workflows/docker-build.yml` 的 `deploy-vps` job 只会在 `main` push 触发，并且等待 backend 与 frontend 镜像都构建成功后执行。它会：

1. 使用已配置的 host key 建立 SSH 连接；
2. 在 VPS 的 `main` 工作区执行 `git fetch` 和快进合并；
3. 执行 `docker compose pull` 与 `docker compose up -d --remove-orphans`；
4. 检查 `http://127.0.0.1:3001/health` 和前端首页。

部署使用串行 concurrency，同一时间只允许一个生产部署。

## 回滚

优先在 GitHub 上回滚触发部署的提交，然后正常合并到 `main`：

```bash
git revert <bad-commit>
git push origin main
```

GitHub Actions 会重新构建镜像并自动部署回滚后的版本。部署失败时，工作流会失败并保留 VPS 当前容器状态，不会自动删除存储目录或覆盖服务器上的本地修改。
