import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// FAQ sub-schema for project-related questions
const faqSchema = new Schema(
    {
        question: {
            type: String,
            required: [true, "FAQ question is required"],
        },
        answer: {
            type: String,
            required: [true, "FAQ answer is required"],
        },
    },
    { _id: true }
);

const projectSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Project title is required"],
        },
        description: {
            type: String,
            required: [true, "Project description is required"],
        },
        category: {
            type: String,
            enum: ["frontend", "backend", "fullstack", "api", "portfolio", "documentation", "messaging", "news", "seo-tools"],
        },
        techStack: {
            type: [String],
            default: [],
        },
        features: {
            type: [String],
            default: [],
        },
        githubLink: {
            type: String,
            default: "",
        },
        liveDemoLink: {
            type: String,
            default: "",
        },
        apiDocsLink: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        gradient: {
            type: String,
            default: "from-blue-500 via-purple-500 to-pink-500",
        },
        status: {
            type: String,
            enum: ["current", "completed"],
            default: "completed",
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        completedDate: {
            type: String,
            default: "",
        },
        expectedCompletion: {
            type: String,
            default: "",
        },
        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Intermediate",
        },
        duration: {
            type: String,
            default: "",
        },
        faqs: {
            type: [faqSchema],
            default: [],
        },
        isVisible: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

projectSchema.plugin(mongoosePaginate);

export const Project = mongoose.model("Project", projectSchema);
