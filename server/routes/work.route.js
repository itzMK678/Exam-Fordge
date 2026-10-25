import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply requireAuth to all routes inside /work
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: `Welcome to the protected workspace, ${req.user.name}!`,
    user: req.user,
  });
});

export default router;