#!/usr/bin/env node

const { main } = require("./index.js");

const [, , csvFilePath, jsonFolderPath = "./presets"] = process.argv;
main(csvFilePath, jsonFolderPath);
