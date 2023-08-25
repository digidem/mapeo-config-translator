const fs = require("fs");
// Path module to handle file paths
const path = require("path");
const { log } = require("./utils");

// Function to write the new JSON file
// jsonFile: the JSON file to write
// jsonData: the data to write to the JSON file
// term: the term to translate
// langFolder: the folder to store the translated JSON file
function writeFileToJson(jsonFile, jsonData, term, langFolder) {
  const newJsonFilePath = path.join(langFolder, "presets", jsonFile);
  // Clean the term by removing leading/trailing quotes, spaces, tabs, and dots
  const cleanedTerm = term
    .replace(/^[\" \t\.]+|[\\" \t\.]+$/g, "")
    .replace(/\.$/, "")
    .replace(/\(.*?\)/g, "");

  // Capitalize the first character of the term
  const capitalizedTerm =
    cleanedTerm.charAt(0).toUpperCase() + cleanedTerm.slice(1);
  // Create new JSON data with the translated term
  const newJsonData = { ...jsonData, name: capitalizedTerm };
  // Write the new JSON data to the file
  log("Writing file", newJsonFilePath);
  fs.writeFileSync(newJsonFilePath, JSON.stringify(newJsonData, null, 2));
}

module.exports = writeFileToJson;
