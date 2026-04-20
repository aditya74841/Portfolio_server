import { Project } from "../model/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Project
const createProject = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        techStack,
        features,
        githubLink,
        liveDemoLink,
        apiDocsLink,
        image,
        gradient,
        status,
        progress,
        priority,
        completedDate,
        expectedCompletion,
        difficulty,
        duration,
        faqs,
        isVisible,
    } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // Check if project with same title already exists
    const existingProject = await Project.findOne({ title });
    if (existingProject) {
        throw new ApiError(409, "Project with this title already exists");
    }

    const newProject = await Project.create({
        title,
        description,
        category,
        techStack,
        features,
        githubLink,
        liveDemoLink,
        apiDocsLink,
        image,
        gradient,
        status,
        progress,
        priority,
        completedDate,
        expectedCompletion,
        difficulty,
        duration,
        faqs,
        isVisible,
    });

    if (!newProject) {
        throw new ApiError(500, "Something went wrong while creating project");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newProject, "Project created successfully"));
});

// Get All Projects (with pagination, search, and filters)
const getProjects = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = null,
        category = null,
        status = null,
        priority = null,
        isVisible = null,
    } = req.query;

    // Build query object
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { techStack: { $in: [new RegExp(search, "i")] } },
        ];
    }

    if (category) {
        query.category = category;
    }

    if (status) {
        query.status = status;
    }

    if (priority) {
        query.priority = priority;
    }

    if (isVisible !== null && isVisible !== undefined) {
        query.isVisible = isVisible === "true";
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const projects = await Project.paginate(query, options);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects retrieved successfully"));
});

// Get All Visible Projects (for frontend - no pagination, only visible)
const getVisibleProjects = asyncHandler(async (req, res) => {
    const { status = null, category = null } = req.query;

    const query = { isVisible: true };

    if (status) {
        query.status = status;
    }

    if (category) {
        query.category = category;
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects retrieved successfully"));
});

// Get Project by ID
const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const project = await Project.findById(id);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project retrieved successfully"));
});

// Update Project (full update)
const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field is required to update");
    }

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
        throw new ApiError(404, "Project not found");
    }

    // If title is being updated, check for duplicates
    if (updateData.title && updateData.title !== existingProject.title) {
        const duplicateProject = await Project.findOne({ title: updateData.title });
        if (duplicateProject) {
            throw new ApiError(409, "Project with this title already exists");
        }
    }

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!updatedProject) {
        throw new ApiError(500, "Something went wrong while updating project");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

// Delete Project
const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
        throw new ApiError(500, "Something went wrong while deleting project");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// Get Project Stats
const getProjectStats = asyncHandler(async (req, res) => {
    const totalProjects = await Project.countDocuments();
    const currentProjects = await Project.countDocuments({ status: "current" });
    const completedProjects = await Project.countDocuments({ status: "completed" });
    const visibleProjects = await Project.countDocuments({ isVisible: true });

    // Get category breakdown
    const categoryStats = await Project.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    // Get tech stack breakdown
    const techStats = await Project.aggregate([
        { $unwind: "$techStack" },
        { $group: { _id: "$techStack", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalProjects,
                currentProjects,
                completedProjects,
                visibleProjects,
                categoryStats,
                techStats,
            },
            "Project stats retrieved successfully"
        )
    );
});

export {
    createProject,
    getProjects,
    getVisibleProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectStats,
};
