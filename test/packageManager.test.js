const assert = require("node:assert/strict");
const fs = require("fs-extra");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const { once } = require("node:events");
const { afterEach, beforeEach, test } = require("node:test");

const PackageManager = require("../packetManager");
const setup = require("../setup");
const { requireImpl } = require("../helper/request");
const { mergePackageInfo } = require("../helper/packageInfo");
const { installPackInfoRouter } = require("../router/getPackageInfo");
const { installTgzRouter } = require("../router/getPackageTgz");

const originalCwd = process.cwd();
const originalEnv = {
  INSIDE_SERVER_IP: process.env.INSIDE_SERVER_IP,
  SERVER_ENV: process.env.SERVER_ENV,
  SERVER_IP: process.env.SERVER_IP
};
const originalRequestGet = requireImpl.get;

let testDirectory;

beforeEach(() => {
  testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "soso-"));
  process.chdir(testDirectory);
  process.env.SERVER_ENV = "inside";
  process.env.SERVER_IP = "http://inside.registry";
  process.env.INSIDE_SERVER_IP = "http://inside.registry";
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.removeSync(testDirectory);
  requireImpl.get = originalRequestGet;

  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

function createPackageData(name, version, tarballContents = version) {
  return {
    name,
    "dist-tags": { latest: version },
    versions: {
      [version]: {
        name,
        version,
        dist: { tarball: `https://registry.example/${name}-${version}.tgz` }
      }
    },
    _attachments: {
      [`${name}-${version}.tgz`]: {
        data: Buffer.from(tarballContents).toString("base64")
      }
    }
  };
}

function writePackageInfo(source, name, version) {
  fs.outputJsonSync(
    path.join("pack", source, name, "package.json"),
    createPackageInfo(name, version)
  );
}

function createPackageInfo(name, version) {
  return {
    name,
    version,
    "dist-tags": { latest: version },
    versions: {
      [version]: {
        name,
        version,
        dist: { tarball: "https://registry.example/package.tgz" }
      }
    }
  };
}

test("local publish writes only to the real publish directory", async () => {
  const manager = new PackageManager();

  await manager.publish(
    "example-package",
    createPackageData("example-package", "1.0.0")
  );
  await manager.publish(
    "example-package",
    createPackageData("example-package", "1.1.0")
  );

  const publishDirectory = path.join("pack", "publish", "example-package");
  const packageInfo = fs.readJsonSync(
    path.join(publishDirectory, "package.json")
  );

  assert.equal(fs.lstatSync(publishDirectory).isSymbolicLink(), false);
  assert.deepEqual(Object.keys(packageInfo.versions), ["1.0.0", "1.1.0"]);
  assert.equal(
    fs.readFileSync(path.join(publishDirectory, "1.1.0.tgz"), "utf8"),
    "1.1.0"
  );
  assert.equal(
    fs.existsSync(path.join("pack", "outline", "example-package")),
    false
  );
});

test("setup creates real publish and outline directories", () => {
  setup();

  for (const source of ["publish", "outline"]) {
    const sourceDirectory = path.join("pack", source);
    assert.equal(fs.statSync(sourceDirectory).isDirectory(), true);
    assert.equal(fs.lstatSync(sourceDirectory).isSymbolicLink(), false);
  }
});

test("outline metadata wins when both sources contain the same version", () => {
  const publishedInfo = createPackageInfo("shared-package", "1.0.0");
  const outlineInfo = createPackageInfo("shared-package", "1.0.0");
  publishedInfo.versions["1.0.0"].source = "publish";
  outlineInfo.versions["1.0.0"].source = "outline";

  const packageInfo = mergePackageInfo(publishedInfo, outlineInfo);

  assert.equal(packageInfo.versions["1.0.0"].source, "outline");
  assert.equal(packageInfo["dist-tags"].latest, "1.0.0");
});

