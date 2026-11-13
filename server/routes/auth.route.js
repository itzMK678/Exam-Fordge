import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../services/supabase.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { env } from "../config/env.js";

const router = express.Router();
const JWT_SECRET = env.jwtSecret || process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cookie security options
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS script access
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ===================================================
// POST /api/auth/signup
// ===================================================
router.post("/signup", authLimiter, async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret is not configured.",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 72 characters.",
      });
    }

    // 1. Check if user already exists in public.users table (if table exists)
    const { data: existingPublicUser } = await supabase
      .from("users")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingPublicUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 2. Generate a unique ID for each user
    const userId = crypto.randomUUID();

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save to public.users table in Supabase
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }
      // If code is PGRST205 (table doesn't exist yet), we log and continue to Supabase Auth
      if (insertError.code !== "PGRST205") {
        console.error("Error inserting into public.users:", insertError);
      }
    }

    // 5. Also save in Supabase Auth (auth.users)
    const { error: authError } = await supabase.auth.admin.createUser({
      id: userId,
      email: normalizedEmail,
      password: password,
      user_metadata: { name: trimmedName },
      email_confirm: true,
    });

    if (authError) {
      const errMsg = authError.message?.toLowerCase() || "";
      if (errMsg.includes("already") || authError.code === "email_exists") {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }
    }

    // 6. Generate JWT token
    const token = jwt.sign(
      { id: userId, email: normalizedEmail, name: trimmedName },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. Send HTTP-Only Cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: { id: userId, name: trimmedName, email: normalizedEmail },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create account.",
    });
  }
});

// ===================================================
// POST /api/auth/login
// ===================================================
router.post("/login", authLimiter, async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret is not configured.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail) || typeof password !== "string" || password.length > 72) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    let authenticatedUser = null;

    // 1. Try matching from public.users table in database
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, name, email, password")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (dbUser && dbUser.password) {
      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }
      authenticatedUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
      };
    } else {
      // 2. If not found in public.users, match against Supabase Auth (auth.users)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError || !authData?.user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      authenticatedUser = {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || normalizedEmail.split("@")[0],
        email: authData.user.email,
      };
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Send HTTP-Only Cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: authenticatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
});

// ===================================================
// POST /api/auth/logout
// ===================================================
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ===================================================
// GET /api/auth/me (Verify cookie / session state)
// ===================================================
router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;