const path = require("path");
const fs = require("fs-extra");
const { cratePerVersionJson } = require("../helper/publish");
const { getOutlinePath, getPublishPath } = require("../helper/share");
const { logger } = require("../helper/log");
const { createSymLinkSync, publishSymLinkSync } = require("../helper/effect");

class PublishPack {
  constructor(packetManager) {
    this.packetManager = packetManager;
  }

  async writeFile(options) {
    const { packageDir, packageJson, packageData } = options;

    const packageJsonPath = path.join(packageDir, "package.json");

    // 确保目录存在
    fs.ensureDirSync(packageDir);

    // 写入 package.json
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // 处理 tarball 附件
    const tarballName = Object.keys(packageData._attachments)[0];
    const tarballData = packageData._attachments[tarballName].data;
    const tarballPath = path.join(packageDir, `${packageJson.version}.tgz`);

    const tarballBuffer = Buffer.from(tarballData, "base64");
    await fs.writeFile(tarballPath, tarballBuffer);

    logger.success(`Package files written to: ${packageDir}`);
  }

  async publish(packageName, packageData) {
    try {
      // 获取最新版本
      const version = packageData["dist-tags"].latest;

      // 读取已存在的包信息（用于版本合并）
      const perVersion = cratePerVersionJson(getPublishPath(packageName));

      // 构建 package.json 数据
      const packageJson = {
        name: packageData.name,
        version: version,
        "dist-tags": packageData["dist-tags"],
        versions: {
          ...perVersion.versions,
          ...packageData.versions
        }
      };

      // 更新所有版本的 tarball URL
      Object.keys(packageJson.versions).forEach((version) => {
        packageJson.versions[
          version
        ].dist.tarball = `${process.env.SERVER_IP}/package/${packageName}/${version}`;
      });

      const packageDir = getOutlinePath(packageName);

      await this.writeFile({
        packageData,
        packageJson,
        packageDir: packageDir
      });

      publishSymLinkSync(packageName);

      logger.success(`Package published: ${packageName}@${version}`);

      return {
        success: true,
        message: "Package published successfully!",
        packageName,
        version,
        publishPath: getPublishPath(packageName),
        cachePath: packageDir
      };
    } catch (error) {
      logger.error(`Publish failed: ${error.message}`);
      throw new Error(`Publish failed: ${error.message}`);
    }
  }

  async getPublishedInfo(packageName) {
    const publishPackagePath = getPublishPath(
      path.join(packageName, "package.json")
    );

    if (!fs.existsSync(publishPackagePath)) {
      return null;
    }

    return fs.readJsonSync(publishPackagePath);
  }

  async listPublished() {
    const publishBasePath = getPublishPath();
    if (!fs.existsSync(publishBasePath)) {
      return [];
    }

    const packages = await fs.readdir(publishBasePath);
    const result = [];

    for (const pkg of packages) {
      const packagePath = path.join(publishBasePath, pkg, "package.json");
      if (fs.existsSync(packagePath)) {
        const packageInfo = await fs.readJson(packagePath);
        result.push({
          name: packageInfo.name,
          version: packageInfo.version,
          "dist-tags": packageInfo["dist-tags"],
          publishTime: fs.statSync(packagePath).mtime
        });
      }
    }

    return result;
  }
}

module.exports = PublishPack;
