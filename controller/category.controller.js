import { Category } from "../model/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const newCategory = await Category.create({
    name,
    description,
  });

  if (!newCategory) {
    throw new ApiError(500, "Something went wrong while creating category");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newCategory, "Category created successfully"));
});

// Get All Categories
const getCategories = asyncHandler(async (req, res) => {

  const { page = 1, limit = 10, search=null } = req.query;

  // Build query object
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const categories = await Category.paginate(query, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, categories, "Categories retrieved successfully")
    );
});

// Get Category by ID
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Category ID is required");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category retrieved successfully"));
});

// Update Category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id) {
    throw new ApiError(400, "Category ID is required");
  }

  if (!name && !description) {
    throw new ApiError(
      400,
      "At least one field (name or description) is required to update"
    );
  }

  // Check if category exists
  const existingCategory = await Category.findById(id);
  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  // If name is being updated, check for duplicates
  if (name && name !== existingCategory.name) {
    const duplicateCategory = await Category.findOne({ name });
    if (duplicateCategory) {
      throw new ApiError(409, "Category with this name already exists");
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    {
      ...(name && { name }),
      ...(description && { description }),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCategory) {
    throw new ApiError(500, "Something went wrong while updating category");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

// Delete Category
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Category ID is required");
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const deletedCategory = await Category.findByIdAndDelete(id);

  if (!deletedCategory) {
    throw new ApiError(500, "Something went wrong while deleting category");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

// Get Category Count
const getCategoryCount = asyncHandler(async (req, res) => {
  const count = await Category.countDocuments();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { count }, "Category count retrieved successfully")
    );
});

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryCount,
};
