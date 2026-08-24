import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "./user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendResetPasswordEmail } from "../../utils/mail.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PIN_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (inactivity lock managed on client)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    {
      expiresIn: "30d",
    },
  );
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  authProvider: user.authProvider,
  hasPin: !!user.pin,
  pinSessionExpiresAt: user.pinSessionExpiresAt,
});

// ---------------------------------------------------------------------------
// 1. Email Registration
// ---------------------------------------------------------------------------
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    authProvider: "email",
  });

  // Start a 1-hour PIN session automatically upon registration
  const pinSessionExpiresAt = new Date(Date.now() + PIN_SESSION_DURATION_MS);
  user.pinSessionExpiresAt = pinSessionExpiresAt;
  await user.save();

  const jwtToken = generateToken(user._id);

  // Need to fetch with pin field to check hasPin
  const fullUser = await User.findById(user._id).select("+pin");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: sanitizeUser(fullUser), token: jwtToken },
        "Registration successful",
      ),
    );
});

// ---------------------------------------------------------------------------
// 2. Email Login
// ---------------------------------------------------------------------------
export const emailLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password +pin");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new ApiError(
      401,
      "This account uses Google login. Please sign in with Google.",
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Start a 1-hour PIN session automatically upon login
  const pinSessionExpiresAt = new Date(Date.now() + PIN_SESSION_DURATION_MS);
  user.pinSessionExpiresAt = pinSessionExpiresAt;
  await user.save();

  const jwtToken = generateToken(user._id);

  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user), token: jwtToken },
        "Login successful",
      ),
    );
});

// ---------------------------------------------------------------------------
// 3. Google Login (existing, updated)
// ---------------------------------------------------------------------------
export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Google token is required");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    let user = await User.findOne({ email }).select("+pin");

    if (!user) {
      const role = email === process.env.ADMIN_EMAIL ? "admin" : "user";
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        role,
        authProvider: "google",
      });
      // Re-fetch with pin
      user = await User.findById(user._id).select("+pin");
    } else {
      // Update google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      user.authProvider = "google";
      await user.save();
    }

    // Start a 1-hour PIN session automatically upon Google login
    const pinSessionExpiresAt = new Date(Date.now() + PIN_SESSION_DURATION_MS);
    user.pinSessionExpiresAt = pinSessionExpiresAt;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: sanitizeUser(user), token: jwtToken },
          "Login successful",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Google token");
  }
});

// ---------------------------------------------------------------------------
// 4. Logout
// ---------------------------------------------------------------------------
export const logout = asyncHandler(async (req, res) => {
  // Clear PIN session on logout
  await User.findByIdAndUpdate(req.user._id, { pinSessionExpiresAt: null });

  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ---------------------------------------------------------------------------
// 5. Get Current User
// ---------------------------------------------------------------------------
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+pin -googleId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, sanitizeUser(user), "User fetched successfully"),
    );
});

// ---------------------------------------------------------------------------
// 6. Forgot Password
// ---------------------------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists — always send success
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If an account with that email exists, a reset link has been sent.",
        ),
      );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  // Build reset URL (frontend will handle this page)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  try {
    await sendResetPasswordEmail(user.email, resetUrl, user.name);
  } catch (error) {
    // Roll back token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new ApiError(
      500,
      "Failed to send reset email. Please try again later.",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If an account with that email exists, a reset link has been sent.",
      ),
    );
});

// ---------------------------------------------------------------------------
// 7. Reset Password
// ---------------------------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password reset successful. You can now login."),
    );
});

// ---------------------------------------------------------------------------
// 8. Change Password (authenticated)
// ---------------------------------------------------------------------------
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user.password) {
    throw new ApiError(
      400,
      "Your account uses Google login and doesn't have a password set.",
    );
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ---------------------------------------------------------------------------
// 9. Set PIN (create or update)
// ---------------------------------------------------------------------------
export const setPin = asyncHandler(async (req, res) => {
  const { pin } = req.body;

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new ApiError(400, "PIN must be exactly 4 digits");
  }

  const user = await User.findById(req.user._id).select("+pin");

  user.pin = pin; // will be hashed by pre-save hook
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "PIN set successfully"));
});

