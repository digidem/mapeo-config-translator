const fs = require("fs");
// Path module to handle file paths
const path = require("path");
// String similarity module to compare strings
const stringSimilarity = require("string-similarity");
const writeFileToJson = require("./writeFileToJson");
const { log } = require("./utils");
// Function to compare CSV data and write to JSON
// csvData: the CSV data to compare
async function compareAndWrite(
  csvData,
  translationLanguages,
  configFolder,
  isGoogleSheet,
) {
  const mainLanguage = translationLanguages[0];
  const originalJsonFolderPath = path.join(configFolder, "presets");
  csvData = csvData.map((item) => {
    const cleanedItem = {};
    for (const key in item) {
      cleanedItem[key] = item[key].replace(/\(.*?\)/g, "").trim();
    }
    return cleanedItem;
  });
  log(csvData[3]);
  let csvNames;
  // If the CSV data is from a Google Sheet, map the data to the main language
  // Otherwise, get the keys from the CSV data
  if (isGoogleSheet) {
    csvNames = csvData.map((item) => item[mainLanguage]);
  } else {
    csvNames = Object.keys(csvData);
  }
  // log("csvNames", csvNames);

  const emptyArray = csvNames.every((item) => item === undefined);
  if (!emptyArray) {
    // Get all JSON files in the JSON folder
    const jsonFiles = fs
      .readdirSync(originalJsonFolderPath)
      .filter((file) => file.endsWith(".json"));
    // For each JSON file, compare the name with the CSV data and write the translation to a new JSON file
    for await (const jsonFile of jsonFiles) {
      const originalJsonFilePath = path.join(originalJsonFolderPath, jsonFile);
      const originalJsonData = JSON.parse(
        fs.readFileSync(originalJsonFilePath, "utf-8"),
      );
      const name = originalJsonData.name;
      // Find the best match for the name in the CSV data
      const cleanName = name.replace(/\(.*?\)/g, "");
      const bestMatch = stringSimilarity.findBestMatch(cleanName, csvNames);
      const closestTerm = bestMatch.bestMatch.target;
      // If the match rating is greater than 0.5, write the translation to a new JSON file
      if (bestMatch.bestMatch.rating > 0.5) {
        for await (const lang of translationLanguages) {
          if (lang !== mainLanguage) {
            const langFolder = path.join(configFolder, "translations", lang);
            await fs.mkdirSync(path.join(langFolder, "presets"), {
              recursive: true,
            });
            if (isGoogleSheet) {
              const translation = csvData.filter(
                (d) => d[mainLanguage] === closestTerm,
              );
              // console.log('TRANS', closestTerm, translation)
              if (translation[0] && translation[0][lang]) {
                log(
                  "Translated:",
                  cleanName,
                  "em",
                  lang,
                  ":",
                  translation[0][lang],
                );
                await writeFileToJson(
                  jsonFile,
                  originalJsonData,
                  translation[0][lang],
                  langFolder,
                );
              }
            } else {
              const term = csvData[closestTerm][lang];
              if (term) {
                await writeFileToJson(
                  jsonFile,
                  originalJsonData,
                  term,
                  langFolder,
                );
              }
            }
          }
        }
      }
    }
  }
}

module.exports = compareAndWrite;
