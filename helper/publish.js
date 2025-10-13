const path = require("path");
const fs = require("fs-extra");

function cratePerVersionJson(packageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  }
  return {};
}

module.exports = {
  cratePerVersionJson
};
