/******************************************************************************
 * File: authenticate.js
 * Layer: API Middleware
 * Responsibility:
 * Establishes the authenticated Supabase user associated with an incoming
 * Bearer token before privileged Knowledge Assistant operations are allowed.
 *
 * Security boundary:
 * The browser is not trusted to assert user identity. The bearer token is
 * validated through Supabase Auth. Ordinary database work then uses a
 * request-scoped Supabase client carrying that verified user's JWT so
 * PostgreSQL RLS continues to see the authenticated principal.
 ******************************************************************************/

const {
  authenticationClient,
  createUserSupabaseClient
} = require("../clients/supabase");

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
    } =
      await authenticationClient.auth.getUser(token);

    if (
      error ||
      !data?.user
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired authentication token"
      });
    }

    const userSupabase =
      createUserSupabaseClient(token);

    const {
      data: memberships,
      error: membershipError
    } = await userSupabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", data.user.id)
      .limit(2);

    if (membershipError) {
      throw membershipError;
    }

    if (!memberships?.length) {
      return res.status(403).json({
        success: false,
        error:
          "Organization membership required"
      });
    }

    /*
     * Knowledge Assistant currently presents one organizational corpus.
     * Fail closed if organization selection becomes ambiguous.
     */
    if (memberships.length > 1) {
      return res.status(409).json({
        success: false,
        error:
          "Organization selection required"
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

    /*
     * Downstream routes receive the authenticated user's database authority
     * and organization scope. They do not receive service-role authority.
     */
    req.supabase =
      userSupabase;

    req.organizationId =
      memberships[0].organization_id;

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