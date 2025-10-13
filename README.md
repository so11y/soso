# soso - Private npm Registry Service

soso 是一个用于内网环境的轻量级 npm registry 服务，允许您在内网环境中进行 npm install 操作,结构简单，方便把控包的安装完整性。

## 特性

- 内网和外网环境下的 npm install 支持。
- 支持软链接机制，如果主包不存在，则将今天新增的包软链接到 day 包，方便内网环境快速获取当天新增的依赖包。

## 配置 npm registry

将 npm 的 registry 配置为 soso 提供的地址，以便在内网环境中使用。

```bash
npm config set registry <soso_registry_url>
```

## 注意事项

- `npm publish` 和 `npm adduser` 功能正在开发中，敬请期待后续更新。
- 如有问题或建议，请在 GitHub 项目页面提交 issue。
