const express = require("express");
const setup = require("./setup");
const { installPackInfoRouter } = require("./router/getPackageInfo");
const { installTgzRouter } = require("./router/getPackageTgz");
const { installPublishRouter } = require("./router/publishPackage");
const { installLoginRouter } = require("./router/login");
const { createLog } = require("./helper/log");
const packageManager = require("./packetManager");

const app = express();

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

app
  .use(installLoginRouter)
  .use(installPackInfoRouter)
  .use(installTgzRouter)
  .use(installPublishRouter)
  .use(createLog)
  .listen(process.env.SERVER_PORT, setup());