test("newer published metadata wins over an older outline cache", () => {
  const publishedInfo = createPackageInfo("@xnj/ui", "3.1.1");
  const outlineInfo = createPackageInfo("@xnj/ui", "3.0.5");

  const packageInfo = mergePackageInfo(publishedInfo, outlineInfo);

  assert.equal(packageInfo.version, "3.1.1");
  assert.equal(packageInfo["dist-tags"].latest, "3.1.1");
  assert.deepEqual(Object.keys(packageInfo.versions), ["3.1.1", "3.0.5"]);
});

test("exact versions retain their complete metadata independently of latest", () => {
  const publishedInfo = createPackageInfo("vue", "3.5.19");
  publishedInfo.versions["3.5.19"].peerDependencies = { stale: "1.0.0" };
  const outlineInfo = createPackageInfo("vue", "3.5.43");
  const exact = createPackageInfo("vue", "3.5.19").versions["3.5.19"];
  exact.dependencies = { "@vue/shared": "3.5.19" };
  exact.dist.integrity = "sha512-exact-artifact";
  outlineInfo.versions["3.5.19"] = exact;

  for (const published of [null, publishedInfo]) {
    const packageInfo = mergePackageInfo(published, outlineInfo);
    assert.equal(packageInfo["dist-tags"].latest, "3.5.43");
    assert.deepEqual(packageInfo.versions["3.5.19"], exact);
    assert.equal(packageInfo.versions["3.5.19"].version, "3.5.19");
    assert.equal(packageInfo.versions["3.5.43"].version, "3.5.43");
    assert.equal(packageInfo.versions["3.5.19"].peerDependencies, undefined);
  }
});

test("package metadata merges versions and tarballs prefer outline", async () => {
  const manager = new PackageManager();
  writePackageInfo("publish", "shared-package", "1.0.0-internal");
  writePackageInfo("outline", "shared-package", "1.0.0");
  fs.outputFileSync(
    path.join("pack", "publish", "shared-package", "1.0.0-internal.tgz"),
    "internal"
  );
  fs.outputFileSync(
    path.join("pack", "publish", "shared-package", "1.0.0.tgz"),
    "internal collision"
  );
  fs.outputFileSync(
    path.join("pack", "outline", "shared-package", "1.0.0.tgz"),
    "outside"
  );

  const packageInfo = JSON.parse(await manager.getInfo("shared-package"));
  const outlineTarballPath = await manager.getTgz("shared-package", "1.0.0");
  const publishedTarballPath = await manager.getTgz(
    "shared-package",
    "1.0.0-internal"
  );

  assert.equal(packageInfo.version, "1.0.0");
  assert.equal(packageInfo["dist-tags"].latest, "1.0.0");
  assert.deepEqual(Object.keys(packageInfo.versions), [
    "1.0.0-internal",
    "1.0.0"
  ]);
  assert.equal(
    packageInfo.versions["1.0.0-internal"].dist.tarball,
    "http://inside.registry/package/shared-package/1.0.0-internal"
  );
  assert.equal(
    outlineTarballPath,
    path.join(
      testDirectory,
      "pack",
      "outline",
      "shared-package",
      "1.0.0.tgz"
    )
  );
  assert.equal(
    publishedTarballPath,
    path.join(
      testDirectory,
      "pack",
      "publish",
      "shared-package",
      "1.0.0-internal.tgz"
    )
  );
});

test("package reads fall back to outline when publish is absent", async () => {
  const manager = new PackageManager();
  writePackageInfo("outline", "outside-package", "2.0.0");
  fs.outputFileSync(
    path.join("pack", "outline", "outside-package", "2.0.0.tgz"),
    "outside"
  );

  const packageInfo = JSON.parse(await manager.getInfo("outside-package"));
  const tarballPath = await manager.getTgz("outside-package", "2.0.0");

  assert.equal(packageInfo.version, "2.0.0");
  assert.equal(
    tarballPath,
    path.join(
      testDirectory,
      "pack",
      "outline",
      "outside-package",
      "2.0.0.tgz"
    )
  );
});

