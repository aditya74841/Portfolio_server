import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // never returned by default
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // allows multiple nulls
        },
        avatar: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        authProvider: {
            type: String,
            enum: ["email", "google"],
            default: "email",
        },

        // PIN — hashed 4-digit code for quick unlock
        pin: {
            type: String,
            select: false,
        },
        pinSessionExpiresAt: {
            type: Date,
        },

        // Password reset
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
    },
    { timestamps: true }
);

// ---------------------------------------------------------------------------
// Pre-save: hash password & pin when modified
// ---------------------------------------------------------------------------
userSchema.pre("save", async function (next) {
    // Hash password if modified
    if (this.isModified("password") && this.password) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Hash pin if modified
    if (this.isModified("pin") && this.pin) {
        const salt = await bcrypt.genSalt(12);
        this.pin = await bcrypt.hash(this.pin, salt);
    }

    next();
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.comparePin = async function (candidatePin) {
    return bcrypt.compare(candidatePin, this.pin);
};

export const User = mongoose.model("User", userSchema);
