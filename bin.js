#!/usr/bin/env node

const { main } = require("./src/index.js");

const [, , csvFilePath, jsonFolderPath = "."] = process.argv;
main(csvFilePath, jsonFolderPath);
