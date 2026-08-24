import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTestDB, clearDatabase, disconnectTestDB, createTestUser } from "../helpers.js";
import { ProjectService } from "../../services/project.service.js";
import { ProjectEntry } from "../../model/Project/projectEntry.model.js";

describe("ProjectService Unit Tests", () => {
  let user;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser();
  });

  it("should create a project successfully", async () => {
    const project = await ProjectService.createProject({
      userId: user._id,
      name: "Smart Portfolio",
      slug: "smart-portfolio",
      description: "AI-powered portfolio application",
      motive: "Showcase personal timeline and projects",
      status: "building",
    });

    expect(project).toBeDefined();
    expect(project.name).toBe("Smart Portfolio");
    expect(project.slug).toBe("smart-portfolio");
    expect(project.status).toBe("building");
  });

  it("should prevent duplicate slugs for the same user", async () => {
    await ProjectService.createProject({
      userId: user._id,
      name: "Portfolio V1",
      slug: "portfolio-v1",
      description: "Version 1",
      motive: "Motive 1",
    });

    await expect(
      ProjectService.createProject({
        userId: user._id,
        name: "Portfolio V1 Copy",
        slug: "portfolio-v1",
        description: "Version 1 copy",
        motive: "Motive 1 copy",
      })
    ).rejects.toThrow("already exists");
  });

  it("should retrieve projects with pagination and status filter", async () => {
    await ProjectService.createProject({
      userId: user._id,
      name: "App 1",
      slug: "app-1",
      description: "Desc 1",
      motive: "Motive 1",
      status: "building",
    });
    await ProjectService.createProject({
      userId: user._id,
      name: "App 2",
      slug: "app-2",
      description: "Desc 2",
      motive: "Motive 2",
      status: "deployed",
    });

    const result = await ProjectService.getProjects({
      userId: user._id,
      status: "deployed",
      page: 1,
      limit: 10,
    });

    expect(result.docs).toHaveLength(1);
    expect(result.docs[0].name).toBe("App 2");
  });

  it("should update project status", async () => {
    const project = await ProjectService.createProject({
      userId: user._id,
      name: "Status Test",
      slug: "status-test",
      description: "Desc",
      motive: "Motive",
      status: "building",
    });

    const updated = await ProjectService.updateProjectStatus(
      project._id,
      user._id,
      "deployed"
    );

    expect(updated.status).toBe("deployed");
  });

  it("should add and remove techStack categories", async () => {
    const project = await ProjectService.createProject({
      userId: user._id,
      name: "Tech Test",
      slug: "tech-test",
      description: "Desc",
      motive: "Motive",
    });

    const withCat = await ProjectService.addTechCategory(
      project._id,
      user._id,
      "Frontend"
    );
    expect(withCat.techStack).toHaveLength(1);
    expect(withCat.techStack[0].category).toBe("Frontend");

    const afterRemove = await ProjectService.removeTechCategory(
      project._id,
      user._id,
      "Frontend"
    );
    expect(afterRemove.techStack).toHaveLength(0);
  });

  it("should add and remove items inside techStack category", async () => {
    const project = await ProjectService.createProject({
      userId: user._id,
      name: "Item Test",
      slug: "item-test",
      description: "Desc",
      motive: "Motive",
    });

    await ProjectService.addTechItem(
      project._id,
      user._id,
      "Backend",
      { name: "Express", description: "REST API framework" }
    );

    let fetched = await ProjectService.getProjectById(project._id, user._id);
    expect(fetched.techStack).toHaveLength(1);
    expect(fetched.techStack[0].items).toHaveLength(1);
    expect(fetched.techStack[0].items[0].name).toBe("Express");

    await ProjectService.removeTechItem(
      project._id,
      user._id,
      "Backend",
      "Express"
    );

    fetched = await ProjectService.getProjectById(project._id, user._id);
    expect(fetched.techStack[0].items).toHaveLength(0);
  });

  it("should cascade delete associated entries when deleting a project", async () => {
    const project = await ProjectService.createProject({
      userId: user._id,
      name: "Delete Cascade Test",
      slug: "delete-cascade",
      description: "Desc",
      motive: "Motive",
    });

    await ProjectEntry.create({
      projectId: project._id,
      userId: user._id,
      type: "update",
      title: "Entry 1",
      content: "Content 1",
    });

    await ProjectService.deleteProject(project._id, user._id);

    await expect(
      ProjectService.getProjectById(project._id, user._id)
    ).rejects.toThrow("Project not found");

    const entries = await ProjectEntry.find({ projectId: project._id });
    expect(entries).toHaveLength(0);
  });
});
