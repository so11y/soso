const WritePack = require("./writePack");
const ReadPack = require("./readPack");
const PublishPack = require("./publishPack");
const { whereEnvironment } = require("../helper/share");

class PackageManager {
  writePack = new WritePack(this);
  readPack = new ReadPack();
  publishPack = new PublishPack();

  getInfo(packageName) {
    return whereEnvironment(
      () => this.writePack.writeInfo(packageName),
      () => this.readPack.readInfo(packageName)
    );
  }

  getTgz(packageName, version, updatePackage) {
    return whereEnvironment(
      () => this.writePack.writeOutsideTgz(packageName, version, updatePackage),
      () => this.readPack.readTgz(packageName, version)
    );
  }

  async publish(packageName, packageData) {
    return this.publishPack.publish(packageName, packageData);
  }

  async getPublishedInfo(packageName) {
    return this.publishPack.getPublishedInfo(packageName);
  }

  async listPublished() {
    return this.publishPack.listPublished();
  }
}

module.exports = PackageManager;
