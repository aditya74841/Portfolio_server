import express from "express";
import {
  createContact,
  getContacts,
  getContactById,
  deleteContact,
} from "../controller/contact.controller.js";

const router = express.Router();

// Routes
router.post("/", createContact);       // Create new contact
router.get("/", getContacts);          // Get all contacts (with pagination + search)
router.get("/:id", getContactById);    // Get single contact by ID
router.delete("/:id", deleteContact);  // Delete contact by ID

export default router;
