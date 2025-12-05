
import { Streak } from "../model/streak.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// -----------------------------
// CREATE STREAK
// -----------------------------
const createStreak = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) throw new ApiError(400, "Name is required");

  // Check for duplicates
  const existing = await Streak.findOne({ name });
  if (existing) throw new ApiError(409, "Streak with this name already exists");

  const streak = await Streak.create({ name, description });
  return res
    .status(201)
    .json(new ApiResponse(201, streak, "Streak created successfully"));
});

// -----------------------------
// GET ALL STREAKS
// -----------------------------
const getStreaks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) query.isActive = isActive === "true";

  const streaks = await Streak.paginate(query, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, streaks, "Streaks retrieved successfully"));
});

// -----------------------------
// GET STREAK BY ID
// -----------------------------
const getStreakById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findById(id);
  if (!streak) throw new ApiError(404, "Streak not found");

  return res
    .status(200)
    .json(new ApiResponse(200, streak, "Streak retrieved successfully"));
});

// -----------------------------
// MARK STREAK COMPLETE (TODAY)
// -----------------------------
const markStreakComplete = asyncHandler(async (req, res) => {
  console.log("dfjhksdbfk")
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findById(id);
  if (!streak) throw new ApiError(404, "Streak not found");
  if (!streak.isActive) throw new ApiError(400, "This streak is not active");

  try {
    // Just call the model method — no streakValue needed now
    await streak.markComplete();

    return res
      .status(200)
      .json(new ApiResponse(200, streak, "Streak marked as complete for today"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

// -----------------------------
// CHECK IF STREAK CAN BE COMPLETED TODAY
// -----------------------------
const canCompleteToday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findById(id);
  if (!streak) throw new ApiError(404, "Streak not found");

  const canComplete =
    !streak.lastCompletedDate || !streak.isToday(streak.lastCompletedDate);

  return res.status(200).json(
    new ApiResponse(200, {
      canComplete,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastCompletedDate: streak.lastCompletedDate,
      message: canComplete
        ? "You can complete your streak today!"
        : "Already completed today. Come back tomorrow!",
    })
  );
});

// -----------------------------
// RESET CURRENT STREAK
// -----------------------------
const resetCurrentStreak = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findById(id);
  if (!streak) throw new ApiError(404, "Streak not found");

  await streak.resetStreak();

  return res
    .status(200)
    .json(new ApiResponse(200, streak, "Streak reset successfully"));
});

// -----------------------------
// GET STREAK STATISTICS
// -----------------------------
const getStreakStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Streak ID is required");

  const streak = await Streak.findById(id);
  if (!streak) throw new ApiError(404, "Streak not found");

  const totalDays = streak.days.length;
  const completedDays = streak.days.filter((d) => d.completed).length;

  const stats = {
    name: streak.name,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    completionRate: streak.completionRate,
    totalDays,
    completedDays,
    lastCompletedDate: streak.lastCompletedDate,
    isActive: streak.isActive,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Streak statistics retrieved successfully"));
});

export {
  createStreak,
  getStreaks,
  getStreakById,
  markStreakComplete,
  canCompleteToday,
  resetCurrentStreak,
  getStreakStats,
};



// import { Streak } from "../model/streak.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// // Create Streak with Auto-Generated Streak Numbers
// const createStreak = asyncHandler(async (req, res) => {
//   const { name, description, count = 30 } = req.body;

//   if (!name) {
//     throw new ApiError(400, "Name is required");
//   }

//   if (count <= 0) {
//     throw new ApiError(400, "Count must be greater than 0");
//   }

//   // Check if streak with same name already exists
//   const existingStreak = await Streak.findOne({ name });
//   if (existingStreak) {
//     throw new ApiError(409, "Streak with this name already exists");
//   }

//   // Auto-generate streak numbers from 1 to count
//   const streakNumbers = Array.from({ length: count }, (_, index) => ({
//     value: index + 1,
//     completed: false,
//   }));

//   const newStreak = await Streak.create({
//     name,
//     description,
//     streakNumber: streakNumbers,
//   });

//   if (!newStreak) {
//     throw new ApiError(500, "Something went wrong while creating streak");
//   }

//   return res
//     .status(201)
//     .json(new ApiResponse(201, newStreak, "Streak created successfully"));
// });

// // Get All Streaks
// const getStreaks = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, search = null, isActive = null } = req.query;

//   // Build query object
//   const query = {};
  
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { description: { $regex: search, $options: "i" } },
//     ];
//   }

//   if (isActive !== null) {
//     query.isActive = isActive === "true";
//   }

//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort: { createdAt: -1 },
//   };

//   const streaks = await Streak.paginate(query, options);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, streaks, "Streaks retrieved successfully"));
// });

// // Get Streak by ID
// const getStreakById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   const streak = await Streak.findById(id);

//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, streak, "Streak retrieved successfully"));
// });

// // Update Streak
// const updateStreak = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { name, description, isActive } = req.body;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   if (!name && !description && isActive === undefined) {
//     throw new ApiError(
//       400,
//       "At least one field (name, description, or isActive) is required to update"
//     );
//   }