test("outside mode falls back to publish when the remote package is missing", async () => {
  const manager = new PackageManager();
  process.env.SERVER_ENV = "outside";
  process.env.SERVER_IP = "http://outside.registry";
  writePackageInfo("publish", "published-package", "3.0.0-internal");
  requireImpl.get = async () => {
    throw new Error("Package not found");
  };

  const packageInfo = JSON.parse(await manager.getInfo("published-package"));

  assert.equal(packageInfo.version, "3.0.0-internal");
  assert.equal(
    packageInfo.versions["3.0.0-internal"].dist.tarball,
    "http://outside.registry/package/published-package/3.0.0-internal"
  );
});

test("outside mode falls back to a cached scoped package when upstream returns 404", async () => {
  const manager = new PackageManager();
  process.env.SERVER_ENV = "outside";
  process.env.SERVER_IP = "http://outside.registry";
  writePackageInfo("outline", "@fulate/core", "1.0.14");
  requireImpl.get = async () => {
    const error = new Error("Package not found");
    error.response = { status: 404 };
    throw error;
  };

  const packageInfo = JSON.parse(await manager.getInfo("@fulate/core"));

  assert.equal(packageInfo.name, "@fulate/core");
  assert.equal(packageInfo.version, "1.0.14");
  assert.equal(
    packageInfo.versions["1.0.14"].dist.tarball,
    "http://outside.registry/package/@fulate/core/1.0.14"
  );
});

test("upstream 404 retains both cached and published versions, then a successful refresh wins", async () => {
  const manager = new PackageManager();
  process.env.SERVER_ENV = "outside";
  writePackageInfo("outline", "@fulate/core", "1.0.14");
  writePackageInfo("publish", "@fulate/core", "1.0.15");
  requireImpl.get = async () => {
    throw Object.assign(new Error("upstream missing"), { response: { status: 404 } });
  };
  const file = path.join("pack", "outline", "@fulate/core", "package.json");
  const cached = fs.readFileSync(file, "utf8");
  const offline = JSON.parse(await manager.getInfo("@fulate/core"));
  assert.deepEqual(Object.keys(offline.versions), ["1.0.15", "1.0.14"]);
  assert.equal(offline["dist-tags"].latest, "1.0.15");
  assert.equal(fs.readFileSync(file, "utf8"), cached);

  requireImpl.get = async () => ({ data: createPackageInfo("@fulate/core", "1.0.16") });
  const refreshed = JSON.parse(await manager.getInfo("@fulate/core"));
  assert.deepEqual(Object.keys(refreshed.versions), ["1.0.15", "1.0.16"]);
  assert.equal(refreshed["dist-tags"].latest, "1.0.16");
  assert.equal(fs.readJsonSync(file)["dist-tags"].latest, "1.0.16");
});

