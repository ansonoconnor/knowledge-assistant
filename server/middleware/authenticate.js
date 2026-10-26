/******************************************************************************
 * File: authenticate.js
 * Layer: API Middleware
 * Responsibility:
 * Establishes the authenticated Supabase user associated with an incoming
 * Bearer token before protected Knowledge Assistant operations are allowed.
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

const {
  info,
  error: logError
} = require("../utils/logger");

function logDenial(
  req,
  event,
  fields
) {
  info(
    event,
    {
      requestId:
        req.requestId,
      ...fields
    }
  );
}

async function requireAuthenticatedUser(
  req,
  res,
  next
) {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (!authorizationHeader) {
      logDenial(
        req,
        "authentication.denied",
        {
          reason:
            "credentials_missing",
          statusCode:
            401
        }
      );

      return res.status(401).json({
        success: false,
        error:
          "Authentication required"
      });
    }

    const [
      scheme,
      token
    ] =
      authorizationHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      logDenial(
        req,
        "authentication.denied",
        {
          reason:
            "authorization_header_invalid",
          statusCode:
            401
        }
      );

      return res.status(401).json({
        success: false,
        error:
          "Invalid authorization header"
      });
    }

    const {
      data,
      error
    } =
      await authenticationClient
        .auth
        .getUser(token);

    if (
      error ||
      !data?.user
    ) {
      logDenial(
        req,
        "authentication.denied",
        {
          reason:
            "token_invalid_or_expired",
          statusCode:
            401
        }
      );

      return res.status(401).json({
        success: false,
        error:
          "Invalid or expired authentication token"
      });
    }

    info(
      "authentication.verified",
      {
        requestId:
          req.requestId,
        userId:
          data.user.id
      }
    );

    const userSupabase =
      createUserSupabaseClient(
        token
      );

    const {
      data: memberships,
      error: membershipError
    } = await userSupabase
      .from(
        "organization_memberships"
      )
      .select("organization_id")
      .eq(
        "user_id",
        data.user.id
      )
      .limit(2);

    if (membershipError) {
      throw membershipError;
    }

    if (!memberships?.length) {
      logDenial(
        req,
        "authorization.denied",
        {
          userId:
            data.user.id,
          reason:
            "organization_membership_required",
          statusCode:
            403
        }
      );

      return res.status(403).json({
        success: false,
        error:
          "Organization membership required"
      });
    }

    if (memberships.length > 1) {
      logDenial(
        req,
        "authorization.denied",
        {
          userId:
            data.user.id,
          reason:
            "organization_selection_required",
          statusCode:
            409
        }
      );

      return res.status(409).json({
        success: false,
        error:
          "Organization selection required"
      });
    }

    req.user =
      data.user;

    req.supabase =
      userSupabase;

    req.organizationId =
      memberships[0].organization_id;

    info(
      "authorization.organization_resolved",
      {
        requestId:
          req.requestId,
        userId:
          req.user.id,
        organizationId:
          req.organizationId
      }
    );

    next();

  } catch (error) {
    logError(
      "authentication.failed",
      error,
      {
        requestId:
          req.requestId
      }
    );

    res.status(500).json({
      success: false,
      error:
        "Authentication verification failed"
    });
  }
}

module.exports = {
  requireAuthenticatedUser
};
