const fs = require("fs");
const path = require("path");
const { main } = require("../index.js");
const presetExample = require("./presetExample.js");

function checkJsonNames(languageFolders) {
  languageFolders.forEach((folder) => {
    const files = fs.readdirSync(folder);
    files.forEach((file) => {
      const filePath = path.join(folder, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (jsonData.name === "Lorem ipsum") console.log("Pass", folder);
      else console.log("FAIL!!", folder);
    });
  });
}

async function run() {
  const googleSheetID = "1S7mdKPfT_3AaWS9mxn1qy5mj1aszuRNuncC7GlDSz_8";
  const randomFolder = Math.random().toString(36).substring(2, 15);
  const jsonPath = `/tmp/mct-${randomFolder}/`;
  if (!fs.existsSync(jsonPath)) {
    fs.mkdirSync(jsonPath);
  }

  fs.writeFileSync(
    jsonPath + "plant.json",
    JSON.stringify(presetExample, null, 2),
  );
  console.log("Starting test with Google Sheet with ID", googleSheetID);
  console.log("and JSON path", jsonPath);
  main(googleSheetID, jsonPath);

  // Wait for 5 seconds
  await new Promise((resolve) =>
    setTimeout(() => {
      const languageFolders = ["Language 2", "Language 3", "Language 4"];
      const fullFolders = languageFolders.map((i) => path.join(jsonPath, i));
      resolve(checkJsonNames(fullFolders));
    }, 5000),
  );
}

run();
