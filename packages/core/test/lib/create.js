const assert = require("chai").assert;
const path = require("path");
const fse = require("fs-extra");
const Create = require("../../lib/commands/create/helpers");
const tmp = require("tmp");
const Config = require("@truffle/config");
const copy = require("../../lib/copy");
const glob = require("glob");
let config;
let tempDir;

describe("create", function () {
  before("create a sandbox", async function () {
    this.timeout(5000);
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    await copy(path.join(__dirname, "../sources/metacoin"), tempDir.name);
    config = new Config(undefined, tempDir.name);
  });
  after("cleanup tmp files", async function () {
    tempDir.removeCallback();
  });

  it("creates a new contract", async function () {
    await Create.contract(config.contracts_directory, "MyNewContract", {});

    const expectedFile = path.join(
      config.contracts_directory,
      "MyNewContract.sol"
    );
    assert.isTrue(
      fse.existsSync(expectedFile),
      `Contract to be created doesns't exist, ${expectedFile}`
    );

    const fileData = fse.readFileSync(expectedFile, { encoding: "utf8" });
    assert.isNotNull(fileData, "File's data is null");
    assert.notEqual(fileData, "", "File's data is blank");
    assert.isTrue(
      fileData.includes("pragma solidity >=0.4.22 <0.9.0;"),
      "File's solidity version does not match >=0.4.22 <0.9.0"
    );
  });

  it("will not overwrite an existing contract (by default)", async function () {
    await Create.contract(config.contracts_directory, "MyNewContract2", {});

    const expectedFile = path.join(
      config.contracts_directory,
      "MyNewContract2.sol"
    );
    assert.isTrue(
      fse.existsSync(expectedFile),
      `Contract to be created doesn't exist, ${expectedFile}`
    );

    try {
      await Create.contract(config.contracts_directory, "MyNewContract2", {});
      assert.fail();
    } catch (error) {
      assert(error.message.includes("file exists"));
    }
  });

  it("will overwrite an existing contract if the force option is enabled", async function () {
    await Create.contract(config.contracts_directory, "MyNewContract3", {});

    const expectedFile = path.join(
      config.contracts_directory,
      "MyNewContract3.sol"
    );
    assert.isTrue(
      fse.existsSync(expectedFile),
      `Contract to be created doesns't exist, ${expectedFile}`
    );

    const options = { force: true };
    await Create.contract(
      config.contracts_directory,
      "MyNewContract3",
      options
    );
  });

  it("creates a new test", async function () {
    await Create.test(config.test_directory, "MyNewTest", {});

    const expectedFile = path.join(config.test_directory, "my_new_test.js");
    assert.isTrue(
      fse.existsSync(expectedFile),
      `Test to be created doesns't exist, ${expectedFile}`
    );

    const fileData = fse.readFileSync(expectedFile, { encoding: "utf8" });
    assert.isNotNull(fileData, "File's data is null");
    assert.notEqual(fileData, "", "File's data is blank");
  });

  it("creates a new migration", async function () {
    await Create.migration(config.migrations_directory, "MyNewMigration", {});
    const files = glob.sync(`${config.migrations_directory}${path.sep}*`);

    const found = false;
    const expectedSuffix = "_my_new_migration.js";

    for (let file of files) {
      if (
        file.indexOf(expectedSuffix) ===
        file.length - expectedSuffix.length
      ) {
        const fileData = fse.readFileSync(file, { encoding: "utf8" });
        assert.isNotNull(fileData, "File's data is null");
        assert.notEqual(fileData, "", "File's data is blank");
        return;
      }
    }

    if (found === false) {
      assert.fail("Could not find a file that matched expected name");
    }
  });
}).timeout(10000);
