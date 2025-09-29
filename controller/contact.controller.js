import { Contact } from "../model/contact.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendContactEmail } from "../utils/mail.js";

// Create Contact
// Create Contact
const createContact = asyncHandler(async (req, res) => {
    const { name, email, description } = req.body;
  
    if (!name || !description || !email) {
      throw new ApiError(400, "Name and description are required");
    }
  
    // Capture user's IP address
    const ip =
      req.headers["x-forwarded-for"]?.split(",").shift() ||
      req.socket?.remoteAddress ||
      "Unknown";
  
    const newContact = await Contact.create({
      name,
      email,
      description,
      ip,
    });
  
    if (!newContact) {
      throw new ApiError(500, "Something went wrong while submitting contact form");
    }
  
    // Send email notification
    await sendContactEmail({
      name,
      email,
      description,
      ip,
    });
  
    return res
      .status(201)
      .json(
        new ApiResponse(201, newContact, "Contact form submitted successfully")
      );
  });
  

// Get All Contacts (with pagination + search)
const getContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = null } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { ipAddress: { $regex: search, $options: "i" } },
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const contacts = await Contact.paginate(query, options);

  return res
    .status(200)
    .json(new ApiResponse(200, contacts, "Contacts retrieved successfully"));
});

// Get Contact by ID
const getContactById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Contact ID is required");
  }

  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, contact, "Contact retrieved successfully"));
});

// Delete Contact
const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Contact ID is required");
  }

  const deletedContact = await Contact.findByIdAndDelete(id);

  if (!deletedContact) {
    throw new ApiError(404, "Contact not found or already deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Contact deleted successfully"));
});

export { createContact, getContacts, getContactById, deleteContact };
