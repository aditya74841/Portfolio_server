/**
 * API Integration Tests: Todo
 * ----------------------------
 * Full CRUD tests for the Todo API, including sub-todos.
 * Also tests USER ISOLATION — User A cannot see or modify User B's todos.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import {
  connectTestDB,
  clearDatabase,
  createTestUser,
  getAuthToken,
  authHeader,
} from "../helpers.js";

describe("Todo API", () => {
  let user, token;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  // Note: no afterAll disconnect — global teardown handles it

  /**
   * Helper: create a user + token before each test that needs them.
   * We do this as a function (not beforeEach) because some tests
   * need TWO users to test isolation.
   */
  async function setupUser(overrides = {}) {
    const u = await createTestUser(overrides);
    const t = getAuthToken(u);
    return { user: u, token: t };
  }

  // ─── Authentication Required ────────────────────────────────────────

  describe("Authentication", () => {
    it("should return 401 for all todo endpoints without a token", async () => {
      const res = await request(app).get("/api/v1/todo");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/todo ──────────────────────────────────────────────

  describe("POST /api/v1/todo", () => {
    it("should create a new todo", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Learn Testing", priority: "high" });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Learn Testing");
      expect(res.body.data.priority).toBe("high");
      expect(res.body.data.isCompleted).toBe(false);
    });

    it("should reject a todo without a title", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ description: "No title here" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Title");
    });

    it("should default priority to 'medium'", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Default Priority Todo" });

      expect(res.status).toBe(201);
      expect(res.body.data.priority).toBe("medium");
    });
  });

  // ─── GET /api/v1/todo ───────────────────────────────────────────────

  describe("GET /api/v1/todo", () => {
    it("should return all todos for the authenticated user", async () => {
      const { token } = await setupUser();

      // Create 3 todos
      await request(app).post("/api/v1/todo").set(authHeader(token)).send({ title: "Todo 1" });
      await request(app).post("/api/v1/todo").set(authHeader(token)).send({ title: "Todo 2" });
      await request(app).post("/api/v1/todo").set(authHeader(token)).send({ title: "Todo 3" });

      const res = await request(app).get("/api/v1/todo").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it("should return empty array when user has no todos", async () => {
      const { token } = await setupUser();

      const res = await request(app).get("/api/v1/todo").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ─── GET /api/v1/todo/:id ──────────────────────────────────────────

  describe("GET /api/v1/todo/:id", () => {
    it("should return a single todo by ID", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Specific Todo" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/todo/${todoId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Specific Todo");
    });

    it("should return 404 for non-existent todo ID", async () => {
      const { token } = await setupUser();
      const fakeId = "507f1f77bcf86cd799439011"; // valid ObjectId format, but doesn't exist

      const res = await request(app)
        .get(`/api/v1/todo/${fakeId}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/v1/todo/:id ─────────────────────────────────────────

  describe("PATCH /api/v1/todo/:id", () => {
    it("should update a todo's title", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Original Title" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/todo/${todoId}`)
        .set(authHeader(token))
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });
  });

  // ─── PATCH /api/v1/todo/:id/toggle ──────────────────────────────────

  describe("PATCH /api/v1/todo/:id/toggle", () => {
    it("should toggle isCompleted from false to true", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Toggle Me" });

      const todoId = createRes.body.data._id;
      expect(createRes.body.data.isCompleted).toBe(false);

      const res = await request(app)
        .patch(`/api/v1/todo/${todoId}/toggle`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.isCompleted).toBe(true);
    });

    it("should toggle isCompleted back to false", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Toggle Twice" });

      const todoId = createRes.body.data._id;

      // Toggle to true
      await request(app).patch(`/api/v1/todo/${todoId}/toggle`).set(authHeader(token));
      // Toggle back to false
      const res = await request(app).patch(`/api/v1/todo/${todoId}/toggle`).set(authHeader(token));

      expect(res.body.data.isCompleted).toBe(false);
    });
  });

  // ─── PATCH /api/v1/todo/:id/priority ────────────────────────────────

  describe("PATCH /api/v1/todo/:id/priority", () => {
    it("should change priority to 'high'", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Priority Test" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/todo/${todoId}/priority`)
        .set(authHeader(token))
        .send({ priority: "high" });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe("high");
    });

    it("should reject invalid priority values", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Invalid Priority" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/todo/${todoId}/priority`)
        .set(authHeader(token))
        .send({ priority: "urgent" }); // not in ["low", "medium", "high"]

      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /api/v1/todo/:id ────────────────────────────────────────

  describe("DELETE /api/v1/todo/:id", () => {
    it("should delete a todo", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Delete Me" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/todo/${todoId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);

      // Verify it's actually gone
      const getRes = await request(app)
        .get(`/api/v1/todo/${todoId}`)
        .set(authHeader(token));

      expect(getRes.status).toBe(404);
    });
  });

  // ─── User Isolation ─────────────────────────────────────────────────

  describe("User Isolation", () => {
    it("User A should NOT be able to see User B's todos", async () => {
      const userA = await setupUser({ email: "a@example.com" });
      const userB = await setupUser({ email: "b@example.com" });

      // User A creates a todo
      await request(app)
        .post("/api/v1/todo")
        .set(authHeader(userA.token))
        .send({ title: "User A's private todo" });

      // User B tries to list todos — should see NONE
      const res = await request(app)
        .get("/api/v1/todo")
        .set(authHeader(userB.token));

      expect(res.body.data).toHaveLength(0);
    });

    it("User A should NOT be able to delete User B's todo", async () => {
      const userA = await setupUser({ email: "a2@example.com" });
      const userB = await setupUser({ email: "b2@example.com" });

      // User B creates a todo
      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(userB.token))
        .send({ title: "User B's todo" });

      const todoId = createRes.body.data._id;

      // User A tries to delete it — should get 404 (not found for this user)
      const res = await request(app)
        .delete(`/api/v1/todo/${todoId}`)
        .set(authHeader(userA.token));

      expect(res.status).toBe(404);
    });
  });

  // ─── Sub-Todos ──────────────────────────────────────────────────────

  describe("Sub-Todos", () => {
    it("should add a sub-todo to a todo", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Parent Todo" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .post(`/api/v1/todo/${todoId}/subtodos`)
        .set(authHeader(token))
        .send({ title: "Sub-task 1" });

      expect(res.status).toBe(200);
      expect(res.body.data.subTodos).toHaveLength(1);
      expect(res.body.data.subTodos[0].title).toBe("Sub-task 1");
    });

    it("should toggle a sub-todo's completion", async () => {
      const { token } = await setupUser();

      // Create parent todo
      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Parent" });

      const todoId = createRes.body.data._id;

      // Add sub-todo
      const subRes = await request(app)
        .post(`/api/v1/todo/${todoId}/subtodos`)
        .set(authHeader(token))
        .send({ title: "Sub-task" });

      const subTodoId = subRes.body.data.subTodos[0]._id;

      // Toggle it
      const res = await request(app)
        .patch(`/api/v1/todo/${todoId}/subtodos/${subTodoId}/toggle`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      const toggledSub = res.body.data.subTodos.find((s) => s._id === subTodoId);
      expect(toggledSub.isCompleted).toBe(true);
    });

    it("should delete a sub-todo", async () => {
      const { token } = await setupUser();

      // Create parent + sub-todo
      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Parent" });

      const todoId = createRes.body.data._id;

      const subRes = await request(app)
        .post(`/api/v1/todo/${todoId}/subtodos`)
        .set(authHeader(token))
        .send({ title: "To Delete" });

      const subTodoId = subRes.body.data.subTodos[0]._id;

      // Delete the sub-todo
      const res = await request(app)
        .delete(`/api/v1/todo/${todoId}/subtodos/${subTodoId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.subTodos).toHaveLength(0);
    });

    it("should reject sub-todo without a title", async () => {
      const { token } = await setupUser();

      const createRes = await request(app)
        .post("/api/v1/todo")
        .set(authHeader(token))
        .send({ title: "Parent" });

      const todoId = createRes.body.data._id;

      const res = await request(app)
        .post(`/api/v1/todo/${todoId}/subtodos`)
        .set(authHeader(token))
        .send({ description: "no title" });

      expect(res.status).toBe(400);
    });
  });
});
