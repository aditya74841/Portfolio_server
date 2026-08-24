import { Blog } from "./blog.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// Get all blogs for the authenticated user
// ─────────────────────────────────────────────
export const getAllBlogs = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = { owner: req.user._id };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const blogs = await Blog.find(filter).sort({ updatedAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Blogs retrieved successfully"));
});

// ─────────────────────────────────────────────
// Get single blog by ID
// ─────────────────────────────────────────────
export const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog retrieved successfully"));
});

// ─────────────────────────────────────────────
// Create new blog entry or idea
// ─────────────────────────────────────────────
export const createBlog = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    content,
    status,
    dueDate,
    tags,
    targetAudience,
    publishingChecklist,
  } = req.body;

  if (!title) {
    throw new ApiError(400, "Blog title is required");
  }

  const defaultPlatforms = [
    { platform: "Personal Portfolio", isPublished: false },
    { platform: "Dev.to", isPublished: false },
    { platform: "Medium", isPublished: false },
    { platform: "Hashnode", isPublished: false },
    { platform: "Substack", isPublished: false },
  ];

  const blog = await Blog.create({
    title,
    description: description || "",
    content: content || "",
    status: status || "idea",
    dueDate: dueDate ? new Date(dueDate) : null,
    tags: Array.isArray(tags) ? tags : [],
    targetAudience: targetAudience || "",
    publishingChecklist:
      Array.isArray(publishingChecklist) && publishingChecklist.length > 0
        ? publishingChecklist
        : defaultPlatforms,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, blog, "Blog created successfully"));
});

// ─────────────────────────────────────────────
// Update blog entry
// ─────────────────────────────────────────────
export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, content, status, dueDate, tags, targetAudience } =
    req.body;

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  if (title !== undefined) blog.title = title;
  if (description !== undefined) blog.description = description;
  if (content !== undefined) blog.content = content;
  if (status !== undefined) blog.status = status;
  if (dueDate !== undefined) blog.dueDate = dueDate ? new Date(dueDate) : null;
  if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : blog.tags;
  if (targetAudience !== undefined) blog.targetAudience = targetAudience;

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog updated successfully"));
});

// ─────────────────────────────────────────────
// Delete blog entry
// ─────────────────────────────────────────────
export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findOneAndDelete({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Blog deleted successfully"));
});

// ─────────────────────────────────────────────
// Toggle or update a platform publishing checklist item
// ─────────────────────────────────────────────
export const togglePublishingPlatform = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platformId, platformName, isPublished, publishedUrl } = req.body;

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  let platformItem = blog.publishingChecklist.id(platformId);

  if (!platformItem && platformName) {
    // Search by platform name if platformId wasn't direct
    platformItem = blog.publishingChecklist.find(
      (p) => p.platform.toLowerCase() === platformName.toLowerCase()
    );
  }

  if (platformItem) {
    if (isPublished !== undefined) {
      platformItem.isPublished = isPublished;
      platformItem.publishedAt = isPublished ? new Date() : null;
    }
    if (publishedUrl !== undefined) {
      platformItem.publishedUrl = publishedUrl;
    }
  } else if (platformName) {
    // Add new platform item if it doesn't exist yet
    blog.publishingChecklist.push({
      platform: platformName,
      isPublished: !!isPublished,
      publishedUrl: publishedUrl || "",
      publishedAt: isPublished ? new Date() : null,
    });
  }

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Publishing checklist updated"));
});

// ─────────────────────────────────────────────
// Add a custom platform to checklist
// ─────────────────────────────────────────────
export const addCustomPlatform = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platform } = req.body;

  if (!platform) {
    throw new ApiError(400, "Platform name is required");
  }

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  const exists = blog.publishingChecklist.some(
    (p) => p.platform.toLowerCase() === platform.trim().toLowerCase()
  );

  if (!exists) {
    blog.publishingChecklist.push({
      platform: platform.trim(),
      isPublished: false,
      publishedUrl: "",
    });
    await blog.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Platform added to checklist"));
});

// ─────────────────────────────────────────────
// Delete a platform from checklist
// ─────────────────────────────────────────────
export const deleteCustomPlatform = asyncHandler(async (req, res) => {
  const { id, platformId } = req.params;

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  blog.publishingChecklist = blog.publishingChecklist.filter(
    (item) => item._id.toString() !== platformId
  );

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Platform removed from checklist"));
});

