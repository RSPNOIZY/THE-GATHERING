# 自动发布到 Open VSX Registry

## � 快速发布（推荐）

使用一键发布脚本,自动完成编译、打包、发布全流程:

```bash
# 方式 1: 使用当前版本号发布（package.json 中的版本）
npm run release

# 方式 2: 更新版本号并发布
npm run release 2.0.3
```

**脚本会自动执行:**
1. ✅ 清理旧的构建产物
2. ✅ 运行 lint 检查
3. ✅ 编译生产版本
4. ✅ 打包 VSIX
5. ✅ 创建 Git tag
6. ✅ 推送到 GitHub
7. ✅ 触发 GitHub Actions 自动发布

---

## 📦 完整发布流程

### 步骤 1: 准备发布

```bash
# 1. 确保所有改动已提交
git status

# 2. 更新 CHANGELOG（重要！）
# 编辑 CHANGELOG.md 和 CHANGELOG.zh-CN.md
# 添加新版本的更新内容

# 3. 提交 CHANGELOG
git add CHANGELOG*.md
git commit -m "docs: update changelog for v2.0.3"
```

### 步骤 2: 执行发布

```bash
# 使用发布脚本（推荐）
npm run release 2.0.3

# 或者手动执行
./scripts/release.sh 2.0.3
```

### 步骤 3: 验证发布

1. **查看 GitHub Actions 进度**
   - 访问: https://github.com/jlcodes99/vscode-antigravity-cockpit/actions
   - 确认 "Publish to Open VSX Registry" 和 "Release VSIX" 工作流成功

2. **检查 GitHub Release**
   - 访问: https://github.com/jlcodes99/vscode-antigravity-cockpit/releases
   - 确认新版本已发布,VSIX 包已上传

3. **验证 Open VSX**
   - 访问: https://open-vsx.org/extension/jlcodes/antigravity-cockpit
   - 确认新版本已上线

---

## 🔧 自动化配置

### Git Hooks

项目已配置 Git hooks,在推送 tag 前自动检查:

- **pre-push hook**: 推送 tag 时检查 VSIX 包是否存在
- **自动安装**: 运行 `npm install` 时自动安装 hooks

手动安装 hooks:
```bash
npm run postinstall
# 或
bash scripts/install-hooks.sh
```

### GitHub Actions

配置了两个自动化工作流:

1. **publish-ovsx.yml**: 发布到 Open VSX Registry
   - 触发条件: 推送 `v*` tag
   - 执行步骤: 编译 → 打包 → 发布到 Open VSX

2. **release.yml**: 创建 GitHub Release
   - 触发条件: 推送 `v*` tag
   - 执行步骤: 编译 → 打包 → 上传 VSIX 到 Release

### GitHub Secrets

已配置的 Secret:
- `OVSX_TOKEN`: Open VSX Registry 的 Personal Access Token

---

## 📋 发布前检查清单

- [ ] 所有功能已测试通过
- [ ] 代码已通过 lint 检查 (`npm run lint`)
- [ ] 更新 `CHANGELOG.md` 和 `CHANGELOG.zh-CN.md`
- [ ] 更新 `package.json` 中的 `version` 字段（如果使用参数发布则自动更新）
- [ ] 所有改动已提交到 Git
- [ ] Tag 版本号与 `package.json` 一致

---

## 🚀 版本号规范

遵循语义化版本（Semantic Versioning）:

- **主版本号（Major）**: 不兼容的 API 修改
  - 例如: `v2.0.0` → `v3.0.0`
  
- **次版本号（Minor）**: 向下兼容的功能性新增
  - 例如: `v2.0.0` → `v2.1.0`
  
- **修订号（Patch）**: 向下兼容的问题修正
  - 例如: `v2.0.0` → `v2.0.1`

---

## 🛠️ 手动发布（备用方案）

如果自动化脚本失败,可以手动发布:

```bash
# 1. 编译生产版本
npm run build:prod

# 2. 打包 VSIX
npm run package

# 3. 创建 tag
git tag v2.0.3
git push origin v2.0.3

# 4. 手动发布到 Open VSX（如果 GitHub Actions 失败）
npx ovsx publish -p YOUR_TOKEN
```

---

## 📝 注意事项

1. **Tag 必须以 `v` 开头**,例如 `v2.0.2`
2. **版本号必须唯一**,不能重复发布相同版本
3. **发布后无法撤回**,请谨慎操作
4. **VSIX 包不提交到 Git**,已在 `.gitignore` 中排除
5. **查看发布日志**: GitHub 仓库 → Actions 标签页

---

## 🐛 故障排查

### 问题: GitHub Actions 发布失败

**解决方案:**
1. 检查 `OVSX_TOKEN` 是否正确配置
2. 查看 Actions 日志,确认具体错误
3. 使用手动发布作为备用方案

### 问题: VSIX 包未生成

**解决方案:**
```bash
# 清理并重新构建
rm -rf out node_modules
npm install
npm run build:prod
npm run package
```

### 问题: Tag 已存在

**解决方案:**
```bash
# 删除本地 tag
git tag -d v2.0.3

# 删除远程 tag
git push origin :refs/tags/v2.0.3

# 重新创建 tag
git tag v2.0.3
git push origin v2.0.3
```