//   // Check if streak exists
//   const existingStreak = await Streak.findById(id);
//   if (!existingStreak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   // If name is being updated, check for duplicates
//   if (name && name !== existingStreak.name) {
//     const duplicateStreak = await Streak.findOne({ name });
//     if (duplicateStreak) {
//       throw new ApiError(409, "Streak with this name already exists");
//     }
//   }

//   const updatedStreak = await Streak.findByIdAndUpdate(
//     id,
//     {
//       ...(name && { name }),
//       ...(description !== undefined && { description }),
//       ...(isActive !== undefined && { isActive }),
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );

//   if (!updatedStreak) {
//     throw new ApiError(500, "Something went wrong while updating streak");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedStreak, "Streak updated successfully"));
// });

// // Delete Streak
// const deleteStreak = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   const deletedStreak = await Streak.findByIdAndDelete(id);

//   if (!deletedStreak) {
//     throw new ApiError(500, "Something went wrong while deleting streak");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Streak deleted successfully"));
// });

// // Mark Streak Number as Complete (Daily - UPDATED)
// const markStreakComplete = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { streakValue } = req.body;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   if (streakValue === undefined || streakValue === null) {
//     throw new ApiError(400, "Streak value is required");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   if (!streak.isActive) {
//     throw new ApiError(400, "This streak is not active");
//   }

//   try {
//     await streak.markComplete(streakValue);
    
//     return res
//       .status(200)
//       .json(new ApiResponse(200, streak, "Streak marked as complete for today"));
//   } catch (error) {
//     throw new ApiError(400, error.message);
//   }
// });

// // Reset Current Streak
// const resetCurrentStreak = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   await streak.resetStreak();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, streak, "Streak reset successfully"));
// });

// // Add More Streak Numbers (Increment)
// const incrementStreakNumbers = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { count } = req.body;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   if (!count || count <= 0) {
//     throw new ApiError(400, "Count must be a positive number");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   // Get the current maximum value in streakNumber array
//   const currentMaxValue = streak.streakNumber.length > 0
//     ? Math.max(...streak.streakNumber.map(s => s.value))
//     : 0;

//   // Generate new streak numbers starting from currentMaxValue + 1
//   const newStreakNumbers = Array.from({ length: count }, (_, index) => ({
//     value: currentMaxValue + index + 1,
//     completed: false,
//   }));

//   // Add new streak numbers to the existing array
//   streak.streakNumber.push(...newStreakNumbers);
//   await streak.save();

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         streak,
//         `${count} streak numbers added successfully. New total: ${streak.streakNumber.length}`
//       )
//     );
// });

// // Get Streak Statistics
// const getStreakStats = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   const stats = {
//     name: streak.name,
//     currentStreak: streak.currentStreak,
//     longestStreak: streak.longestStreak,
//     completionRate: streak.completionRate,
//     totalStreaks: streak.streakNumber.length,
//     completedStreaks: streak.streakNumber.filter((s) => s.completed).length,
//     lastCompletedDate: streak.lastCompletedDate,
//     isActive: streak.isActive,
//   };

//   return res
//     .status(200)
//     .json(new ApiResponse(200, stats, "Streak statistics retrieved successfully"));
// });

// // Get Streak Count
// const getStreakCount = asyncHandler(async (req, res) => {
//   const { isActive } = req.query;
  
//   const query = {};
//   if (isActive !== undefined) {
//     query.isActive = isActive === "true";
//   }

//   const count = await Streak.countDocuments(query);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, { count }, "Streak count retrieved successfully")
//     );
// });

// // Check if user can complete streak today (NEW)
// const canCompleteToday = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     throw new ApiError(400, "Streak ID is required");
//   }

//   const streak = await Streak.findById(id);
//   if (!streak) {
//     throw new ApiError(404, "Streak not found");
//   }

//   const canComplete = !streak.lastCompletedDate || !streak.isToday(streak.lastCompletedDate);
//   const nextStreakValue = streak.currentStreak + 1;
//   const hasMoreStreaks = nextStreakValue <= streak.streakNumber.length;

//   return res.status(200).json(
//     new ApiResponse(200, {
//       canComplete: canComplete && hasMoreStreaks,
//       nextStreakValue: hasMoreStreaks ? nextStreakValue : null,
//       lastCompletedDate: streak.lastCompletedDate,
//       currentStreak: streak.currentStreak,
//       message: !canComplete 
//         ? "Already completed today. Come back tomorrow!" 
//         : !hasMoreStreaks 
//         ? "All streaks completed! Congratulations!" 
//         : `Ready to complete streak ${nextStreakValue}`
//     }, "Streak status retrieved successfully")
//   );
// });

// export {
//   createStreak,
//   getStreaks,
//   getStreakById,
//   updateStreak,
//   deleteStreak,
//   markStreakComplete,
//   resetCurrentStreak,
//   incrementStreakNumbers,
//   getStreakStats,
//   getStreakCount,
//   canCompleteToday,
// };
