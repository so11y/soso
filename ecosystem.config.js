module.exports = {
  apps: [
    {
      name: "npm-registry",
      script: "./index.js",
      instances: 4,
      exec_mode: "cluster",
      out_file: "/dev/null",
      error_file: "/dev/null",
      log_file: "/dev/null",
      env_outside: {
        SERVER_ENV: "outside"
      },
      env_inside: {
        SERVER_ENV: "inside"
      }
    }
  ]
};
