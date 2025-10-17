const fg = require("fast-glob");
const path = require("path");

/**
 * 从指定路径查找所有包含package.json的目录
 * @param {string} targetPath - 要搜索的目标路径
 * @returns {Promise<Array>} 包含package.json的目录路径数组
 */
async function findPackageJsonDirs(targetPath) {
  try {
    // 构建glob模式，查找所有package.json文件
    const pattern = path
      .join(targetPath, "**/package.json")
      .replace(/\\/g, "/");

    console.log(`正在搜索路径: ${targetPath}`);
    console.log(`使用模式: ${pattern}`);

    // 查找所有package.json文件
    const packageJsonFiles = await fg(pattern, {
      absolute: true, // 返回绝对路径
      onlyFiles: true, // 只返回文件
      ignore: ["**/node_modules/**"], // 忽略 node_modules
      dot: true, // 包含以点开头的文件
      deep: 10
    });

    console.log(`找到 ${packageJsonFiles.length} 个package.json文件`);

    // 提取包含package.json的目录路径
    const dirs = packageJsonFiles.map((filePath) => {
      const dir = path.dirname(filePath);
      // 返回相对于目标路径的相对路径
      const relativePath = path.relative(targetPath, dir);
      return relativePath || "."; // 如果是根目录本身，返回'.'
    });

    return dirs;
  } catch (error) {
    console.error("查找package.json时出错:", error);
    return [];
  }
}

/**
 * 调用接口检查包是否存在
 * @param {string} packageName - 包名称（目录路径）
 * @returns {Promise<Object>} 接口返回结果
 */
async function checkPackage(packageName) {
  const url = `http://localhost:4873/${packageName.replace(/\\/g, "/")}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        packageName,
        exists: true,
        data: data
      };
    } else {
      return {
        packageName,
        exists: false,
        status: response.status,
        statusText: response.statusText
      };
    }
  } catch (error) {
    return {
      packageName,
      exists: false,
      error: error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(10);
  // 从命令行参数获取路径，如果没有则使用当前目录
  const targetPath = process.argv[2] || "pack/outline";

  console.log("开始查找包含 package.json 的目录...");

  // 查找所有包含 package.json 的目录
  const packageDirs = await findPackageJsonDirs(targetPath);

  if (packageDirs.length === 0) {
    console.log("没有找到包含 package.json 的目录");
    return;
  }

  console.log("\n找到的目录:", packageDirs.length);

  try {
    // 使用 Promise.allSettled 调用所有接口
    const results = await Promise.allSettled(
      packageDirs.map((dir) => limit(() => checkPackage(dir)))
    );

    console.log("\n接口调用结果:");

    const successfulResults = [];
    const failedResults = [];

    results.forEach((result, index) => {
      const packageName = packageDirs[index];

      if (result.status === "fulfilled") {
        const data = result.value;
        if (data.exists) {
          console.log(`✅ ${packageName}: 存在`);
          successfulResults.push(data);
        } else {
          console.log(
            `❌ ${packageName}: 不存在 (${data.status || data.error})`
          );
          failedResults.push(data);
        }
      } else {
        console.log(`❌ ${packageName}: 调用失败 - ${result.reason}`);
        failedResults.push({
          packageName,
          error: result.reason
        });
      }
    });

    console.log(`\n统计:`);
    console.log(`成功: ${successfulResults.length}`);
    console.log(`失败: ${failedResults.length}`);
    console.log(`总计: ${results.length}`);
  } catch (error) {
    console.error("调用接口时发生错误:", error);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findPackageJsonDirs,
  checkPackage
};
