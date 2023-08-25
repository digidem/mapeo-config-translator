#!/usr/bin/env node

const { main } = require("./src/index.js");

const [, , csvFilePath, jsonFolderPath = "./translations"] = process.argv;
main(csvFilePath, jsonFolderPath);
