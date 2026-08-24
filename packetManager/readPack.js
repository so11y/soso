const path = require("path");
const fs = require("fs-extra");
const {
  findPackageFile,
  getOutlinePath,
  getPublishPath
} = require("../helper/share");
const { overwriteTarBall } = require("../helper/effect");
const { mergePackageInfo } = require("../helper/packageInfo");

function readPackageInfo(packagePath) {
  return fs.existsSync(packagePath) ? fs.readJsonSync(packagePath) : null;
}

class ReadPack {
  readInfo(packageName) {
    const packageFile = path.join(packageName, "package.json");
    const outlineInfo = readPackageInfo(getOutlinePath(packageFile));
    const publishedInfo = readPackageInfo(getPublishPath(packageFile));
    const packageInfo = mergePackageInfo(publishedInfo, outlineInfo);

    if (!packageInfo) {
      throw new Error("package not found");
    }

    overwriteTarBall(packageInfo);
    return JSON.stringify(packageInfo);
  }

  readTgz(packageName, version) {
    const packagePath = findPackageFile(packageName, `${version}.tgz`);
    if (packagePath) {
      return packagePath;
    }
    throw new Error("package not found");
  }
}

module.exports = ReadPack;
