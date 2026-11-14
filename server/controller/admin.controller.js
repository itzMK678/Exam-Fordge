import {
  getSetupStatus,
  setupInitialAdmin,
  loginAdmin,
  updateAdminCredentials,
  getOverviewStats,
  listUsers,
  getUserDetails,
  toggleUserBlock,
  resetUserPassword,
  deleteUserAccount,
  listExams,
  getExamDetails,
  deleteExam,
  listDocuments,
  deleteDocument,
  getAIMonitoringStats,
  getRAGMonitoringStats,
  getLearningAnalytics,
  getSystemHealth,
  listFeedback,
  updateFeedback,
  createFeedback,
  getPlatformSettings,
  updatePlatformSettings,
  getAdminActivityLogs,
  ADMIN_COOKIE_OPTIONS,
} from "../services/admin.service.js";

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1"
  );
}

// ============================================================
// AUTH & SETUP
// ============================================================

export async function handleGetSetupStatus(req, res, next) {
  try {
    const status = await getSetupStatus();
    return res.status(200).json({ success: true, ...status });
  } catch (err) {
    next(err);
  }
}

export async function handleSetupInitialAdmin(req, res, next) {
  try {
    const { username, email, password } = req.body;
    const ipAddress = getClientIp(req);

    const { admin, token } = await setupInitialAdmin({
      username,
      email,
      password,
      ipAddress,
    });

    res.cookie("admin_auth_token", token, ADMIN_COOKIE_OPTIONS);
    return res.status(201).json({
      success: true,
      message: "Administrator account initialized successfully.",
      admin,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const ipAddress = getClientIp(req);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const { admin, token } = await loginAdmin({
      username,
      password,
      ipAddress,
    });

    res.cookie("admin_auth_token", token, ADMIN_COOKIE_OPTIONS);
    return res.status(200).json({
      success: true,
      message: "Admin authenticated successfully.",
      admin,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleLogout(req, res) {
  res.clearCookie("admin_auth_token", {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully.",
  });
}

export async function handleGetMe(req, res) {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
}

export async function handleUpdateCredentials(req, res, next) {
  try {
    const { currentPassword, newUsername, newPassword, newEmail } = req.body;
    const ipAddress = getClientIp(req);

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required to verify identity.",
      });
    }

    const updated = await updateAdminCredentials({
      adminId: req.admin.id,
      currentPassword,
      newUsername,
      newPassword,
      newEmail,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: "Admin account settings updated successfully.",
      admin: updated,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// OVERVIEW & ANALYTICS
// ============================================================

export async function handleGetOverview(req, res, next) {
  try {
    const data = await getOverviewStats();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// USERS
// ============================================================

export async function handleListUsers(req, res, next) {
  try {
    const { search = "", status = "all", page = 1, limit = 15 } = req.query;
    const data = await listUsers({
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetUserDetails(req, res, next) {
  try {
    const { id } = req.params;
    const data = await getUserDetails(id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleUserBlock(req, res, next) {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const ipAddress = getClientIp(req);

    const data = await toggleUserBlock(id, isBlocked, req.admin, ipAddress);
    return res.status(200).json({
      success: true,
      message: `User account has been ${isBlocked ? "blocked" : "unblocked"}.`,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleResetUserPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const ipAddress = getClientIp(req);

    const result = await resetUserPassword(id, newPassword, req.admin, ipAddress);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    const result = await deleteUserAccount(id, req.admin, ipAddress);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ============================================================
// EXAMS
// ============================================================

export async function handleListExams(req, res, next) {
  try {
    const { search = "", difficulty = "all", page = 1, limit = 15 } = req.query;
    const data = await listExams({
      search,
      difficulty,
      page: Number(page),
      limit: Number(limit),
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetExamDetails(req, res, next) {
  try {
    const { id } = req.params;
    const data = await getExamDetails(id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteExam(req, res, next) {
  try {
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    await deleteExam(id, req.admin, ipAddress);
    return res.status(200).json({
      success: true,
      message: "Exam record deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function handleListDocuments(req, res, next) {
  try {
    const { search = "", status = "all", page = 1, limit = 15 } = req.query;
    const data = await listDocuments({
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    await deleteDocument(id, req.admin, ipAddress);
    return res.status(200).json({
      success: true,
      message: "Document, related chunks, and storage files deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// AI & RAG MONITORING
// ============================================================

export async function handleGetAIMonitoring(req, res, next) {
  try {
    const data = await getAIMonitoringStats();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetRAGMonitoring(req, res, next) {
  try {
    const data = await getRAGMonitoringStats();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// LEARNING ANALYTICS
// ============================================================

export async function handleGetLearningAnalytics(req, res, next) {
  try {
    const data = await getLearningAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// SYSTEM HEALTH
// ============================================================

export async function handleGetSystemHealth(req, res, next) {
  try {
    const data = await getSystemHealth();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// FEEDBACK & SUPPORT
// ============================================================

export async function handleListFeedback(req, res, next) {
  try {
    const { category = "all", status = "all", page = 1, limit = 15 } = req.query;
    const data = await listFeedback({
      category,
      status,
      page: Number(page),
      limit: Number(limit),
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const ipAddress = getClientIp(req);

    const data = await updateFeedback(id, { status, adminNotes }, req.admin, ipAddress);
    return res.status(200).json({
      success: true,
      message: "Feedback status updated.",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSubmitPublicFeedback(req, res, next) {
  try {
    const { category, rating, message } = req.body;
    const userId = req.user?.id || null;
    const userName = req.user?.name || null;
    const userEmail = req.user?.email || null;

    const data = await createFeedback({
      userId,
      userName,
      userEmail,
      category,
      rating,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been received.",
      data,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// SETTINGS & LOGS
// ============================================================

export async function handleGetSettings(req, res, next) {
  try {
    const settings = await getPlatformSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateSettings(req, res, next) {
  try {
    const ipAddress = getClientIp(req);
    const updated = await updatePlatformSettings(req.body, req.admin, ipAddress);
    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetActivityLogs(req, res, next) {
  try {
    const { action = "all", page = 1, limit = 20 } = req.query;
    const data = await getAdminActivityLogs({
      action,
      page: Number(page),
      limit: Number(limit),
    });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
