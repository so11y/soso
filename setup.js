const fs = require("fs-extra");
const dotenv = require("dotenv");
const { logger } = require("./helper/log");
const {
  getDayPath,
  getOutlinePath,
  getPublishPath,
  isOutside
} = require("./helper/share");

function setup() {
  const env = process.env.SERVER_ENV || "outside";
  dotenv.config({ path: `.env.${env}` });
  fs.ensureDirSync(getOutlinePath());
  fs.ensureDirSync(getPublishPath());
  if (isOutside()) {
    fs.ensureDirSync(getDayPath());
  }

  return () => {
    logger.info(`Server is running on ${env} environment`);
    logger.info(`Server host: http://localhost:${process.env.SERVER_PORT}`);
  };
}

module.exports = setup;
