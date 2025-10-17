async function getPackageInfo(req, res) {
  const { packageName } = req.params;
  const { manager, logger } = req;
  logger.packageName(packageName);
  try {
    const info = await manager.getInfo(packageName);
    res.send(info);
  } catch (error) {
    res.status(404).send("Package not found");
  }
}

module.exports = {
  installPackInfoRouter(app) {
    app.get("/:packageName(*)", getPackageInfo);
  }
};
