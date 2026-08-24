import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import {
  connectTestDB,
  clearDatabase,
  createTestUser,
  getAuthToken,
  authHeader,
} from "../helpers.js";

describe("Project Diary API Integration Tests", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  async function setupUser(overrides = {}) {
    const user = await createTestUser(overrides);
    const token = getAuthToken(user);
    return { user, token };
  }

  // ---------------------------------------------------
  // 1. Authentication Check
  // ---------------------------------------------------
  describe("Authentication", () => {
    it("should return 401 for project diary routes without token", async () => {
      const res = await request(app).get("/api/v1/project-diary");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------
  // 2. Project Endpoints
  // ---------------------------------------------------
  describe("Project CRUD & Actions", () => {
    it("should create a new project via POST /api/v1/project-diary", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Kobys POS",
          slug: "kobys-pos",
          description: "Point of sale system",
          motive: "Modernize retail sales",
          status: "building",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Kobys POS");
      expect(res.body.data.slug).toBe("kobys-pos");
      expect(res.body.data.status).toBe("building");
    });

    it("should return 409 for duplicate slug", async () => {
      const { token } = await setupUser();

      await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Project 1",
          slug: "project-1",
          description: "Desc",
          motive: "Motive",
        });

      const res = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Project 1 Duplicate",
          slug: "project-1",
          description: "Desc 2",
          motive: "Motive 2",
        });

      expect(res.status).toBe(409);
    });

    it("should fetch projects list via GET /api/v1/project-diary", async () => {
      const { token } = await setupUser();

      await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Project 1",
          slug: "project-1",
          description: "Desc",
          motive: "Motive",
        });

      const res = await request(app)
        .get("/api/v1/project-diary")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.docs).toHaveLength(1);
    });

    it("should fetch project by slug", async () => {
      const { token } = await setupUser();

      await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "By Slug",
          slug: "by-slug",
          description: "Desc",
          motive: "Motive",
        });

      const res = await request(app)
        .get("/api/v1/project-diary/slug/by-slug")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("By Slug");
    });

    it("should update project status", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Status App",
          slug: "status-app",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/project-diary/${projectId}/status`)
        .set(authHeader(token))
        .send({ status: "deployed" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("deployed");
    });

    it("should add and remove tech category and tech items", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Tech App",
          slug: "tech-app",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = createRes.body.data._id;

      // Add Category
      const catRes = await request(app)
        .post(`/api/v1/project-diary/${projectId}/tech-categories`)
        .set(authHeader(token))
        .send({ category: "Frontend" });

      expect(catRes.status).toBe(200);
      expect(catRes.body.data.techStack).toHaveLength(1);

      // Add Tech Item
      const itemRes = await request(app)
        .post(`/api/v1/project-diary/${projectId}/tech-items`)
        .set(authHeader(token))
        .send({ category: "Frontend", item: { name: "Next.js", description: "SSR Framework" } });

      expect(itemRes.status).toBe(200);
      expect(itemRes.body.data.techStack[0].items[0].name).toBe("Next.js");

      // Remove Tech Item
      const delItemRes = await request(app)
        .delete(`/api/v1/project-diary/${projectId}/tech-items`)
        .set(authHeader(token))
        .send({ category: "Frontend", itemName: "Next.js" });

      expect(delItemRes.status).toBe(200);
      expect(delItemRes.body.data.techStack[0].items).toHaveLength(0);
    });

    it("should delete a project", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Delete Me",
          slug: "delete-me",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/project-diary/${projectId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/project-diary/${projectId}`)
        .set(authHeader(token));

      expect(getRes.status).toBe(404);
    });
  });

  // ---------------------------------------------------
  // 3. Project Timeline Entry Endpoints
  // ---------------------------------------------------
  describe("Project Entry Operations", () => {
    it("should create and fetch entries for a project", async () => {
      const { token } = await setupUser();

      const projectRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Timeline App",
          slug: "timeline-app",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = projectRes.body.data._id;

      const entryRes = await request(app)
        .post(`/api/v1/project-diary/${projectId}/entries`)
        .set(authHeader(token))
        .send({
          type: "milestone",
          title: "Setup Complete",
          content: "Environment and models set up",
          isPublic: true,
          tags: ["setup", "milestone"],
        });

      expect(entryRes.status).toBe(201);
      expect(entryRes.body.data.title).toBe("Setup Complete");

      const getEntriesRes = await request(app)
        .get(`/api/v1/project-diary/${projectId}/entries`)
        .set(authHeader(token));

      expect(getEntriesRes.status).toBe(200);
      expect(getEntriesRes.body.data.docs).toHaveLength(1);
    });

    it("should toggle entry visibility status", async () => {
      const { token } = await setupUser();

      const projectRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Visibility App",
          slug: "visibility-app",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = projectRes.body.data._id;

      const entryRes = await request(app)
        .post(`/api/v1/project-diary/${projectId}/entries`)
        .set(authHeader(token))
        .send({
          type: "update",
          title: "Private Note",
          content: "Internal notes",
          isPublic: false,
        });

      const entryId = entryRes.body.data._id;

      const visRes = await request(app)
        .patch(`/api/v1/project-diary/entries/${entryId}/visibility`)
        .set(authHeader(token))
        .send({ isPublic: true });

      expect(visRes.status).toBe(200);
      expect(visRes.body.data.isPublic).toBe(true);
    });

    it("should add and remove tags on entry", async () => {
      const { token } = await setupUser();

      const projectRes = await request(app)
        .post("/api/v1/project-diary")
        .set(authHeader(token))
        .send({
          name: "Tag App",
          slug: "tag-app",
          description: "Desc",
          motive: "Motive",
        });

      const projectId = projectRes.body.data._id;

      const entryRes = await request(app)
        .post(`/api/v1/project-diary/${projectId}/entries`)
        .set(authHeader(token))
        .send({
          type: "learning",
          title: "Learning Mongo",
          content: "Learned indexing",
          tags: ["mongo"],
        });

      const entryId = entryRes.body.data._id;

      // Add tags
      const addTagsRes = await request(app)
        .post(`/api/v1/project-diary/entries/${entryId}/tags`)
        .set(authHeader(token))
        .send({ tags: ["indexing", "performance"] });

      expect(addTagsRes.status).toBe(200);
      expect(addTagsRes.body.data.tags.sort()).toEqual(["mongo", "indexing", "performance"].sort());

      // Remove tag
      const delTagRes = await request(app)
        .delete(`/api/v1/project-diary/entries/${entryId}/tags`)
        .set(authHeader(token))
        .send({ tag: "performance" });

      expect(delTagRes.status).toBe(200);
      expect(delTagRes.body.data.tags.sort()).toEqual(["mongo", "indexing"].sort());
    });
  });
});
