// Importing required modules
// File system module to handle file operations
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");
// CSV parser module to parse CSV files
const csvParser = require("csv-parser");
// Public Google Sheets Parser to parse public Google Sheets
const PublicGoogleSheetsParser = require("public-google-sheets-parser");
const { log } = require("./utils");
const compareAndWrite = require("./compareAndWrite");

const urlPattern = new RegExp(
  "^(http|https)://[^ " + String.fromCharCode(34) + "]+$",
);

async function runCheckFolders(configFolder, csvFilePath, googleSheetId) {
  log("configFolder", configFolder);
  const jsonFolderPath = path.join(configFolder, "presets");
  log("csvFilePath", csvFilePath);
  log("jsonFolderPath", jsonFolderPath);
  // Checking if the provided paths exist
  // If not, log an error message and exit the process
  log(
    "DEBUG - Files and sheet exist (jsonFolderPath, csvFilePath, googleSheetId)",
    fs.existsSync(jsonFolderPath),
    fs.existsSync(csvFilePath),
    googleSheetId,
  );
  if (
    !fs.existsSync(jsonFolderPath) ||
    (!fs.existsSync(csvFilePath) && !googleSheetId)
  ) {
    console.error(
      "Both input and output directories and the CSV file or Google Spreadsheet must exist.",
    );
    process.exit(1);
  }
}

async function main(csvFilePath, configFolder) {
  // Getting command line arguments
  // jsonFolderPath: path to the JSON folder
  // csvFilePath: path to the CSV file
  // mainLanguage: main language for translation, default is 'Português'
  // Check if the string is a URL
  // Check if the CSV file path is a Google Sheet ID
  const isUrl = urlPattern.test(csvFilePath);
  let googleSheetId;
  let translationLanguages;
  let missing = true;
  if (isUrl) {
    const checkGoogleSheet = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(
      csvFilePath,
    );
    if (checkGoogleSheet) {
      log("Spreadsheet: " + checkGoogleSheet[1]);
      log("Sheet: " + checkGoogleSheet[3]);
      googleSheetId = checkGoogleSheet[1];
    }
  } else {
    const isGoogleSheet = csvFilePath.match(/^[\w-]{44}$/);
    if (isGoogleSheet) googleSheetId = csvFilePath;
  }
  // Initializing variables
  // csvData: object to store CSV data
  const csvData = {};
  // translationLanguages: array to store languages for translation

  // If the CSV data is from a Google Sheet, parse the data and compare and write
  // Otherwise, read the CSV file, parse the data, and compare and write
  if (googleSheetId) {
    const parser = new PublicGoogleSheetsParser(googleSheetId);
    const items = await parser.parse();
    if (!items || items.lenght == 0) {
      console.error("Empty CSV", items);
      process.exit(1);
    }
    translationLanguages = [
      ...new Set(items.flatMap((item) => Object.keys(item))),
    ];
    console.log(
      "Translation Languages -> | ",
      translationLanguages.join(" | "),
      " |",
    );
    await runCheckFolders(
      configFolder,
      csvFilePath,
      googleSheetId,
      translationLanguages[0],
    );
    await compareAndWrite(items, translationLanguages, configFolder, true);
  } else {
    // Reading the CSV file
    const stream = fs
      .createReadStream(csvFilePath)
      .pipe(csvParser({ separator: "\t" }));
    for await (const row of stream) {
      // Parsing the row data
      translationLanguages = Object.keys(row)[0].split(",");
      console.log(
        "Translation Languages -> | ",
        translationLanguages.join(" | "),
        " |",
      );
      const translations = Object.values(row);
      const term = translations[0].split(",")[0];
      csvData[term] = {};
      translationLanguages.forEach((lang, i) => {
        csvData[term][lang] = translations[0].split(",")[i];
      });
    }
    await runCheckFolders(
      configFolder,
      csvFilePath,
      googleSheetId,
      translationLanguages[0],
    );
    await compareAndWrite(csvData, translationLanguages, configFolder);
  }
  console.log("Done creating presets!");
  const mainLanguage = translationLanguages[0];
  for await (const language of translationLanguages) {
    if (language !== mainLanguage) {
      // Copy the 'fields' folder from the 'mainLanguage' folder to each language folder
      const fieldsSourcePath = path.join(configFolder, "fields");
      const fieldsDestinationPath = path.join(
        configFolder,
        "translations",
        language,
        "fields",
      );
      log("Writing from to", fieldsSourcePath, fieldsDestinationPath);
      await fsExtra.copy(fieldsSourcePath, fieldsDestinationPath);
      // Check for missing presets
      const presetsSourcePath = path.join(configFolder, "presets");
      const presetsDestinationPath = path.join(
        configFolder,
        "translations",
        language,
        "presets",
      );
      const sourceFiles = fs.readdirSync(presetsSourcePath);
      const destinationFiles = fs.readdirSync(presetsDestinationPath); // Fixed variable name
      log(
        "Source and destination lengths: ",
        sourceFiles.length,
        destinationFiles.length,
      );
      const missingPresets = [];
      for await (const file of sourceFiles) {
        if (!destinationFiles.includes(file)) {
          missingPresets.push(file);
          const sourceFilePath = path.join(presetsSourcePath, file); // Fixed variable name
          const destinationFilePath = path.join(presetsDestinationPath, file); // Fixed variable name
          await fsExtra.copy(sourceFilePath, destinationFilePath);
        }
      }
      // Copy defaults.json to each language folder
      const defaultSourcePath = path.join(configFolder, "defaults.json");
      const defaultDestinationPath = path.join(
        configFolder,
        "translations",
        language,
        "defaults.json",
      );
      if (fs.existsSync(defaultSourcePath)) {
        await fsExtra.copy(defaultSourcePath, defaultDestinationPath);
      } else {
        console.log("Warning: defaults.json does not exist!");
      }

      // Copy package.json from configFolder/package.json
      const packageJsonSourcePath = path.join(configFolder, "package.json");
      const packageJsonDestinationPath = path.join(
        configFolder,
        "translations",
        language,
        "package.json",
      );
      if (fs.existsSync(packageJsonSourcePath)) {
        const packageJson = require(packageJsonSourcePath);
        const { name, version } = packageJson;
        const slugifiedLanguage = language.toLowerCase().replace(/\s+/g, "-");
        const modifiedPackageJson = {
          name: `${name}-${slugifiedLanguage}`,
          version,
        };
        await fsExtra.writeJson(
          packageJsonDestinationPath,
          modifiedPackageJson,
        );
      } else {
        console.log("Warning: package.json does not exist!");
      }
    }
  }
  console.log("Done copying fields and defaults.json!");
  if (!missing) {
    console.log("All presets have been translated!");
  }
}

module.exports = {
  main,
};
