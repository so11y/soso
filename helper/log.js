const chalk = require("chalk");

const logger = {
  info(message) {
    console.log(chalk.blue(`[INFO] ${message}`));
  },
  warn(message) {
    console.log(chalk.yellow(`[WARN] ${message}`));
  },
  error(message) {
    console.log(chalk.red(`[ERROR] ${message}`));
  },
  success(message) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  },
  log(message) {
    console.log(message);
  },
  packageName(message) {
    this.info(`package-name: ${message}`);
  },
  internalError(message) {
    this.error(`Internal Error: ${message}`);
  },
};

module.exports = {
  logger,
  createLog(req, res, next) {
    // logger.info(`Request started: ${req.method} ${req.url}`);
    req.logger = logger;
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const statusColor = res.statusCode >= 400 ? "error" : "success";
      logger[statusColor](
        `Request finished: ${req.method} ${req.url} - ${res.statusCode} [${duration}ms]`
      );
    });
    next();
  },
};
