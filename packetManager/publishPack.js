const path = require("path");
const fs = require("fs-extra");
const { getPublishPath } = require("../helper/share");
const { logger } = require("../helper/log");
const { overwriteTarBall } = require("../helper/effect");

class PublishPack {
  async writeFile(options) {
    const { packageDir, packageJson, packageData } = options;

    const packageJsonPath = path.join(packageDir, "package.json");

    const publishedInfo = overwriteTarBall(
      packageJson,
      process.env.INSIDE_SERVER_IP
    );

    await fs.writeJson(packageJsonPath, publishedInfo, {
      spaces: 2
    });

    // 处理 tarball 附件
    const tarballName = Object.keys(packageData._attachments)[0];
    const tarballData = packageData._attachments[tarballName].data;
    const tarballPath = path.join(packageDir, `${packageJson.version}.tgz`);

    const tarballBuffer = Buffer.from(tarballData, "base64");
    await fs.writeFile(tarballPath, tarballBuffer);

    logger.success(`Package files written to: ${packageDir}`);
  }

  async publish(packageName, packageData) {
    const version = packageData["dist-tags"].latest;
    const packageDir = getPublishPath(packageName);

    await fs.ensureDir(packageDir);
    const publishedPackage = (await this.getPublishedInfo(packageName)) || {};
    const packageJson = {
      name: packageData.name,
      version,
      "dist-tags": packageData["dist-tags"],
      versions: {
        ...publishedPackage.versions,
        ...packageData.versions
      }
    };

    await this.writeFile({ packageData, packageJson, packageDir });

    logger.success(`Package published: ${packageName}@${version}`);

    return {
      success: true,
      message: "Package published successfully!",
      packageName,
      version,
      publishPath: packageDir
    };
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
