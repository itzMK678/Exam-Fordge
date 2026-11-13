import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_SECRET = env.jwtSecret || process.env.JWT_SECRET;

export const requireAuth = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: JWT secret is not configured.",
    });
  }
  try {
    // 1. Read token from cookie (or fallback to Authorization header)
    const token =
      req.cookies?.auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access denied. Please log in.",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Session has expired or token is invalid.",
    });
  }
};