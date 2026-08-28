# 🚀 自动化发布系统

本项目已配置完整的自动化发布流程,确保每次发布都能自动编译、打包并发布到各个平台。

## ✨ 功能特性

- ✅ **一键发布**: 使用 `npm run release` 自动完成所有发布步骤
- ✅ **自动编译**: 发布前自动清理、lint、编译生产版本
- ✅ **自动打包**: 自动生成 VSIX 包
- ✅ **Git Hooks**: 推送 tag 前自动检查 VSIX 包是否存在
- ✅ **GitHub Actions**: 推送 tag 后自动发布到 Open VSX 和 GitHub Release
- ✅ **版本管理**: 支持自动更新版本号或使用当前版本

## 🎯 快速开始

### 发布新版本

```bash
# 方式 1: 使用当前版本号发布
npm run release

# 方式 2: 更新版本号并发布
npm run release 2.0.3
```

### 完整发布流程

1. **准备工作**
   ```bash
   # 确保所有改动已提交
   git status
   
   # 更新 CHANGELOG
   # 编辑 CHANGELOG.md 和 CHANGELOG.zh-CN.md
   
   # 提交 CHANGELOG
   git add CHANGELOG*.md
   git commit -m "docs: update changelog for v2.0.3"
   ```

2. **执行发布**
   ```bash
   npm run release 2.0.3
   ```

3. **验证发布**
   - 查看 [GitHub Actions](https://github.com/jlcodes99/vscode-antigravity-cockpit/actions)
   - 检查 [GitHub Release](https://github.com/jlcodes99/vscode-antigravity-cockpit/releases)
   - 验证 [Open VSX](https://open-vsx.org/extension/jlcodes/antigravity-cockpit)

## 📁 项目结构

```
scripts/
├── install-hooks.sh    # 安装 Git hooks
├── pre-version.sh      # 版本发布前的编译打包脚本
└── release.sh          # 一键发布脚本

.github/workflows/
├── publish-ovsx.yml    # 自动发布到 Open VSX
└── release.yml         # 自动创建 GitHub Release
```

## 🔧 工作原理

### 本地发布流程

```
npm run release
    ↓
清理构建产物 (rm -rf out *.vsix)
    ↓
运行 lint 检查 (npm run lint)
    ↓
编译生产版本 (npm run build:prod)
    ↓
打包 VSIX (npm run package)
    ↓
创建 Git tag (git tag v2.0.x)
    ↓
推送到 GitHub (git push --tags)
    ↓
触发 GitHub Actions
```

### GitHub Actions 流程

```
检测到 v* tag
    ↓
┌─────────────────┬─────────────────┐
│  publish-ovsx   │   release.yml   │
│                 │                 │
│  编译 → 打包     │  编译 → 打包     │
│  ↓              │  ↓              │
│  发布到 Open VSX │  上传到 Release  │
└─────────────────┴─────────────────┘
```

## 🛡️ Git Hooks

### pre-push Hook

在推送 tag 前自动检查:
- ✅ 检测是否推送 `v*` tag
- ✅ 验证 VSIX 包是否存在
- ✅ 版本号是否匹配

### 安装 Hooks

```bash
# 自动安装 (npm install 时)
npm install

# 手动安装
npm run postinstall
```

## 📋 发布前检查清单

- [ ] 所有功能已测试通过
- [ ] 代码已通过 lint 检查
- [ ] 更新 CHANGELOG.md 和 CHANGELOG.zh-CN.md
- [ ] 所有改动已提交到 Git
- [ ] 版本号符合语义化版本规范

## 🔍 故障排查

### VSIX 包未生成

```bash
# 清理并重新构建
rm -rf out node_modules
npm install
npm run build:prod
npm run package
```

### Tag 已存在

```bash
# 删除本地和远程 tag
git tag -d v2.0.3
git push origin :refs/tags/v2.0.3

# 重新创建
git tag v2.0.3
git push origin v2.0.3
```

### GitHub Actions 失败

1. 检查 Actions 日志
2. 验证 `OVSX_TOKEN` 配置
3. 使用手动发布: `npx ovsx publish -p YOUR_TOKEN`

## 📚 相关文档

- [完整发布文档](./PUBLISH.md)
- [CHANGELOG](../CHANGELOG.md)
- [CHANGELOG (中文)](../CHANGELOG.zh-CN.md)

## 💡 提示

- VSIX 包已在 `.gitignore` 中排除,不会提交到仓库
- 发布后无法撤回,请谨慎操作
- 版本号必须唯一,不能重复发布
- Tag 必须以 `v` 开头,例如 `v2.0.2`
