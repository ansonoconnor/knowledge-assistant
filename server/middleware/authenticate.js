/******************************************************************************
 * File: authenticate.js
 * Layer: API Middleware
 * Responsibility:
 * Establishes the authenticated Supabase user associated with an incoming
 * Bearer token before privileged Knowledge Assistant operations are allowed.
 *
 * Security boundary:
 * The browser is not trusted to assert user identity. The bearer token is
 * validated through Supabase Auth, and only the verified user is attached
 * to the Express request.
 ******************************************************************************/

const supabase = require("../clients/supabase");

/******************************************************************************
 * Middleware
 ******************************************************************************/

async function requireAuthenticatedUser(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid authorization header"
      });
    }

    const {
      data,
      error
    } = await supabase.auth.getUser(token);

    if (
      error ||
      !data?.user
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired authentication token"
      });
    }

    /*
     * Important:
     * req.user comes from the verified Supabase identity.
     *
     * We do not accept a user ID, email address, or role supplied separately
     * by the browser as proof of identity.
     */
    req.user = data.user;

    next();

  } catch (error) {

    console.error(
      "AUTHENTICATION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Authentication verification failed"
    });
  }
}

module.exports = {
  requireAuthenticatedUser
};