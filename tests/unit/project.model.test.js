import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Project } from "../../model/Project/project.model.js";
import { ProjectEntry } from "../../model/Project/projectEntry.model.js";

describe("Project Diary Schema Validation (Phase 1)", () => {
  it("should create a valid Project document instance", () => {
    const userId = new mongoose.Types.ObjectId();
    const project = new Project({
      userId,
      name: "Portfolio Redesign",
      slug: "portfolio-redesign",
      description: "Building personal portfolio and diary system",
      motive: "Showcase skills and development journey",
      status: "building",
      techStack: [
        {
          category: "Frontend",
          items: [{ name: "Next.js", description: "App Router & React 19" }],
        },
      ],
      githubUrl: "https://github.com/example/portfolio",
      liveUrl: "https://example.com",
    });

    const err = project.validateSync();
    expect(err).toBeUndefined();
    expect(project.name).toBe("Portfolio Redesign");
    expect(project.slug).toBe("portfolio-redesign");
    expect(project.status).toBe("building");
    expect(project.techStack).toHaveLength(1);
    expect(project.techStack[0].category).toBe("Frontend");
    expect(project.techStack[0].items[0].name).toBe("Next.js");
  });

  it("should fail validation if required fields are missing in Project", () => {
    const project = new Project({});
    const err = project.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.slug).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.motive).toBeDefined();
  });

  it("should enforce enum for Project status", () => {
    const project = new Project({
      userId: new mongoose.Types.ObjectId(),
      name: "Test Project",
      slug: "test-project",
      description: "Test description",
      motive: "Test motive",
      status: "invalid_status",
    });
    const err = project.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });

  it("should create a valid ProjectEntry document instance", () => {
    const projectId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const entry = new ProjectEntry({
      projectId,
      userId,
      type: "learning",
      title: "Optimized Database Schemas",
      content: "Implemented compound indexes for efficient querying",
      isPublic: true,
      tags: ["mongodb", "mongoose", "indexing"],
    });

    const err = entry.validateSync();
    expect(err).toBeUndefined();
    expect(entry.type).toBe("learning");
    expect(entry.isPublic).toBe(true);
    expect(entry.tags).toEqual(["mongodb", "mongoose", "indexing"]);
  });

  it("should enforce enum for ProjectEntry type", () => {
    const entry = new ProjectEntry({
      projectId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      type: "invalid_type",
      title: "Test Entry",
      content: "Test Content",
    });

    const err = entry.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.type).toBeDefined();
  });
});
