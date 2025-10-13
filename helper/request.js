const axios = require("axios");

const TIMEOUT = 8000;
const requireImpl = axios.create({
  // baseURL: "https://registry.npmjs.org/",
  baseURL: "https://registry.npmmirror.com/",
  timeout: TIMEOUT,
});

function getTgz(tarballUrl) {
  return requireImpl({
    url: tarballUrl,
    method: "GET",
    responseType: "stream",
    timeout: TIMEOUT,
  });
}

module.exports.requireImpl = requireImpl;
module.exports.getTgz = getTgz;
