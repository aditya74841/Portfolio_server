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

describe("Blog Management & Command Center API", () => {
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

  // ─── 1. Authentication ──────────────────────────────────────────────
  describe("Authentication & Authorization", () => {
    it("should return 401 Unauthorized without token", async () => {
      const res = await request(app).get("/api/v1/blog");
      expect(res.status).toBe(401);
    });

    it("should return 401 for POST without token", async () => {
      const res = await request(app)
        .post("/api/v1/blog")
        .send({ title: "Unauthorized Blog" });
      expect(res.status).toBe(401);
    });
  });

  // ─── 2. Create Blog / Idea ───────────────────────────────────────────
  describe("POST /api/v1/blog", () => {
    it("should create a blog idea with default platform checklist", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({
          title: "Understanding Clickjacking",
          description: "A deep dive into security headers and iFrames",
          status: "idea",
          dueDate: "2026-09-01",
          tags: ["security", "web"],
        });

      expect(res.status).toBe(201);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.title).toBe("Understanding Clickjacking");
      expect(res.body.data.status).toBe("idea");
      expect(res.body.data.publishingChecklist).toHaveLength(5);
    });

    it("should reject creation with missing or empty title", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({
          description: "Missing title",
        });

      expect(res.status).toBe(400);
    });

    it("should reject creation with invalid status", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({
          title: "Test Blog",
          status: "invalid_status_type",
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── 3. Read Blogs ──────────────────────────────────────────────────
  describe("GET /api/v1/blog", () => {
    it("should list all blogs for authenticated user", async () => {
      const { token } = await setupUser();

      await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Blog 1" });

      await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Blog 2" });

      const res = await request(app)
        .get("/api/v1/blog")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it("should filter blogs by status", async () => {
      const { token } = await setupUser();

      await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Idea Blog", status: "idea" });

      await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Published Blog", status: "published" });

      const res = await request(app)
        .get("/api/v1/blog?status=published")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Published Blog");
    });

    it("should get single blog by ID", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Specific Blog" });

      const blogId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/blog/${blogId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Specific Blog");
    });
  });

  // ─── 4. Update Blog ─────────────────────────────────────────────────
  describe("PUT /api/v1/blog/:id", () => {
    it("should update blog content, status, and target audience", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Original Title", status: "idea" });

      const blogId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/blog/${blogId}`)
        .set(authHeader(token))
        .send({
          title: "Updated Title",
          content: "# Markdown Content Header",
          status: "written",
          targetAudience: "Frontend Developers",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
      expect(res.body.data.content).toBe("# Markdown Content Header");
      expect(res.body.data.status).toBe("written");
      expect(res.body.data.targetAudience).toBe("Frontend Developers");
    });
  });

  // ─── 5. Delete Blog ─────────────────────────────────────────────────
  describe("DELETE /api/v1/blog/:id", () => {
    it("should delete a blog post", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Blog to delete" });

      const blogId = createRes.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/blog/${blogId}`)
        .set(authHeader(token));

      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/blog/${blogId}`)
        .set(authHeader(token));

      expect(getRes.status).toBe(404);
    });
  });

  // ─── 6. Multi-Platform Checklist ────────────────────────────────────
  describe("Publishing Platform Checklist", () => {
    it("should toggle platform isPublished status and update URL", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Checklist Blog" });

      const blog = createRes.body.data;
      const platformItem = blog.publishingChecklist[0];

      const res = await request(app)
        .patch(`/api/v1/blog/${blog._id}/checklist`)
        .set(authHeader(token))
        .send({
          platformId: platformItem._id,
          isPublished: true,
          publishedUrl: "https://medium.com/@aditya/clickjacking",
        });

      expect(res.status).toBe(200);
      const updatedPlatform = res.body.data.publishingChecklist.find(
        (p) => p._id === platformItem._id
      );
      expect(updatedPlatform.isPublished).toBe(true);
      expect(updatedPlatform.publishedUrl).toBe("https://medium.com/@aditya/clickjacking");
    });

    it("should add a new custom platform to checklist", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Custom Platform Blog" });

      const blogId = createRes.body.data._id;

      const res = await request(app)
        .post(`/api/v1/blog/${blogId}/checklist/platform`)
        .set(authHeader(token))
        .send({ platform: "Hackernoon" });

      expect(res.status).toBe(200);
      const customAdded = res.body.data.publishingChecklist.find(
        (p) => p.platform === "Hackernoon"
      );
      expect(customAdded).toBeDefined();
    });
  });

  // ─── 7. Repurposed Micro-Content ────────────────────────────────────
  describe("Repurposed Social Media Content", () => {
    it("should add and update a social media post item", async () => {
      const { token } = await setupUser();

      const createBlogRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({ title: "Repurpose Source Blog" });

      const blogId = createBlogRes.body.data._id;

      // 1. Add X Thread
      const addRes = await request(app)
        .post(`/api/v1/blog/${blogId}/repurpose`)
        .set(authHeader(token))
        .send({
          title: "X Thread: 5 Lessons on Security",
          platform: "X (Twitter)",
          contentType: "thread",
          copyContent: "1/5 Always check your x-frame-options headers...",
          dueDate: "2026-08-25",
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.repurposedContent).toHaveLength(1);
      const repurposeId = addRes.body.data.repurposedContent[0]._id;

      // 2. Update status to posted
      const updateRes = await request(app)
        .put(`/api/v1/blog/${blogId}/repurpose/${repurposeId}`)
        .set(authHeader(token))
        .send({
          status: "posted",
          postUrl: "https://x.com/aditya/status/12345",
        });

      expect(updateRes.status).toBe(200);
      const item = updateRes.body.data.repurposedContent.find(
        (r) => r._id === repurposeId
      );
      expect(item.status).toBe("posted");
      expect(item.postUrl).toBe("https://x.com/aditya/status/12345");
    });
  });

  // ─── 8. Command Center Today's Tasks ────────────────────────────────
  describe("GET /api/v1/blog/today-tasks", () => {
    it("should aggregate today's pending tasks", async () => {
      const { token } = await setupUser();

      // Create blog due today
      const blogRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(token))
        .send({
          title: "Blog Due Today",
          dueDate: new Date().toISOString(),
          status: "drafting",
        });

      const blogId = blogRes.body.data._id;

      // Add social post due today
      await request(app)
        .post(`/api/v1/blog/${blogId}/repurpose`)
        .set(authHeader(token))
        .send({
          title: "Scheduled X Post",
          platform: "X (Twitter)",
          status: "todo",
          dueDate: new Date().toISOString(),
        });

      const res = await request(app)
        .get("/api/v1/blog/today-tasks")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.totalTasksCount).toBeGreaterThan(0);
      expect(res.body.data.todaySocialTasks).toHaveLength(1);
      expect(res.body.data.blogsDueToday).toHaveLength(1);
    });
  });

  // ─── 9. User Isolation ──────────────────────────────────────────────
  describe("User Isolation", () => {
    it("should prevent User B from reading or modifying User A's blogs", async () => {
      const userA = await setupUser({ email: "usera@blog.com" });
      const userB = await setupUser({ email: "userb@blog.com" });

      const blogRes = await request(app)
        .post("/api/v1/blog")
        .set(authHeader(userA.token))
        .send({ title: "User A Private Blog" });

      const blogId = blogRes.body.data._id;

      // User B tries GET
      const getRes = await request(app)
        .get(`/api/v1/blog/${blogId}`)
        .set(authHeader(userB.token));
      expect(getRes.status).toBe(404);

      // User B tries PUT
      const putRes = await request(app)
        .put(`/api/v1/blog/${blogId}`)
        .set(authHeader(userB.token))
        .send({ title: "Hacked Title" });
      expect(putRes.status).toBe(404);

      // User B tries DELETE
      const delRes = await request(app)
        .delete(`/api/v1/blog/${blogId}`)
        .set(authHeader(userB.token));
      expect(delRes.status).toBe(404);
    });
  });
});
