const chai = require("chai");
const fs = require("fs");
const path = require("path");
const { main } = require("../src/index.js");
const presetExample = require("./presetExample.js");
function checkJsonNames(languageFolders) {
  let pass = true;
  languageFolders.forEach((folder) => {
    const presetsPath = path.join(folder, "presets");
    const fieldsPath = path.join(folder, "fields");
    const files = fs.readdirSync(presetsPath);
    files.forEach((file) => {
      const filePath = path.join(presetsPath, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (jsonData.name !== "Lorem ipsum") pass = false;
    });
    if (!fs.existsSync(path.join(fieldsPath, "field.json"))) pass = false;
  });
  return pass;
}
async function createRandomFolder() {
  const randomFolder = Math.random().toString(36).substring(2, 15);
  const configFolder = `/tmp/mct-${randomFolder}`;
  const originalConfigPath = path.join(configFolder, "presets");
  const fieldsPath = path.join(configFolder, "fields");
  fs.mkdirSync(originalConfigPath, { recursive: true });
  fs.mkdirSync(fieldsPath, { recursive: true });
  fs.writeFileSync(
    path.join(originalConfigPath, "plant.json"),
    JSON.stringify(presetExample, null, 2),
  );
  fs.writeFileSync(
    path.join(fieldsPath, "field.json"),
    JSON.stringify({}, null, 2),
  );
  return configFolder;
}
const expect = chai.expect;

describe("Google Sheet to JSON translation", function () {
  const languageFolders = ["Language 2", "Language 3", "Language 4"];
  this.timeout(35000); // Increase timeout to 15000ms
  it("should translate Google Sheet data to JSON files", async function () {
    const googleSheetID = "1S7mdKPfT_3AaWS9mxn1qy5mj1aszuRNuncC7GlDSz_8";
    const configFolder = await createRandomFolder();
    console.log("Starting test with Google Sheet with ID", googleSheetID);
    console.log("and config path", configFolder);
    await main(googleSheetID, configFolder);
    const fullFolders = languageFolders.map((i) =>
      path.join(configFolder, "translations", i),
    );
    expect(checkJsonNames(fullFolders)).to.be.true;
  });

  it("should translate Google Sheet data to JSON files using URL", async function () {
    const googleSheetURL =
      "https://docs.google.com/spreadsheets/d/1S7mdKPfT_3AaWS9mxn1qy5mj1aszuRNuncC7GlDSz_8/edit#gid=0";
    const configFolder = await createRandomFolder();
    console.log("Starting test with Google Sheet with URL", googleSheetURL);
    console.log("and JSON path", configFolder);
    await main(googleSheetURL, configFolder);
    const fullFolders = languageFolders.map((i) =>
      path.join(configFolder, "translations", i),
    );
    expect(checkJsonNames(fullFolders)).to.be.true;
  });
});
