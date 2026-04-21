import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_for_dev_only", {
        expiresIn: "30d",
    });
};

export const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new ApiError(400, "Google token is required");
    }

    try {
        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        // Find or create the user
        let user = await User.findOne({ email });

        if (!user) {
            // First user could be made admin manually later, or logic could be added here
            // e.g. if email === process.env.ADMIN_EMAIL -> role: 'admin'
            const role = email === process.env.ADMIN_EMAIL ? "admin" : "user";
            
            user = await User.create({
                name,
                email,
                googleId,
                avatar,
                role
            });
        }

        // Generate our own JWT
        const jwtToken = generateToken(user._id);

        // Send token in cookie (optional but recommended for security)
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, { user: userResponse, token: jwtToken }, "Login successful"));

    } catch (error) {
        throw new ApiError(401, "Invalid Google token");
    }
});

// Logout controller
export const logout = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    
    return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

// Get current user controller
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-googleId");
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

// Dev/admin login with email+password (for local use)
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

    // Find or create admin user (no googleId needed for dev login)
    let user = await User.findOne({ email: adminEmail });
    if (!user) {
        user = await User.create({
            name: "Admin",
            email: adminEmail,
            googleId: `dev:${adminEmail}`,
            avatar: "",
            role: "admin",
        });
    } else if (user.role !== "admin") {
        user.role = "admin";
        await user.save();
    }

    const jwtToken = generateToken(user._id);

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, { user: userResponse, token: jwtToken }, "Login successful"));
});

export const pinLogin = asyncHandler(async (req, res) => {
    const { pin } = req.body;

    if (!pin) {
        throw new ApiError(400, "PIN is required");
    }

    const dashboardPin = process.env.DASHBOARD_PIN || "1234";

    if (pin !== dashboardPin) {
        throw new ApiError(401, "Invalid PIN");
    }

    // For simplicity, we'll log in as the admin user defined in .env
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        throw new ApiError(500, "ADMIN_EMAIL must be set for PIN login");
    }

    let user = await User.findOne({ email: adminEmail });
    if (!user) {
        // Create the admin user if it doesn't exist
        user = await User.create({
            name: "Admin",
            email: adminEmail,
            googleId: `pin:${adminEmail}`, // Placeholder googleId
            avatar: "",
            role: "admin",
        });
    }

    const jwtToken = generateToken(user._id);

    // Set cookie
    res.cookie("token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, { user: userResponse, token: jwtToken }, "PIN Login successful"));
});
