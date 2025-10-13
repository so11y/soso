const { logger } = require("../helper/log");

async function publishPackage(req, res) {
  const { packageName } = req.params;
  const { manager } = req;
  console.log("x-x-");

  try {
    const packageData = req.body;

    if (!packageData || !packageData.name || !packageData["dist-tags"]) {
      return res.status(400).send("Invalid package data");
    }

    const result = await manager.publish(packageName, packageData);
    res.send(result.message);
  } catch (error) {
    logger.error(`Publish error: ${error.message}`);
    res.status(500).send(`Publish failed: ${error.message}`);
  }
}

async function getPublishedPackage(req, res) {
  const { packageName } = req.params;
  const { manager } = req;

  try {
    const packageInfo = await manager.getPublishedInfo(packageName);
    res.json(packageInfo);
  } catch (error) {
    res.status(404).send("Published package not found");
  }
}

async function listPublishedPackages(req, res) {
  const { manager } = req;

  try {
    const packages = await manager.listPublished();
    res.json(packages);
  } catch (error) {
    res.status(500).send("Failed to list published packages");
  }
}

module.exports = {
  installPublishRouter(app) {
    app.put("/:packageName", publishPackage);

    app.get("/publish/:packageName", getPublishedPackage);

    app.get("/publish", listPublishedPackages);
  }
};
