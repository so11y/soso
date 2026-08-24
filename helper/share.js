const path = require("path");
const fs = require("fs-extra");
const dayjs = require("dayjs");
const { OUTLINE_DIR, PACK_DIR, PUBLISH_DIR } = require("./const");

function getOutlinePath(_path = "") {
  return path.join(process.cwd(), PACK_DIR, OUTLINE_DIR, _path);
}

function getPublishPath(_path = "") {
  return path.join(process.cwd(), PACK_DIR, PUBLISH_DIR, _path);
}

function getDayPath(_path = "") {
  return path.join(
    process.cwd(),
    PACK_DIR,
    "day",
    dayjs().format("YYYY-MM-DD"),
    _path
  );
}

function hasOutside(packageName, version) {
  if (!version) {
    return (
      isOutside() &&
      fs.existsSync(getOutlinePath(path.join(packageName, "package.json")))
    );
  }
  return (
    isOutside() &&
    fs.existsSync(getOutlinePath(path.join(packageName, `${version}.tgz`)))
  );
}

function findPackageFile(packageName, fileName) {
  const packageFile = path.join(packageName, fileName);
  return [getOutlinePath(packageFile), getPublishPath(packageFile)].find(
    fs.existsSync
  );
}

function whereEnvironment(outsideCallback, insideCallback) {
  return isOutside() ? outsideCallback() : insideCallback();
}

function isOutside() {
  return process.env.SERVER_ENV === "outside";
}

module.exports = {
  getPublishPath,
  getOutlinePath,
  getDayPath,
  hasOutside,
  findPackageFile,
  whereEnvironment,
  isOutside
};
