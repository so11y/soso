async function getTgz(packageName, version, req, res, updatePackage = false) {
  const { manager, logger } = req;
  logger.packageName(`${packageName}/${version}.tgz`);
  try {
    const path = await manager.getTgz(packageName, version, updatePackage);
    res.sendFile(path);
  } catch (error) {
    res.status(404).send("Package not found");
  }
}
function getByTgz(packageName, fileNameAndVersion, req, res, next) {
  if (!req.url.endsWith(".tgz")) {
    return next("route");
  }

  const versionMatch = fileNameAndVersion.match(
    /-(\d+\.\d+\.\d+(?:-(?:[0-9a-zA-Z-]+)(?:\.[0-9a-zA-Z-]+)*)?)\.tgz$/
  );
  if (versionMatch) {
    getTgz(packageName, versionMatch[1], req, res, true);
  } else {
    res.status(500).send("invalid tgz path");
  }
}

function getPackageTgz(req, res) {
  const { packageName, version } = req.params;
  getTgz(packageName, version, req, res);
}
async function getScopePackageTgz(req, res) {
  const { scope, packageName, version } = req.params;
  getTgz(`${scope}/${packageName}`, version, req, res);
}

async function getByTgzPathToTgz(req, res, next) {
  const { packageName, fileName } = req.params;
  getByTgz(packageName, fileName, req, res, next);
}

async function getScopedByTgzPathToTgz(req, res, next) {
  const { packageName, fileName, scope } = req.params;
  getByTgz(`${scope}/${packageName}`, fileName, req, res, next);
}

module.exports = {
  installTgzRouter(app) {
    //结尾需要是tgz
    app.get("/:packageName/-/:fileName", getByTgzPathToTgz);

    app.get("/:scope/:packageName/-/:fileName", getScopedByTgzPathToTgz);

    app.get("/package/:packageName/:version", getPackageTgz);

    app.get("/package/:scope/:packageName/:version", getScopePackageTgz);
  }
};
