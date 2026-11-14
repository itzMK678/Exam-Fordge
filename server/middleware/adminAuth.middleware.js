import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { supabase } from "../services/supabase.service.js";

const JWT_SECRET = env.jwtSecret || process.env.JWT_SECRET;

/**
 * Middleware: Enforces that the request is made by an authorized administrator.
 * Rejects standard users and unauthenticated requests.
 */
export async function requireAdmin(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: JWT secret is not configured.",
    });
  }

  try {
    // Read admin token from cookie or Authorization header
    const token =
      req.cookies?.admin_auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Administrator authentication required.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify that the token has admin role
    if (decoded.role !== "admin" || !decoded.adminId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Administrative privileges required.",
      });
    }

    // Verify admin still exists in public.admins table
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, username, email, role")
      .eq("id", decoded.adminId)
      .maybeSingle();

    if (error && error.code !== "PGRST205") {
      console.error("[Admin Auth] Database error:", error.message);
    }

    // Attach verified admin to request
    req.admin = admin || {
      id: decoded.adminId,
      username: decoded.username || "admin",
      email: decoded.email,
      role: "admin",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin session expired or invalid. Please sign in again.",
    });
  }
}
