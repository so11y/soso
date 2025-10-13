const path = require("path");
const fs = require("fs-extra");
const dayjs = require("dayjs");
const { OUTLINE_DIR, LOCAL_DIR, PACK_DIR, PUBLISH_DIR } = require("./const");

function getOutlinePath(_path = "") {
  return path.join(process.cwd(), PACK_DIR, OUTLINE_DIR, _path);
}
function getLocalPath(_path = "") {
  return path.join(process.cwd(), PACK_DIR, LOCAL_DIR, _path);
}
function getDayPath(_path = "") {
  return path.join(
    process.cwd(),
    PACK_DIR,
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

function getTgzPath(packageName, version) {
  const packageNowPath = path.join(packageName, `${version}.tgz`);
  const maybeHaveInsidePackagePath = getLocalPath(packageNowPath);
  const maybeHaveOutsidePackagePath = getOutlinePath(packageNowPath);
  const hasExist = [
    maybeHaveOutsidePackagePath,
    maybeHaveInsidePackagePath
  ].find(fs.existsSync);
  return [hasExist, maybeHaveOutsidePackagePath, maybeHaveInsidePackagePath];
}

function whereEnvironment(outsideCallback, insideCallback) {
  return isOutside() ? outsideCallback() : insideCallback();
}

function isOutside() {
  return process.env.SERVER_ENV === "outside";
}

function getPublishPath(_path = "") {
  return path.join(process.cwd(), PACK_DIR, PUBLISH_DIR, _path);
}

module.exports = {
  getPublishPath,
  getOutlinePath,
  getLocalPath,
  getDayPath,
  hasOutside,
  getTgzPath,
  whereEnvironment,
  isOutside
};
