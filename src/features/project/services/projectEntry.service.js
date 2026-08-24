import { ProjectEntry } from "../projectEntry.model.js";
import { ProjectService } from "./project.service.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * Service handling all business logic for ProjectEntry (Timeline Note) operations.
 */
export class ProjectEntryService {
  /**
   * Create a new project timeline entry.
   */
  static async createProjectEntry({
    projectId,
    userId,
    type,
    title,
    content,
    isPublic = false,
    tags = [],
  }) {
    if (!projectId || !userId || !type || !title || !content) {
      throw new ApiError(400, "projectId, userId, type, title, and content are required");
    }

    const allowedTypes = ["update", "difficulty", "learning", "milestone"];
    if (!allowedTypes.includes(type)) {
      throw new ApiError(400, `Invalid entry type. Must be one of: ${allowedTypes.join(", ")}`);
    }

    // Verify project exists
    await ProjectService.getProjectById(projectId, userId);

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [];

    const entry = await ProjectEntry.create({
      projectId,
      userId,
      type,
      title: title.trim(),
      content: content.trim(),
      isPublic: Boolean(isPublic),
      tags: [...new Set(normalizedTags)],
    });

    return entry;
  }

  /**
   * Get project entries with optional type, public status filtering, and pagination.
   */
  static async getProjectEntries({
    projectId,
    userId = null,
    type,
    isPublic,
    page = 1,
    limit = 10,
  }) {
    if (!projectId) {
      throw new ApiError(400, "projectId is required");
    }

    const query = { projectId };

    if (userId) {
      query.userId = userId;
    }

    if (type) {
      query.type = type;
    }

    if (typeof isPublic === "boolean") {
      query.isPublic = isPublic;
    } else if (isPublic === "true" || isPublic === "false") {
      query.isPublic = isPublic === "true";
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [entries, totalDocs] = await Promise.all([
      ProjectEntry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ProjectEntry.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalDocs / limitNum) || 1;

    return {
      docs: entries,
      totalDocs,
      limit: limitNum,
      page: parseInt(page, 10),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Get single project entry by ID.
   */
  static async getProjectEntryById(entryId, userId = null) {
    if (!entryId) {
      throw new ApiError(400, "Project entry ID is required");
    }

    const query = { _id: entryId };
    if (userId) {
      query.userId = userId;
    }

    const entry = await ProjectEntry.findOne(query);
    if (!entry) {
      throw new ApiError(404, "Project entry not found");
    }

    return entry;
  }

  /**
   * Update entry details (title, content, type).
   */
  static async updateProjectEntry(entryId, userId, updateData = {}) {
    const entry = await this.getProjectEntryById(entryId, userId);

    if (updateData.type) {
      const allowedTypes = ["update", "difficulty", "learning", "milestone"];
      if (!allowedTypes.includes(updateData.type)) {
        throw new ApiError(400, `Invalid entry type. Must be one of: ${allowedTypes.join(", ")}`);
      }
    }

    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = [
        ...new Set(updateData.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)),
      ];
    }

    Object.assign(entry, updateData);
    await entry.save();
    return entry;
  }

  /**
   * Delete a project entry.
   */
  static async deleteProjectEntry(entryId, userId) {
    const entry = await this.getProjectEntryById(entryId, userId);

    await ProjectEntry.deleteOne({ _id: entryId });
    return { message: "Project entry deleted successfully", entryId };
  }

  /**
   * Toggle or set the public visibility status of an entry.
   */
  static async changeIsPublic(entryId, userId, isPublic) {
    if (typeof isPublic !== "boolean") {
      throw new ApiError(400, "isPublic must be a boolean value");
    }

    const entry = await this.getProjectEntryById(entryId, userId);
    entry.isPublic = isPublic;
    await entry.save();
    return entry;
  }

  /**
   * Add new unique tags to an entry.
   */
  static async addEntryTags(entryId, userId, newTags = []) {
    if (!Array.isArray(newTags) || newTags.length === 0) {
      throw new ApiError(400, "newTags must be a non-empty array of strings");
    }

    const entry = await this.getProjectEntryById(entryId, userId);
    const formattedNewTags = newTags
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);

    const mergedTags = new Set([...entry.tags, ...formattedNewTags]);
    entry.tags = Array.from(mergedTags);

    await entry.save();
    return entry;
  }

  /**
   * Remove a specific tag from an entry.
   */
  static async removeEntryTag(entryId, userId, tagToRemove) {
    if (!tagToRemove || !tagToRemove.trim()) {
      throw new ApiError(400, "tagToRemove is required");
    }

    const entry = await this.getProjectEntryById(entryId, userId);
    const normalizedTag = tagToRemove.trim().toLowerCase();

    const initialLength = entry.tags.length;
    entry.tags = entry.tags.filter((t) => t.toLowerCase() !== normalizedTag);

    if (entry.tags.length === initialLength) {
      throw new ApiError(404, `Tag '${tagToRemove}' not found on entry`);
    }

    await entry.save();
    return entry;
  }
}
