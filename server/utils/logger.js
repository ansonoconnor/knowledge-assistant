function writeLog(
  level,
  event,
  fields = {}
) {
  const entry = {
    timestamp:
      new Date().toISOString(),
    level,
    event,
    ...fields
  };

  const serialized =
    JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}

function info(
  event,
  fields
) {
  writeLog(
    "info",
    event,
    fields
  );
}

function error(
  event,
  errorValue,
  fields = {}
) {
  writeLog(
    "error",
    event,
    {
      ...fields,
      errorType:
        errorValue?.name ||
        "Error",
      errorCode:
        errorValue?.code ||
        null
    }
  );
}

module.exports = {
  info,
  error
};
