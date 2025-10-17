const express = require("express");
const setup = require("./setup");
const { installPackInfoRouter } = require("./router/getPackageInfo");
const { installTgzRouter } = require("./router/getPackageTgz");
const { installPublishRouter } = require("./router/publishPackage");
const { installLoginRouter } = require("./router/login");
const { installSecurityRouter } = require("./router/security");
const { createLog } = require("./helper/log");
const packageManager = require("./packetManager");

const app = express();
const listener = setup();

const manager = new packageManager();

app.use(
  express.json({
    limit: "50mb"
  })
);

app.use((req, _res, next) => {
  req.manager = manager;
  next();
});
app.use(createLog);

installLoginRouter(app);
installTgzRouter(app);
installPublishRouter(app);
installSecurityRouter(app);
installPackInfoRouter(app);

app.listen(process.env.SERVER_PORT, listener);
