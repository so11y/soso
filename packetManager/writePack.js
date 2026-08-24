const path = require("path");
const fs = require("fs-extra");
const { requireImpl, getTgz } = require("../helper/request");
const { logger } = require("../helper/log");
const { MAX_RETRIES } = require("../helper/const");
const { mergePackageInfo } = require("../helper/packageInfo");
const {
  getOutlinePath,
  hasOutside,
  findPackageFile
} = require("../helper/share");
const {
  createWriteStream,
  overwriteTarBall,
  daySymLinkSync
} = require("../helper/effect");

class WritePack {
  constructor(packetManager) {
    this.packetManager = packetManager;
  }

  _writeInfo(packPath, data) {
    return fs.outputFile(path.join(packPath, `package.json`), data);
  }

  writeOutlineInfo(packName, data) {
    return this._writeInfo(getOutlinePath(packName), data);
  }

  async writeInfo(packageName) {
    const publishedInfo = await this.packetManager.getPublishedInfo(
      packageName
    );

    let outlineInfo;
    try {
      const response = await requireImpl.get(packageName);
      outlineInfo = response.data;
    } catch (error) {
      if (!publishedInfo) {
        throw error;
      }
      return JSON.stringify(overwriteTarBall(publishedInfo));
    }

    const hasCache = hasOutside(packageName);
    await this.writeOutlineInfo(
      packageName,
      JSON.stringify(
        overwriteTarBall(outlineInfo, process.env.INSIDE_SERVER_IP),
        null,
        4
      )
    );
    if (!hasCache) {
      daySymLinkSync(packageName);
    }

    const packageInfo = mergePackageInfo(publishedInfo, outlineInfo);
    return JSON.stringify(overwriteTarBall(packageInfo));
  }

  async writeOutsideTgz(packageName, version, updatePackage) {
    let attempt = 0;
    const { withComplete, createStream, pipe } = createWriteStream();
    const packagePath = findPackageFile(packageName, `${version}.tgz`);
    if (packagePath) {
      logger.success(`Tgz cache: ${packageName}/${version}.tgz`);
      return packagePath;
    }
    const outlinePackagePath = getOutlinePath(
      path.join(packageName, `${version}.tgz`)
    );
    const hasCachePackJSON = hasOutside(packageName);
    if (!hasCachePackJSON || updatePackage) {
      await this.writeInfo(packageName);
    }
    const downloadAndCreatePackagePath = async () => {
      while (attempt < MAX_RETRIES) {
        try {
          attempt++;
          const { data } = await requireImpl.get(packageName);
          const { data: downloadData } = await getTgz(
            data.versions[version].dist.tarball
          );
          pipe(downloadData);
          if (!hasOutside(packageName, version)) {
            daySymLinkSync(packageName);
          }
          createStream(outlinePackagePath);
          return outlinePackagePath;
        } catch (error) {
          if (attempt >= MAX_RETRIES) {
            logger.error(`Download tgz: ${error.message}`);
            return Promise.reject("Package not found");
          }
        }
      }
    };
    const selfPackagePath = await downloadAndCreatePackagePath();
    await withComplete();
    return selfPackagePath;
  }
}

module.exports = WritePack;
