const path = require("path");
const fs = require("fs-extra");
const { getOutlinePath, getTgzPath } = require("../helper/share");
const { overwriteTarBall } = require("../helper/effect");

class ReadPack {
  constructor(packetManager) {
    this.packetManager = packetManager;
  }

  readInfo(packageName) {
    const findPack = [
      () => this.packetManager.getPublishedInfo(packageName),
      () => {
        const maybeHaveOutsidePackagePath = getOutlinePath(
          path.join(packageName, "package.json")
        );
        return fs.existsSync(maybeHaveOutsidePackagePath);
      }
    ].find(Boolean);

    if (!findPack) {
      throw new Error("package not found");
    }

    const packageInfo = fs.readJsonSync(findPack, "utf-8");
    overwriteTarBall(packageInfo);
    return JSON.stringify(packageInfo);
  }

  readTgz(packageName, version) {
    const [hasExist] = getTgzPath(packageName, version);
    if (hasExist) {
      return hasExist;
    }
    throw new Error("package not found");
  }
}

module.exports = ReadPack;