// ─────────────────────────────────────────────
// Add repurposed social media micro-content to blog
// ─────────────────────────────────────────────
export const addRepurposedContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, platform, contentType, copyContent, status, dueDate, postUrl } =
    req.body;

  if (!title) {
    throw new ApiError(400, "Repurposed content title is required");
  }

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  blog.repurposedContent.push({
    title,
    platform: platform || "X (Twitter)",
    contentType: contentType || "post",
    copyContent: copyContent || "",
    status: status || "todo",
    dueDate: dueDate ? new Date(dueDate) : null,
    postUrl: postUrl || "",
  });

  await blog.save();

  return res
    .status(201)
    .json(new ApiResponse(201, blog, "Repurposed content added"));
});

// ─────────────────────────────────────────────
// Update repurposed social media micro-content
// ─────────────────────────────────────────────
export const updateRepurposedContent = asyncHandler(async (req, res) => {
  const { id, repurposeId } = req.params;
  const { title, platform, contentType, copyContent, status, dueDate, postUrl } =
    req.body;

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  const item = blog.repurposedContent.id(repurposeId);

  if (!item) {
    throw new ApiError(404, "Repurposed content item not found");
  }

  if (title !== undefined) item.title = title;
  if (platform !== undefined) item.platform = platform;
  if (contentType !== undefined) item.contentType = contentType;
  if (copyContent !== undefined) item.copyContent = copyContent;
  if (status !== undefined) item.status = status;
  if (dueDate !== undefined) item.dueDate = dueDate ? new Date(dueDate) : null;
  if (postUrl !== undefined) item.postUrl = postUrl;

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Repurposed content updated"));
});

// ─────────────────────────────────────────────
// Delete repurposed micro-content
// ─────────────────────────────────────────────
export const deleteRepurposedContent = asyncHandler(async (req, res) => {
  const { id, repurposeId } = req.params;

  const blog = await Blog.findOne({ _id: id, owner: req.user._id });

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  blog.repurposedContent = blog.repurposedContent.filter(
    (item) => item._id.toString() !== repurposeId
  );

  await blog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Repurposed content removed"));
});

// ─────────────────────────────────────────────
// Get Today's Blog & Social Action Items (Command Center view)
// ─────────────────────────────────────────────
export const getTodayBlogTasks = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ owner: req.user._id });

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todaySocialTasks = [];
  const blogsDueToday = [];
  const pendingPublishingItems = [];

  blogs.forEach((blog) => {
    // 1. Check blogs with due date <= today and not yet published
    if (
      blog.dueDate &&
      new Date(blog.dueDate) <= today &&
      blog.status !== "published"
    ) {
      blogsDueToday.push({
        blogId: blog._id,
        blogTitle: blog.title,
        status: blog.status,
        dueDate: blog.dueDate,
      });
    }

    // 2. Check repurposed social posts due <= today and not posted yet
    blog.repurposedContent.forEach((item) => {
      if (
        item.status !== "posted" &&
        (!item.dueDate || new Date(item.dueDate) <= today)
      ) {
        todaySocialTasks.push({
          blogId: blog._id,
          blogTitle: blog.title,
          repurposeId: item._id,
          title: item.title,
          platform: item.platform,
          contentType: item.contentType,
          copyContent: item.copyContent,
          status: item.status,
          dueDate: item.dueDate,
        });
      }
    });

    // 3. Check published blogs that have uncompleted checklist platforms
    if (blog.status === "written" || blog.status === "published") {
      const unpublishedPlatforms = blog.publishingChecklist.filter(
        (p) => !p.isPublished
      );
      if (unpublishedPlatforms.length > 0) {
        pendingPublishingItems.push({
          blogId: blog._id,
          blogTitle: blog.title,
          platforms: unpublishedPlatforms,
        });
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        todaySocialTasks,
        blogsDueToday,
        pendingPublishingItems,
        totalTasksCount:
          todaySocialTasks.length +
          blogsDueToday.length +
          pendingPublishingItems.length,
      },
      "Today's blog tasks fetched successfully"
    )
  );
});
