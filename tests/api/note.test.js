/**
 * API Integration Tests: Notes
 * -----------------------------
 * Full CRUD tests for the Notes API.
 * Tests authentication, create, read, update, delete, and user isolation.
 */

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

describe("Notes API", () => {
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

  // Helper: create a note and return the response
  async function createNote(token, content = "My first note") {
    return request(app)
      .post("/api/v1/notes")
      .set(authHeader(token))
      .send({ content });
  }

  // ─── Authentication ─────────────────────────────────────────────────

  describe("Authentication", () => {
    it("should return 401 for all note endpoints without a token", async () => {
      const res = await request(app).get("/api/v1/notes");
      expect(res.status).toBe(401);
    });

    it("should return 401 for POST without a token", async () => {
      const res = await request(app)
        .post("/api/v1/notes")
        .send({ content: "Unauthorized note" });
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/notes ─────────────────────────────────────────────

  describe("POST /api/v1/notes", () => {
    it("should create a new note", async () => {
      const { token } = await setupUser();

      const res = await createNote(token, "Hello world");

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe("Hello world");
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data._id).toBeDefined();
    });

    it("should reject a note with no content", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .post("/api/v1/notes")
        .set(authHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });

    it("should create multiple notes", async () => {
      const { token } = await setupUser();

      await createNote(token, "Note 1");
      await createNote(token, "Note 2");
      await createNote(token, "Note 3");

      const res = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(token));

      expect(res.body.data).toHaveLength(3);
    });
  });

  // ─── GET /api/v1/notes ──────────────────────────────────────────────

  describe("GET /api/v1/notes", () => {
    it("should return all notes for the authenticated user", async () => {
      const { token } = await setupUser();

      await createNote(token, "First note");
      await createNote(token, "Second note");

      const res = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it("should return notes sorted by updatedAt descending", async () => {
      const { token } = await setupUser();

      await createNote(token, "Older note");
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 50));
      await createNote(token, "Newer note");

      const res = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data[0].content).toBe("Newer note");
      expect(res.body.data[1].content).toBe("Older note");
    });

    it("should return empty array when user has no notes", async () => {
      const { token } = await setupUser();

      const res = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ─── PATCH /api/v1/notes/:id ────────────────────────────────────────

  describe("PATCH /api/v1/notes/:id", () => {
    it("should update note content", async () => {
      const { token } = await setupUser();
      const createRes = await createNote(token, "Original content");
      const noteId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(authHeader(token))
        .send({ content: "Updated content" });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe("Updated content");
    });

    it("should return 404 for non-existent note", async () => {
      const { token } = await setupUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .patch(`/api/v1/notes/${fakeId}`)
        .set(authHeader(token))
        .send({ content: "Doesn't exist" });

      expect(res.status).toBe(404);
    });

    it("should not update another user's note", async () => {
      const userA = await setupUser({ email: "a@notes.com" });
      const userB = await setupUser({ email: "b@notes.com" });

      const createRes = await createNote(userA.token, "A's private note");
      const noteId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(authHeader(userB.token))
        .send({ content: "B trying to edit" });

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /api/v1/notes/:id ───────────────────────────────────────

  describe("DELETE /api/v1/notes/:id", () => {
    it("should delete a note", async () => {
      const { token } = await setupUser();
      const createRes = await createNote(token, "To be deleted");
      const noteId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);

      // Verify it's gone
      const getRes = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(token));

      expect(getRes.body.data).toHaveLength(0);
    });

    it("should return 404 for non-existent note", async () => {
      const { token } = await setupUser();
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .delete(`/api/v1/notes/${fakeId}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it("should not delete another user's note", async () => {
      const userA = await setupUser({ email: "a2@notes.com" });
      const userB = await setupUser({ email: "b2@notes.com" });

      const createRes = await createNote(userA.token, "A's note");
      const noteId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set(authHeader(userB.token));

      expect(res.status).toBe(404);

      // A's note should still exist
      const getRes = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(userA.token));

      expect(getRes.body.data).toHaveLength(1);
    });
  });

  // ─── User Isolation ─────────────────────────────────────────────────

  describe("User Isolation", () => {
    it("User A should NOT see User B's notes", async () => {
      const userA = await setupUser({ email: "iso-a@notes.com" });
      const userB = await setupUser({ email: "iso-b@notes.com" });

      await createNote(userA.token, "A's secret note");
      await createNote(userB.token, "B's secret note");

      const resA = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(userA.token));

      const resB = await request(app)
        .get("/api/v1/notes")
        .set(authHeader(userB.token));

      expect(resA.body.data).toHaveLength(1);
      expect(resA.body.data[0].content).toBe("A's secret note");

      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].content).toBe("B's secret note");
    });
  });
});
