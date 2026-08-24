import { Project } from "../project.model.js";
import { ProjectEntry } from "../projectEntry.model.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * Service handling all business logic for Project operations.
 */
export class ProjectService {
  /**
   * Create a new project for a user.
   */
  static async createProject({
    userId,
    name,
    slug,
    description,
    motive,
    status = "building",
    techStack = [],
    githubUrl = "",
    liveUrl = "",
    thumbnailUrl = "",
  }) {
    if (!userId || !name || !slug || !description || !motive) {
      throw new ApiError(400, "userId, name, slug, description, and motive are required");
    }

    const normalizedSlug = slug.trim().toLowerCase();
    const existing = await Project.findOne({ userId, slug: normalizedSlug });
    if (existing) {
      throw new ApiError(409, `Project with slug '${normalizedSlug}' already exists for this user`);
    }

    const project = await Project.create({
      userId,
      name,
      slug: normalizedSlug,
      description,
      motive,
      status,
      techStack,
      githubUrl,
      liveUrl,
      thumbnailUrl,
    });

    return project;
  }

  /**
   * Get projects with optional search, status filtering, and pagination.
   */
  static async getProjects({
    userId,
    status,
    search,
    page = 1,
    limit = 10,
  } = {}) {
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { motive: searchRegex },
      ];
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    return await Project.paginate(query, options);
  }

  /**
   * Get single project by ID.
   */
  static async getProjectById(projectId, userId = null) {
    if (!projectId) {
      throw new ApiError(400, "Project ID is required");
    }

    const query = { _id: projectId };
    if (userId) {
      query.userId = userId;
    }

    const project = await Project.findOne(query);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return project;
  }

  /**
   * Get single project by Slug.
   */
  static async getProjectBySlug(slug, userId = null) {
    if (!slug) {
      throw new ApiError(400, "Project slug is required");
    }

    const query = { slug: slug.trim().toLowerCase() };
    if (userId) {
      query.userId = userId;
    }

    const project = await Project.findOne(query);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return project;
  }

  /**
   * Update project fields.
   */
  static async updateProject(projectId, userId, updateData = {}) {
    const project = await this.getProjectById(projectId, userId);

    if (updateData.slug && updateData.slug.trim().toLowerCase() !== project.slug) {
      const normalizedSlug = updateData.slug.trim().toLowerCase();
      const existing = await Project.findOne({
        userId: project.userId,
        slug: normalizedSlug,
        _id: { $ne: projectId },
      });
      if (existing) {
        throw new ApiError(409, `Project with slug '${normalizedSlug}' already exists`);
      }
      updateData.slug = normalizedSlug;
    }

    Object.assign(project, updateData);
    await project.save();
    return project;
  }

  /**
   * Delete a project and cascade delete all its entries.
   */
  static async deleteProject(projectId, userId) {
    const project = await this.getProjectById(projectId, userId);

    await Project.deleteOne({ _id: projectId });
    await ProjectEntry.deleteMany({ projectId });

    return { message: "Project and associated entries deleted successfully", projectId };
  }

  /**
   * Update status of a project.
   */
  static async updateProjectStatus(projectId, userId, status) {
    const allowedStatuses = ["building", "deployed", "maintaining", "archived"];
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`);
    }

    const project = await this.getProjectById(projectId, userId);
    project.status = status;
    await project.save();

    return project;
  }

  /**
   * Add a new technology category to techStack.
   */
  static async addTechCategory(projectId, userId, categoryName) {
    if (!categoryName || !categoryName.trim()) {
      throw new ApiError(400, "Category name is required");
    }

    const project = await this.getProjectById(projectId, userId);
    const catTrimmed = categoryName.trim();

    const existingCat = project.techStack.find(
      (cat) => cat.category.toLowerCase() === catTrimmed.toLowerCase()
    );

    if (existingCat) {
      throw new ApiError(409, `Category '${catTrimmed}' already exists in techStack`);
    }

    project.techStack.push({ category: catTrimmed, items: [] });
    await project.save();
    return project;
  }

  /**
   * Remove a technology category from techStack.
   */
  static async removeTechCategory(projectId, userId, categoryName) {
    if (!categoryName) {
      throw new ApiError(400, "Category name is required");
    }

    const project = await this.getProjectById(projectId, userId);
    const catTrimmed = categoryName.trim().toLowerCase();

    const initialLength = project.techStack.length;
    project.techStack = project.techStack.filter(
      (cat) => cat.category.toLowerCase() !== catTrimmed
    );

    if (project.techStack.length === initialLength) {
      throw new ApiError(404, `Category '${categoryName}' not found in techStack`);
    }

    await project.save();
    return project;
  }

  /**
   * Add a technology item into a specific category in techStack.
   */
  static async addTechItem(projectId, userId, categoryName, item) {
    if (!categoryName || !item || !item.name) {
      throw new ApiError(400, "categoryName and item name are required");
    }

    const project = await this.getProjectById(projectId, userId);
    const catTrimmed = categoryName.trim();

    let catObj = project.techStack.find(
      (cat) => cat.category.toLowerCase() === catTrimmed.toLowerCase()
    );

    if (!catObj) {
      project.techStack.push({ category: catTrimmed, items: [] });
      catObj = project.techStack.find(
        (cat) => cat.category.toLowerCase() === catTrimmed.toLowerCase()
      );
    }

    const existingItem = catObj.items.find(
      (i) => i.name.toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existingItem) {
      throw new ApiError(409, `Item '${item.name}' already exists in category '${catTrimmed}'`);
    }

    catObj.items.push({
      name: item.name.trim(),
      description: item.description ? item.description.trim() : "",
    });

    await project.save();
    return project;
  }

  /**
   * Remove a technology item from a category in techStack.
   */
  static async removeTechItem(projectId, userId, categoryName, itemName) {
    if (!categoryName || !itemName) {
      throw new ApiError(400, "categoryName and itemName are required");
    }

    const project = await this.getProjectById(projectId, userId);
    const catTrimmed = categoryName.trim().toLowerCase();
    const itemTrimmed = itemName.trim().toLowerCase();

    const catObj = project.techStack.find(
      (cat) => cat.category.toLowerCase() === catTrimmed
    );

    if (!catObj) {
      throw new ApiError(404, `Category '${categoryName}' not found in techStack`);
    }

    const initialLength = catObj.items.length;
    catObj.items = catObj.items.filter(
      (i) => i.name.toLowerCase() !== itemTrimmed
    );

    if (catObj.items.length === initialLength) {
      throw new ApiError(404, `Item '${itemName}' not found in category '${categoryName}'`);
    }

    await project.save();
    return project;
  }
}