// ---------------------------------------------------------------------------
// 10. Verify PIN (creates a 1-hour session)
// ---------------------------------------------------------------------------
export const verifyPin = asyncHandler(async (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    throw new ApiError(400, "PIN is required");
  }

  const user = await User.findById(req.user._id).select("+pin");

  if (!user.pin) {
    throw new ApiError(400, "No PIN has been set. Please set a PIN first.");
  }

  const isMatch = await user.comparePin(pin);
  if (!isMatch) {
    throw new ApiError(401, "Invalid PIN");
  }

  // Set PIN session expiry to 1 hour from now
  const pinSessionExpiresAt = new Date(Date.now() + PIN_SESSION_DURATION_MS);
  user.pinSessionExpiresAt = pinSessionExpiresAt;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { pinSessionExpiresAt },
        "PIN verified. Session active for 1 hour.",
      ),
    );
});

// ---------------------------------------------------------------------------
// 11. Check PIN Session
// ---------------------------------------------------------------------------
export const checkPinSession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+pin");

  const hasPin = !!user.pin;
  const isValid =
    user.pinSessionExpiresAt && new Date(user.pinSessionExpiresAt) > new Date();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hasPin,
        isValid: !!isValid,
        pinSessionExpiresAt: user.pinSessionExpiresAt,
      },
      "PIN session status",
    ),
  );
});

import { deleteFromCloudinary } from "../../utils/cloudinary.js";

// Helper to extract Cloudinary public ID from URL
const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  try {
    // e.g., https://res.cloudinary.com/cloudname/image/upload/v1234567890/portfolio-avatars/filename.jpg
    const splitUrl = url.split("/upload/");
    if (splitUrl.length !== 2) return null;

    let path = splitUrl[1];
    // Remove version if present (e.g., v1234567890/)
    if (path.match(/^v\d+\//)) {
      path = path.replace(/^v\d+\//, "");
    }
    // Remove extension
    return path.substring(0, path.lastIndexOf("."));
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// 12. Change Avatar (file upload via Cloudinary)
// ---------------------------------------------------------------------------
export const changeAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  const user = await User.findById(req.user._id).select("+pin");

  // Delete old avatar from Cloudinary if it exists
  if (user.avatar) {
    const publicId = getCloudinaryPublicId(user.avatar);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  const result = await uploadToCloudinary(req.file.buffer, "portfolio-avatars");

  user.avatar = result.url;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatar: user.avatar },
        "Avatar updated successfully",
      ),
    );
});

// ---------------------------------------------------------------------------
// 12b. Remove Avatar
// ---------------------------------------------------------------------------
export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+pin");

  // Delete from Cloudinary
  if (user.avatar) {
    const publicId = getCloudinaryPublicId(user.avatar);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  user.avatar = "";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { avatar: "" }, "Avatar removed successfully"));
});

// ---------------------------------------------------------------------------
// 13. Update Profile (Name)
// ---------------------------------------------------------------------------
export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    throw new ApiError(400, "Name is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true },
  ).select("+pin");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user) },
        "Profile updated successfully",
      ),
    );
});

// ---------------------------------------------------------------------------
// LEGACY: Dev admin login (kept for backward compatibility)
// ---------------------------------------------------------------------------
export const devAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new ApiError(500, "ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  if (email !== adminEmail || password !== adminPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  let user = await User.findOne({ email: adminEmail }).select("+pin");
  if (!user) {
    user = await User.create({
      name: "Admin",
      email: adminEmail,
      googleId: `dev:${adminEmail}`,
      avatar: "",
      role: "admin",
    });
    user = await User.findById(user._id).select("+pin");
  } else if (user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  const jwtToken = generateToken(user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user), token: jwtToken },
        "Login successful",
      ),
    );
});

// ---------------------------------------------------------------------------
// LEGACY: PIN login (old single-layer — kept for backward compat)
// ---------------------------------------------------------------------------
export const pinLogin = asyncHandler(async (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    throw new ApiError(400, "PIN is required");
  }

  const dashboardPin = process.env.DASHBOARD_PIN || "1234";

  if (pin !== dashboardPin) {
    throw new ApiError(401, "Invalid PIN");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new ApiError(500, "ADMIN_EMAIL must be set for PIN login");
  }

  let user = await User.findOne({ email: adminEmail }).select("+pin");
  if (!user) {
    user = await User.create({
      name: "Admin",
      email: adminEmail,
      googleId: `pin:${adminEmail}`,
      avatar: "",
      role: "admin",
    });
    user = await User.findById(user._id).select("+pin");
  }

  const jwtToken = generateToken(user._id);

  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: sanitizeUser(user), token: jwtToken },
        "PIN Login successful",
      ),
    );
});
