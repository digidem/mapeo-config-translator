const chai = require("chai");
const fs = require("fs");
const path = require("path");
const { main } = require("../src/index.js");
const presetExample = require("./presetExample.js");

const expect = chai.expect;

describe("CSV to JSON translation", function () {
  this.timeout(5000); // Increase timeout to 5000ms
  it("should translate CSV data to JSON files", async function (done) {
    const randomFolder = Math.random().toString(36).substring(2, 15);
    // Mock JSON folder path
    const jsonFolderPath = `/tmp/mct-${randomFolder}/`;
    if (!fs.existsSync(jsonFolderPath)) {
      fs.mkdirSync(jsonFolderPath);
    }

    // Mock CSV file path
    const csvFilePath = path.join(jsonFolderPath, "mock.csv");

    // Write mock CSV data to the file
    fs.writeFileSync(csvFilePath, "Português,English\nOlá,Hello\nMundo,World");
    fs.writeFileSync(
      jsonFolderPath + "Olá.json",
      JSON.stringify(presetExample, null, 2),
    );
    fs.writeFileSync(
      jsonFolderPath + "Mundo.json",
      JSON.stringify(presetExample, null, 2),
    );
    console.log("Starting test with mocked CSV file", csvFilePath);
    console.log("and JSON path", jsonFolderPath);

    // Call the main function with the mock CSV file path and JSON folder path
    try {
      await main(csvFilePath, jsonFolderPath);
      // After a delay, check if the JSON files have been created
      const allFiles = await fs.promises.readdir(jsonFolderPath);
      console.log("FILES", allFiles);
      const jsonFiles = allFiles.filter(
        (file) => path.extname(file) === ".json",
      );
      expect(jsonFiles).to.include.members(["Olá.json", "Mundo.json"]);

      // Check if the JSON files contain the correct data
      const olaJson = JSON.parse(
        await fs.promises.readFile(
          path.join(jsonFolderPath, "Olá.json"),
          "utf-8",
        ),
      );
      expect(olaJson.name).to.equal("Hello");

      const mundoJson = JSON.parse(
        await fs.promises.readFile(
          path.join(jsonFolderPath, "Mundo.json"),
          "utf-8",
        ),
      );
      expect(mundoJson.name).to.equal("World");

      done();
    } catch (err) {
      done(err);
    }
  });
});
