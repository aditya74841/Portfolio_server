import { Project } from "../model/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get All FAQs for a Project
const getProjectFaqs = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const project = await Project.findById(id).select("faqs title");
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project.faqs, "FAQs retrieved successfully"));
});

// Add FAQ to Project
const addFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!question || !answer) {
        throw new ApiError(400, "Question and answer are required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.faqs.push({ question, answer });
    await project.save();

    return res
        .status(201)
        .json(new ApiResponse(201, project.faqs, "FAQ added successfully"));
});

// Add Multiple FAQs to Project
const addMultipleFaqs = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { faqs } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
        throw new ApiError(400, "FAQs array is required");
    }

    // Validate each FAQ
    for (const faq of faqs) {
        if (!faq.question || !faq.answer) {
            throw new ApiError(400, "Each FAQ must have a question and answer");
        }
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.faqs.push(...faqs);
    await project.save();

    return res
        .status(201)
        .json(new ApiResponse(201, project.faqs, "FAQs added successfully"));
});

// Update FAQ in Project
const updateFaq = asyncHandler(async (req, res) => {
    const { id, faqId } = req.params;
    const { question, answer } = req.body;

    if (!id || !faqId) {
        throw new ApiError(400, "Project ID and FAQ ID are required");
    }

    if (!question && !answer) {
        throw new ApiError(400, "At least question or answer is required to update");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const faq = project.faqs.id(faqId);
    if (!faq) {
        throw new ApiError(404, "FAQ not found");
    }

    if (question) faq.question = question;
    if (answer) faq.answer = answer;

    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project.faqs, "FAQ updated successfully"));
});

// Remove FAQ from Project
const removeFaq = asyncHandler(async (req, res) => {
    const { id, faqId } = req.params;

    if (!id || !faqId) {
        throw new ApiError(400, "Project ID and FAQ ID are required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const faqIndex = project.faqs.findIndex((faq) => faq._id.toString() === faqId);
    if (faqIndex === -1) {
        throw new ApiError(404, "FAQ not found");
    }

    project.faqs.splice(faqIndex, 1);
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project.faqs, "FAQ removed successfully"));
});

// Clear All FAQs from Project
const clearAllFaqs = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    project.faqs = [];
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, [], "All FAQs cleared successfully"));
});

// Reorder FAQs
const reorderFaqs = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { faqIds } = req.body;

    if (!id) {
        throw new ApiError(400, "Project ID is required");
    }

    if (!faqIds || !Array.isArray(faqIds)) {
        throw new ApiError(400, "FAQ IDs array is required");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Reorder FAQs based on the provided order
    const reorderedFaqs = [];
    for (const faqId of faqIds) {
        const faq = project.faqs.id(faqId);
        if (faq) {
            reorderedFaqs.push(faq);
        }
    }

    if (reorderedFaqs.length !== project.faqs.length) {
        throw new ApiError(400, "Invalid FAQ IDs provided");
    }

    project.faqs = reorderedFaqs;
    await project.save();

    return res
        .status(200)
        .json(new ApiResponse(200, project.faqs, "FAQs reordered successfully"));
});

export {
    getProjectFaqs,
    addFaq,
    addMultipleFaqs,
    updateFaq,
    removeFaq,
    clearAllFaqs,
    reorderFaqs,
};
