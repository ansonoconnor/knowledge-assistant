const crypto =
  require("node:crypto");

const {
  info
} = require("../utils/logger");

function establishRequestContext(
  req,
  res,
  next
) {
  const startedAt =
    process.hrtime.bigint();

  req.requestId =
    crypto.randomUUID();

  res.setHeader(
    "X-Request-Id",
    req.requestId
  );

  info(
    "request.received",
    {
      requestId:
        req.requestId,
      method:
        req.method,
      path:
        req.path
    }
  );

  res.once(
    "finish",
    () => {
      const elapsedNanoseconds =
        process.hrtime.bigint() -
        startedAt;

      const durationMs =
        Number(
          elapsedNanoseconds
        ) / 1_000_000;

      info(
        "request.completed",
        {
          requestId:
            req.requestId,
          method:
            req.method,
          path:
            req.path,
          statusCode:
            res.statusCode,
          durationMs:
            Number(
              durationMs.toFixed(2)
            )
        }
      );
    }
  );

  next();
}

module.exports = {
  establishRequestContext
};
