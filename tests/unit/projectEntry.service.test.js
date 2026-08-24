import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTestDB, clearDatabase, disconnectTestDB, createTestUser } from "../helpers.js";
import { ProjectService } from "../../services/project.service.js";
import { ProjectEntryService } from "../../services/projectEntry.service.js";

describe("ProjectEntryService Unit Tests", () => {
  let user;
  let project;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser();
    project = await ProjectService.createProject({
      userId: user._id,
      name: "Main Project",
      slug: "main-project",
      description: "Main description",
      motive: "Main motive",
    });
  });

  it("should create a project entry successfully", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "milestone",
      title: "Alpha Release",
      content: "First working build shipped",
      isPublic: true,
      tags: ["release", "v1.0"],
    });

    expect(entry).toBeDefined();
    expect(entry.title).toBe("Alpha Release");
    expect(entry.type).toBe("milestone");
    expect(entry.isPublic).toBe(true);
    expect(entry.tags).toEqual(["release", "v1.0"]);
  });

  it("should update project entry details", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "update",
      title: "Initial Title",
      content: "Initial Content",
    });

    const updated = await ProjectEntryService.updateProjectEntry(
      entry._id,
      user._id,
      {
        title: "Updated Title",
        content: "Updated Content",
        type: "learning",
      }
    );

    expect(updated.title).toBe("Updated Title");
    expect(updated.content).toBe("Updated Content");
    expect(updated.type).toBe("learning");
  });

  it("should change isPublic flag on entry", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "difficulty",
      title: "Race Condition",
      content: "Fixing concurrency bug",
      isPublic: false,
    });

    const publicEntry = await ProjectEntryService.changeIsPublic(
      entry._id,
      user._id,
      true
    );
    expect(publicEntry.isPublic).toBe(true);

    const privateEntry = await ProjectEntryService.changeIsPublic(
      entry._id,
      user._id,
      false
    );
    expect(privateEntry.isPublic).toBe(false);
  });

  it("should add unique tags to entry", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "learning",
      title: "Caching Strategy",
      content: "Redis caching patterns",
      tags: ["redis"],
    });

    const updated = await ProjectEntryService.addEntryTags(
      entry._id,
      user._id,
      ["cache", "performance", "redis"]
    );

    expect(updated.tags.sort()).toEqual(["cache", "performance", "redis"].sort());
  });

  it("should remove a specific tag from entry", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "update",
      title: "Tag Removal Test",
      content: "Testing tag removal",
      tags: ["express", "node", "bugfix"],
    });

    const updated = await ProjectEntryService.removeEntryTag(
      entry._id,
      user._id,
      "bugfix"
    );

    expect(updated.tags).toEqual(["express", "node"]);
  });

  it("should delete a project entry", async () => {
    const entry = await ProjectEntryService.createProjectEntry({
      projectId: project._id,
      userId: user._id,
      type: "update",
      title: "To Be Deleted",
      content: "Delete me",
    });

    await ProjectEntryService.deleteProjectEntry(entry._id, user._id);

    await expect(
      ProjectEntryService.getProjectEntryById(entry._id, user._id)
    ).rejects.toThrow("Project entry not found");
  });
});