test("metadata HTTP serves a cached scoped package and its exact tarball", async () => {
  const manager = new PackageManager();
  const app = express();
  const logger = { packageName() {} };
  app.use((req, _res, next) => { req.manager = manager; req.logger = logger; next(); });
  installTgzRouter(app);
  installPackInfoRouter(app);
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    process.env.SERVER_IP = base;
    process.env.SERVER_ENV = "outside";
    writePackageInfo("outline", "@fulate/core", "1.0.14");
    fs.outputFileSync(path.join("pack", "outline", "@fulate/core", "1.0.14.tgz"), "fixture artifact");
    requireImpl.get = async () => { throw Object.assign(new Error("upstream missing"), { response: { status: 404 } }); };
    for (const encoded of ["@fulate%2fcore", "@fulate%2Fcore", "@fulate/core"]) {
      const response = await fetch(`${base}/${encoded}`);
      assert.equal(response.status, 200);
      const info = await response.json();
      const artifact = await fetch(info.versions["1.0.14"].dist.tarball);
      assert.equal(artifact.status, 200);
      assert.equal(await artifact.text(), "fixture artifact");
    }

  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("outside mode serves local publications when the upstream name was unpublished", async () => {
  const manager = new PackageManager();
  process.env.SERVER_ENV = "outside";
  process.env.SERVER_IP = "http://outside.registry";
  requireImpl.get = async () => ({
    data: {
      name: "previously-unpublished",
      time: { unpublished: { time: "2015-11-19T04:36:12.791Z", versions: ["0.0.0"] } },
      _attachments: {}
    }
  });

  await assert.rejects(manager.getInfo("previously-unpublished"));
  for (const version of ["1.0.0", "1.1.0"]) {
    await manager.publish(
      "previously-unpublished",
      createPackageData("previously-unpublished", version)
    );
    const info = JSON.parse(await manager.getInfo("previously-unpublished"));
    assert.equal(info["dist-tags"].latest, version);
    assert.equal(
      info.versions[version].dist.tarball,
      `http://outside.registry/package/previously-unpublished/${version}`
    );
  }
  assert.equal(fs.existsSync(path.join("pack", "outline", "previously-unpublished", "package.json")), false);
});

test("outside mode caches only outline and merges published versions in the response", async () => {
  const manager = new PackageManager();
  process.env.SERVER_ENV = "outside";
  process.env.SERVER_IP = "http://outside.registry";
  writePackageInfo("publish", "mixed-package", "4.0.0-internal");
  writePackageInfo("outline", "mixed-package", "3.0.0");
  requireImpl.get = async () => ({
    data: createPackageInfo("mixed-package", "4.0.0")
  });

  const packageInfo = JSON.parse(await manager.getInfo("mixed-package"));
  const publishedInfo = fs.readJsonSync(
    path.join("pack", "publish", "mixed-package", "package.json")
  );
  const outlineInfo = fs.readJsonSync(
    path.join("pack", "outline", "mixed-package", "package.json")
  );

  assert.equal(packageInfo.version, "4.0.0");
  assert.deepEqual(Object.keys(packageInfo.versions), [
    "4.0.0-internal",
    "4.0.0"
  ]);
  assert.deepEqual(Object.keys(publishedInfo.versions), ["4.0.0-internal"]);
  assert.deepEqual(Object.keys(outlineInfo.versions), ["4.0.0"]);
});

test("publishing a cached package keeps publish and outline independent", async () => {
  const manager = new PackageManager();
  writePackageInfo("outline", "cached-package", "1.0.0");
  fs.outputFileSync(
    path.join("pack", "outline", "cached-package", "1.0.0.tgz"),
    "outside"
  );

  await manager.publish(
    "cached-package",
    createPackageData("cached-package", "1.1.0", "internal")
  );
  writePackageInfo("outline", "cached-package", "2.0.0");
  fs.outputFileSync(
    path.join("pack", "outline", "cached-package", "2.0.0.tgz"),
    "updated outside"
  );

  const publishDirectory = path.join("pack", "publish", "cached-package");
  const publishedInfo = fs.readJsonSync(
    path.join(publishDirectory, "package.json")
  );
  const outlineInfo = fs.readJsonSync(
    path.join("pack", "outline", "cached-package", "package.json")
  );
  const resolvedInfo = JSON.parse(await manager.getInfo("cached-package"));

  assert.equal(fs.lstatSync(publishDirectory).isSymbolicLink(), false);
  assert.deepEqual(Object.keys(publishedInfo.versions), ["1.1.0"]);
  assert.deepEqual(Object.keys(outlineInfo.versions), ["2.0.0"]);
  assert.equal(resolvedInfo.version, "2.0.0");
  assert.deepEqual(Object.keys(resolvedInfo.versions), ["1.1.0", "2.0.0"]);
  assert.equal(
    fs.readFileSync(path.join(publishDirectory, "1.1.0.tgz"), "utf8"),
    "internal"
  );
  assert.equal(
    fs.existsSync(
      path.join("pack", "outline", "cached-package", "1.1.0.tgz")
    ),
    false
  );
});
