const semver = require("semver");

function mergePackageInfo(publishedInfo, outlineInfo) {
  if (!publishedInfo) {
    return outlineInfo;
  }
  if (!outlineInfo) {
    return publishedInfo;
  }

  const [baseInfo, latestInfo] = semver.gt(
    publishedInfo["dist-tags"].latest,
    outlineInfo["dist-tags"].latest
  )
    ? [outlineInfo, publishedInfo]
    : [publishedInfo, outlineInfo];

  return {
    ...baseInfo,
    ...latestInfo,
    "dist-tags": {
      ...baseInfo["dist-tags"],
      ...latestInfo["dist-tags"]
    },
    versions: {
      ...publishedInfo.versions,
      ...outlineInfo.versions
    }
  };
}

module.exports = { mergePackageInfo };
