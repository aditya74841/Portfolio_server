import { Project } from "./project.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Update Project Status (current/completed)
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!status || !["current", "completed"].includes(status)) {
        throw new ApiError(400, "Valid status (current/completed) is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.status = status;

    // Auto-set completedDate when marking as completed
    if (status === "completed" && !project.completedDate) {
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        project.completedDate = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, `Project marked as ${status}`));
});

// Update Project Progress
const updateProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (progress === undefined || progress < 0 || progress > 100) {
        throw new ApiError(400, "Valid progress (0-100) is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.progress = progress;

    // Auto-mark as completed if progress reaches 100
    if (progress === 100 && project.status !== "completed") {
        project.status = "completed";
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        project.completedDate = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Progress updated successfully"));
});

// Update Project Priority
const updatePriority = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!priority || !["low", "medium", "high"].includes(priority)) {
        throw new ApiError(400, "Valid priority (low/medium/high) is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { priority },
        { new: true, runValidators: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Priority updated successfully"));
});

// Toggle Project Visibility
const toggleVisibility = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.isVisible = !project.isVisible;
    await project.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                `Project visibility ${project.isVisible ? "enabled" : "disabled"}`
            )
        );
});

// Set Visibility Explicitly
const setVisibility = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isVisible } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (typeof isVisible !== "boolean") {
        throw new ApiError(400, "isVisible must be a boolean");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { isVisible },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                `Project visibility set to ${isVisible ? "visible" : "hidden"}`
            )
        );
});

// Update Expected Completion Date
const updateExpectedCompletion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { expectedCompletion } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!expectedCompletion) {
        throw new ApiError(400, "Expected completion date is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { expectedCompletion },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Expected completion updated successfully"));
});

// Update Difficulty
const updateDifficulty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { difficulty } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!difficulty || !["Beginner", "Intermediate", "Advanced"].includes(difficulty)) {
        throw new ApiError(400, "Valid difficulty (Beginner/Intermediate/Advanced) is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { difficulty },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Difficulty updated successfully"));
});

export {
    updateStatus,
    updateProgress,
    updatePriority,
    toggleVisibility,
    setVisibility,
    updateExpectedCompletion,
    updateDifficulty,
};
