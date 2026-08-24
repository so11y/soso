function mergePackageInfo(publishedInfo, outlineInfo) {
  if (!publishedInfo) {
    return outlineInfo;
  }
  if (!outlineInfo) {
    return publishedInfo;
  }

  return {
    ...publishedInfo,
    ...outlineInfo,
    "dist-tags": {
      ...publishedInfo["dist-tags"],
      ...outlineInfo["dist-tags"]
    },
    versions: {
      ...publishedInfo.versions,
      ...outlineInfo.versions
    }
  };
}

module.exports = { mergePackageInfo };
