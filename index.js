const express = require("express");
const setup = require("./setup");
const getPackageInfo = require("./router/getPackageInfo");
const packageManager = require("./packetManager");

const app = express();

const manager = new packageManager();

app.use(express.json());

app.use((req, res, next) => {
  req.manager = manager;
  next();
});

app.get("/:packageName", getPackageInfo);

app.listen(4873, () => {
  setup();
  console.log("Server is running on port 4873");
});
