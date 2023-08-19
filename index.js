// Importing required modules
// File system module to handle file operations
const fs = require("fs");
// Path module to handle file paths
const path = require("path");
// String similarity module to compare strings
const stringSimilarity = require("string-similarity");
// CSV parser module to parse CSV files
const csvParser = require("csv-parser");
// Public Google Sheets Parser to parse public Google Sheets
const PublicGoogleSheetsParser = require("public-google-sheets-parser");
// Create isDebug variable set to env
const isDebug = process.env.DEBUG === "true";

// Function to write the new JSON file
// jsonFile: the JSON file to write
// jsonData: the data to write to the JSON file
// term: the term to translate
// langFolder: the folder to store the translated JSON file
function writeFilesToJson(jsonFile, jsonData, term, langFolder) {
  const newJsonFilePath = path.join(langFolder, jsonFile);
  // Clean the term by removing leading/trailing quotes, spaces, tabs, and dots
  const cleanedTerm = term
    .replace(/^[\" \t\.]+|[\\" \t\.]+$/g, "")
    .replace(/\.$/, "");
  // Capitalize the first character of the term
  const capitalizedTerm =
    cleanedTerm.charAt(0).toUpperCase() + cleanedTerm.slice(1);
  // Create new JSON data with the translated term
  const newJsonData = { ...jsonData, name: capitalizedTerm };
  // Write the new JSON data to the file
  fs.writeFileSync(newJsonFilePath, JSON.stringify(newJsonData, null, 2));
}

// Function to compare CSV data and write to JSON
// csvData: the CSV data to compare
function compareAndWrite(
  csvData,
  translationLanguages,
  jsonFolderPath,
  isGoogleSheet,
) {
  const mainLanguage = translationLanguages[0];
  let csvName;
  // If the CSV data is from a Google Sheet, map the data to the main language
  // Otherwise, get the keys from the CSV data
  if (isGoogleSheet) {
    csvName = csvData.map((item) => item[mainLanguage]);
  } else {
    csvName = Object.keys(csvData);
  }
  const emptyArray = csvName.every((item) => item === undefined);
  if (!emptyArray) {
    // Get all JSON files in the JSON folder
    const jsonFiles = fs
      .readdirSync(jsonFolderPath)
      .filter((file) => file.endsWith(".json"));
    // For each JSON file, compare the name with the CSV data and write the translation to a new JSON file
    jsonFiles.forEach((jsonFile) => {
      const jsonFilePath = path.join(jsonFolderPath, jsonFile);
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
      const name = jsonData.name;
      // Find the best match for the name in the CSV data
      const bestMatch = stringSimilarity.findBestMatch(name, csvName);
      const closestTerm = bestMatch.bestMatch.target;
      // If the match rating is greater than 0.5, write the translation to a new JSON file
      if (bestMatch.bestMatch.rating > 0.5) {
        translationLanguages.forEach((lang) => {
          if (lang !== mainLanguage) {
            const langFolder = path.join(jsonFolderPath, lang);
            fs.mkdirSync(langFolder, { recursive: true });
            if (isGoogleSheet) {
              const translation = csvData.filter(
                (d) => d[mainLanguage] === closestTerm,
              )[0][lang];
              if (translation) {
                writeFilesToJson(jsonFile, jsonData, translation, langFolder);
              }
            } else {
              const term = csvData[closestTerm][lang];
              if (term) {
                writeFilesToJson(jsonFile, jsonData, term, langFolder);
              }
            }
          }
        });
      }
    });
  }
}

function main(csvFilePath, jsonFolderPath) {
  isDebug && console.log("csvFilePath", csvFilePath);
  isDebug && console.log("jsonFolderPath", jsonFolderPath);
  // Getting command line arguments
  // jsonFolderPath: path to the JSON folder
  // csvFilePath: path to the CSV file
  // mainLanguage: main language for translation, default is 'Português'
  // Check if the CSV file path is a Google Sheet ID
  const isGoogleSheet = csvFilePath.match(/^[\w-]{44}$/);
  // Checking if the provided paths exist
  // If not, log an error message and exit the process
  isDebug &&
    console.log(
      "DEBUG",
      fs.existsSync(jsonFolderPath),
      fs.existsSync(csvFilePath),
      isGoogleSheet,
    );
  if (
    !fs.existsSync(jsonFolderPath) ||
    (!fs.existsSync(csvFilePath) && !isGoogleSheet)
  ) {
    console.error(
      "Both input and output directories and the CSV file or Google Spreadsheet must exist.",
    );
    process.exit(1);
  }

  // Initializing variables
  // csvData: object to store CSV data
  const csvData = {};
  // translationLanguages: array to store languages for translation
  let translationLanguages;

  // If the CSV data is from a Google Sheet, parse the data and compare and write
  // Otherwise, read the CSV file, parse the data, and compare and write
  if (isGoogleSheet) {
    const parser = new PublicGoogleSheetsParser(csvFilePath);
    parser.parse().then((items) => {
      translationLanguages = [
        ...new Set(items.flatMap((item) => Object.keys(item))),
      ];
      console.log(
        "Translation Languages -> | ",
        translationLanguages.join(" | "),
        " |",
      );
      compareAndWrite(items, translationLanguages, jsonFolderPath, true);
    });
  } else {
    // Reading the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csvParser({ separator: "\t" }))
      .on("data", (row) => {
        // Parsing the row data
        translationLanguages = Object.keys(row)[0].split(",");
        console.log(
          "Translation Languages -> | ",
          translationLanguages.join(" | "),
          " |",
        );
        const translations = Object.values(row);
        mainLanguage = translations[0];
        const term = translations[0].split(",")[0];
        csvData[term] = {};
        translationLanguages.forEach((lang, i) => {
          csvData[term][lang] = translations[0].split(",")[i];
        });
      })
      .on("end", () => {
        // Reading the JSON files
        compareAndWrite(csvData, translationLanguages, jsonFolderPath);
      });
  }
}

module.exports = {
  main,
};
