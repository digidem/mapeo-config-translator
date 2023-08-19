# Mapeo Config Translator

## Overview

This script is a Node.js application designed to translate JSON files using data from a CSV file or a public Google Sheet. It uses string similarity to find the best match for each term in the JSON files and writes the translations to new JSON files.

## Features

- **CSV and Google Sheets Support**: The script can use either a CSV file or a public Google Sheet as the source of translations.
- **String Similarity Matching**: The script uses string similarity to find the best match for each term in the JSON files.
- **JSON File Generation**: The script writes the translations to new JSON files, preserving the original structure of the JSON files.
- **Language Support**: The script supports multiple languages for translation. The main language for translation can be specified as a command line argument.

## Usage

Run directly with npx: `npx mapeo-config-translator 1S7mdKPfT_3AaWS9mxn1qy5mj1aszuRNuncC7GlDSz_8`

Or install globally: `npm i -g mapeo-config-translator`

Example template for translations is available here: https://docs.google.com/spreadsheets/d/1S7mdKPfT_3AaWS9mxn1qy5mj1aszuRNuncC7GlDSz_8/edit#gid=0

The script is run from the command line with the following arguments:

- `csvFilePath`: The path to the CSV file or the ID of the public Google Sheet containing the translations.
- `jsonFolderPath`: The path to the folder containing the JSON files to translate (optional, defaults to ./presets).

## To-Dos

- **Error Handling**: Improve error handling for cases where the CSV file or Google Sheet cannot be read, or the JSON files cannot be written.
- **Performance Optimization**: Optimize the script for large numbers of JSON files or large CSV files/Google Sheets.
- **Testing**: Write tests to ensure the script is working as expected.
- **Documentation**: Improve documentation for the script, including more detailed usage instructions and examples.
