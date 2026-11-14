import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../services/supabase.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

const router = express.Router();
const JWT_SECRET = env.jwtSecret || process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory fallback for password reset codes if table not yet migrated (PGRST205)
const resetCodesMemoryStore = new Map();

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

// ===================================================
// GET /api/auth/google (Initiates Google OAuth)
// ===================================================
router.get("/google", async (req, res) => {
  try {
    const frontendUrl = env.corsOrigin || "http://localhost:5173";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${frontendUrl}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;

    if (req.query.format === "json") {
      return res.json({ success: true, url: data.url });
    }

    return res.redirect(data.url);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize Google Sign-In.",
    });
  }
});

// ===================================================
// POST /api/auth/google-session (Callback exchange)
// ===================================================
router.post("/google-session", async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret is not configured.",
      });
    }

    const { access_token, user_info } = req.body;

    let userEmail = null;
    let userName = null;
    let userId = null;

    if (access_token) {
      try {
        const { data: authUser, error } = await supabase.auth.getUser(access_token);
        if (!error && authUser?.user) {
          userEmail = authUser.user.email?.toLowerCase();
          userName = authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || userEmail?.split("@")[0];
          userId = authUser.user.id;
        }
      } catch (err) {
        console.warn("[Google Auth] Error fetching user from access_token:", err.message);
      }
    }

    if (!userEmail && user_info) {
      userEmail = String(user_info.email || "").toLowerCase().trim();
      userName = user_info.name || user_info.full_name || userEmail.split("@")[0];
      userId = user_info.id || crypto.randomUUID();
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Unable to retrieve Google user credentials.",
      });
    }

    if (!userId) userId = crypto.randomUUID();

    // 1. Ensure user exists in public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, name, email, is_blocked")
      .ilike("email", userEmail)
      .maybeSingle();

    if (existingUser?.is_blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    let finalUser = null;

    if (!existingUser) {
      const newUser = {
        id: userId,
        name: userName || "Student",
        email: userEmail,
        password: "[managed_by_google_oauth]",
        is_blocked: false,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      await supabase.from("users").insert(newUser);
      finalUser = { id: userId, name: userName || "Student", email: userEmail };
    } else {
      await supabase
        .from("users")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", existingUser.id);
      finalUser = { id: existingUser.id, name: existingUser.name, email: existingUser.email };
    }

    // 2. Sign JWT token
    const token = jwt.sign(
      { id: finalUser.id, email: finalUser.email, name: finalUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 3. Set cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: "Signed in with Google successfully.",
      user: finalUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed.",
    });
  }
});

// ===================================================
// POST /api/auth/forgot-password (Send 6-digit code to Gmail)
// ===================================================
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Look up user name if exists
    let userName = "Student";
    const { data: dbUser } = await supabase
      .from("users")
      .select("name, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (dbUser?.name) userName = dbUser.name;

    // Generate secure 6-digit OTP code (100000 - 999999)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Store code in database or memory
    try {
      await supabase.from("password_reset_codes").insert({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
        used: false,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("[Auth] password_reset_codes table notice (using memory):", dbErr.message);
    }

    // Always cache in memoryStore for instant matching
    resetCodesMemoryStore.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });

    // Send email via Gmail/SMTP
    const emailResult = await sendPasswordResetEmail({
      toEmail: normalizedEmail,
      code,
      userName,
    });

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      devCode: emailResult.mode?.includes("dev") ? code : undefined,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process password recovery.",
    });
  }
});

// ===================================================
// POST /api/auth/reset-password (Verify code & set new password)
// ===================================================
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, 6-digit verification code, and new password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // 1. Verify code
    let isValidCode = false;

    // Check memoryStore
    const memEntry = resetCodesMemoryStore.get(normalizedEmail);
    if (memEntry && memEntry.code === cleanCode && !memEntry.used && Date.now() < memEntry.expiresAt) {
      isValidCode = true;
      memEntry.used = true;
    }

    // Also check database
    if (!isValidCode) {
      const { data: dbCode } = await supabase
        .from("password_reset_codes")
        .select("*")
        .ilike("email", normalizedEmail)
        .eq("code", cleanCode)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbCode) {
        isValidCode = true;
        await supabase
          .from("password_reset_codes")
          .update({ used: true })
          .eq("id", dbCode.id);
      }
    }

    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update in public.users
    const { data: updatedUser } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        last_active_at: new Date().toISOString(),
      })
      .ilike("email", normalizedEmail)
      .select("id, name, email")
      .maybeSingle();

    // 4. Update in Supabase Auth if user exists there
    try {
      const { data: authList } = await supabase.auth.admin.listUsers();
      const authUser = authList?.users?.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );
      if (authUser) {
        await supabase.auth.admin.updateUserById(authUser.id, {
          password: newPassword,
        });
      }
    } catch (authErr) {
      console.warn("[Auth] Notice updating Supabase auth password:", authErr.message);
    }

    // 5. Generate session token for auto-login
    const userPayload = updatedUser || {
      id: crypto.randomUUID(),
      name: normalizedEmail.split("@")[0],
      email: normalizedEmail,
    };

    const token = jwt.sign(
      { id: userPayload.id, email: userPayload.email, name: userPayload.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: "Password has been successfully reset. You are now logged in.",
      user: userPayload,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
});

export default router;