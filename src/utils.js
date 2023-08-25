// Create isDebug variable set to env
const isDebug = process.env.DEBUG === "true";

const log = (...args) => isDebug && console.log(...args);

module.exports = {
  isDebug,
  log,
};
