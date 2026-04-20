import { Project } from "../model/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Update Tech Stack
const updateTechStack = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { techStack } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!techStack || !Array.isArray(techStack)) {
        throw new ApiError(400, "Tech stack array is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { techStack },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Tech stack updated successfully"));
});

// Add Single Tech to Stack
const addTech = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tech } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!tech) {
        throw new ApiError(400, "Tech name is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    if (project.techStack.includes(tech)) {
        throw new ApiError(409, "Tech already exists in stack");
    }

    project.techStack.push(tech);
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Tech added successfully"));
});

// Remove Tech from Stack
const removeTech = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tech } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!tech) {
        throw new ApiError(400, "Tech name is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const techIndex = project.techStack.indexOf(tech);
    if (techIndex === -1) {
        throw new ApiError(404, "Tech not found in stack");
    }

    project.techStack.splice(techIndex, 1);
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Tech removed successfully"));
});

// Update Features
const updateFeatures = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { features } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!features || !Array.isArray(features)) {
        throw new ApiError(400, "Features array is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { features },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Features updated successfully"));
});

// Add Single Feature
const addFeature = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feature } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!feature) {
        throw new ApiError(400, "Feature is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    if (project.features.includes(feature)) {
        throw new ApiError(409, "Feature already exists");
    }

    project.features.push(feature);
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Feature added successfully"));
});

// Remove Feature
const removeFeature = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feature } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!feature) {
        throw new ApiError(400, "Feature is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const featureIndex = project.features.indexOf(feature);
    if (featureIndex === -1) {
        throw new ApiError(404, "Feature not found");
    }

    project.features.splice(featureIndex, 1);
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Feature removed successfully"));
});

// Update Links (github, live demo, api docs)
const updateLinks = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { githubLink, liveDemoLink, apiDocsLink } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!githubLink && !liveDemoLink && !apiDocsLink) {
        throw new ApiError(400, "At least one link is required");
    }

    const updateData = {};
    if (githubLink !== undefined) updateData.githubLink = githubLink;
    if (liveDemoLink !== undefined) updateData.liveDemoLink = liveDemoLink;
    if (apiDocsLink !== undefined) updateData.apiDocsLink = apiDocsLink;

    const project = await Project.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Links updated successfully"));
});

// Update Image
const updateImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!image) {
        throw new ApiError(400, "Image URL is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { image },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Image updated successfully"));
});

// Update Gradient
const updateGradient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { gradient } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!gradient) {
        throw new ApiError(400, "Gradient is required");
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { gradient },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Gradient updated successfully"));
});

// Update Category
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const validCategories = ["frontend", "backend", "fullstack", "api", "portfolio", "documentation", "messaging", "news", "seo-tools"];
    if (!category || !validCategories.includes(category)) {
        throw new ApiError(400, `Valid category is required. Options: ${validCategories.join(", ")}`);
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { category },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Category updated successfully"));
});

export {
    updateTechStack,
    addTech,
    removeTech,
    updateFeatures,
    addFeature,
    removeFeature,
    updateLinks,
    updateImage,
    updateGradient,
    updateCategory,
};
