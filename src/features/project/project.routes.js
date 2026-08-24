import express from "express";

// Core CRUD Controller
import {
    createProject,
    getProjects,
    getVisibleProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectStats,
} from "./project.controller.js";

// FAQ Controller
import {
    getProjectFaqs,
    addFaq,
    addMultipleFaqs,
    updateFaq,
    removeFaq,
    clearAllFaqs,
    reorderFaqs,
} from "./project.faq.controller.js";

// Status Controller
import {
    updateStatus,
    updateProgress,
    updatePriority,
    toggleVisibility,
    setVisibility,
    updateExpectedCompletion,
    updateDifficulty,
} from "./project.status.controller.js";

// Content Controller
import {
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
} from "./project.content.controller.js";

const router = express.Router();

// ============================================
// 📊 Stats & Public Routes
// ============================================
router.get("/stats", getProjectStats);
router.get("/visible", getVisibleProjects);

// ============================================
// 🗂️ Core CRUD Routes
// ============================================
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// ============================================
// ❓ FAQ Routes
// ============================================
router.get("/:id/faq", getProjectFaqs);
router.post("/:id/faq", addFaq);
router.post("/:id/faq/bulk", addMultipleFaqs);
router.put("/:id/faq/:faqId", updateFaq);
router.delete("/:id/faq/:faqId", removeFaq);
router.delete("/:id/faq", clearAllFaqs);
router.patch("/:id/faq/reorder", reorderFaqs);

// ============================================
// 🔄 Status & Progress Routes
// ============================================
router.patch("/:id/status", updateStatus);
router.patch("/:id/progress", updateProgress);
router.patch("/:id/priority", updatePriority);
router.patch("/:id/visibility/toggle", toggleVisibility);
router.patch("/:id/visibility", setVisibility);
router.patch("/:id/expected-completion", updateExpectedCompletion);
router.patch("/:id/difficulty", updateDifficulty);

// ============================================
// 📝 Content Routes
// ============================================
router.patch("/:id/tech-stack", updateTechStack);
router.post("/:id/tech-stack", addTech);
router.delete("/:id/tech-stack", removeTech);
router.patch("/:id/features", updateFeatures);
router.post("/:id/features", addFeature);
router.delete("/:id/features", removeFeature);
router.patch("/:id/links", updateLinks);
router.patch("/:id/image", updateImage);
router.patch("/:id/gradient", updateGradient);
router.patch("/:id/category", updateCategory);

export default router;
