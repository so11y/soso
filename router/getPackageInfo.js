const fs = require("fs-extra");
const requireImpl = require("../request");

async function getPackageInfo(req, res) {
  const { packageName } = req.params;
  const { manager } = req;
  try {
    const packInfo = await manager.writeInfo(packageName);
    res.send(packInfo);
  } catch (error) {
    console.log(error);
    res.status(404).send("Package not found");
  }
}

module.exports = getPackageInfo;