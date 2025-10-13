const WritePack = require("./writePack");
const ReadPack = require("./readPack");
const PublishPack = require("./publishPack");
const { whereEnvironment } = require("../helper/share");

class PackageManager {
  writePack = new WritePack(this);
  readPack = new ReadPack(this);
  publishPack = new PublishPack(this);

  getInfo(packageName) {
    return whereEnvironment(
      () => this.writePack.writeInfo(packageName),
      () => this.readPack.readInfo(packageName)
    );
  }

  getTgz(packageName, version) {
    return whereEnvironment(
      () => this.writePack.writeOutsideTgz(packageName, version),
      () => this.readPack.readTgz(packageName, version)
    );
  }

  async publish(packageName, version, packageData) {
    return this.publishPack.publish(packageName, version, packageData);
  }

  async getPublishedInfo(packageName) {
    return this.publishPack.getPublishedInfo(packageName);
  }
}

module.exports = PackageManager;
