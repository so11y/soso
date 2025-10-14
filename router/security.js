const { logger } = require("../helper/log");

module.exports = {
  installSecurityRouter(app) {
    app.post("/-/npm/v1/security/audits/quick", (req, res) => {
      logger.info("/-/npm/v1/security/audits/quick");
      res.json({
        actions: [],
        advisories: {},
        muted: [],
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 0,
            critical: 0
          },
          dependencies: 0,
          devDependencies: 0,
          optionalDependencies: 0,
          totalDependencies: 0
        }
      });
    });
    app.get("/-/npm/v1/security/advisories/bulk", (req, res) => {
      logger.info("/-/npm/v1/security/advisories/bulk");
      res.json({});
    });
    app.post("/-/npm/v1/security/advisories/bulk", (req, res) => {
      logger.info("/-/npm/v1/security/advisories/bulk");
      res.json({});
    });
    app.post("/-/npm/v1/security/audits/bulk", (req, res) => {
      logger.info("/-/npm/v1/security/audits/bulk");
      res.json({});
    });
  }
};
