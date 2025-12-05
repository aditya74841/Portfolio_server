// import mongoose, { Schema } from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";

// const streakSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: "",
//       trim: true,
//       maxlength: [500, "Description cannot exceed 500 characters"],
//     },
//     streakNumber: [
//       {
//         value: {
//           type: Number,
//           required: true,
//           min: [0, "Streak value cannot be negative"],
//         },
//         completed: {
//           type: Boolean,
//           default: false,
//         },
//         completedAt: {
//           type: Date,
//         },
//       },
//     ],
//     currentStreak: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     longestStreak: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     lastCompletedDate: {
//       type: Date,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//       index: true,
//     },
//   },
//   { 
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Index for performance
// streakSchema.index({ createdAt: -1 });
// streakSchema.index({ isActive: 1 });

// // Virtual for completion rate
// streakSchema.virtual('completionRate').get(function() {
//   if (this.streakNumber.length === 0) return 0;
//   const completed = this.streakNumber.filter(s => s.completed).length;
//   return Math.round((completed / this.streakNumber.length) * 100);
// });

// // Helper function to check if date is today
// streakSchema.methods.isToday = function(date) {
//   if (!date) return false;
//   const today = new Date();
//   const compareDate = new Date(date);
//   return (
//     compareDate.getDate() === today.getDate() &&
//     compareDate.getMonth() === today.getMonth() &&
//     compareDate.getFullYear() === today.getFullYear()
//   );
// };

// // Helper function to check if date is yesterday
// streakSchema.methods.isYesterday = function(date) {
//   if (!date) return false;
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const compareDate = new Date(date);
//   return (
//     compareDate.getDate() === yesterday.getDate() &&
//     compareDate.getMonth() === yesterday.getMonth() &&
//     compareDate.getFullYear() === yesterday.getFullYear()
//   );
// };

// // Updated markComplete method with daily restrictions
// streakSchema.methods.markComplete = function(streakValue) {
//   // Check if already completed today
//   // if (this.lastCompletedDate && this.isToday(this.lastCompletedDate)) {
//   //   throw new Error("You have already completed a streak today. Come back tomorrow!");
//   // }

//   // Check if the streak value is the next expected one
//   const expectedValue = this.currentStreak + 1;
//   if (streakValue !== expectedValue) {
//     throw new Error(`You must complete streak ${expectedValue} next`);
//   }

//   // Find the streak number entry
//   const streak = this.streakNumber.find(s => s.value === streakValue);
//   if (!streak) {
//     throw new Error("Invalid streak value");
//   }

//   if (streak.completed) {
//     throw new Error("This streak is already completed");
//   }

//   // Check if streak should be reset (missed a day)
//   if (this.lastCompletedDate && !this.isYesterday(this.lastCompletedDate) && !this.isToday(this.lastCompletedDate)) {
//     // More than 1 day gap - reset streak but keep the history
//     this.currentStreak = 0;
//   }

//   // Mark as complete
//   streak.completed = true;
//   streak.completedAt = new Date();
//   this.lastCompletedDate = new Date();
//   this.currentStreak++;
  
//   // Update longest streak
//   if (this.currentStreak > this.longestStreak) {
//     this.longestStreak = this.currentStreak;
//   }

//   return this.save();
// };

// // Reset current streak
// streakSchema.methods.resetStreak = function() {
//   this.currentStreak = 0;
//   return this.save();
// };

// // Disable auto-indexing in production
// streakSchema.set('autoIndex', process.env.NODE_ENV !== 'production');

// streakSchema.plugin(mongoosePaginate);

// export const Streak = mongoose.model("Streak", streakSchema);



import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const streakSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    streakNumber: [
      {
        value: {
          type: Number,
          required: true,
          min: [0, "Streak value cannot be negative"],
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
      },
    ],
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCompletedDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for performance
streakSchema.index({ createdAt: -1 });
streakSchema.index({ isActive: 1 });

// Virtual for completion rate
streakSchema.virtual('completionRate').get(function() {
  if (this.streakNumber.length === 0) return 0;
  const completed = this.streakNumber.filter(s => s.completed).length;
  return Math.round((completed / this.streakNumber.length) * 100);
});

// Helper function to check if date is today
streakSchema.methods.isToday = function(date) {
  if (!date) return false;
  const today = new Date();
  const compareDate = new Date(date);
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
};

// Helper function to check if date is yesterday
streakSchema.methods.isYesterday = function(date) {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const compareDate = new Date(date);
  return (
    compareDate.getDate() === yesterday.getDate() &&
    compareDate.getMonth() === yesterday.getMonth() &&
    compareDate.getFullYear() === yesterday.getFullYear()
  );
};

// Updated markComplete method with daily restrictions
streakSchema.methods.markComplete = function(streakValue) {
  // Check if already completed today
  // if (this.lastCompletedDate && this.isToday(this.lastCompletedDate)) {
  //   throw new Error("You have already completed a streak today. Come back tomorrow!");
  // }

  // Check if the streak value is the next expected one
  const expectedValue = this.currentStreak + 1;
  if (streakValue !== expectedValue) {
    throw new Error(`You must complete streak ${expectedValue} next`);
  }

  // Find the streak number entry
  const streak = this.streakNumber.find(s => s.value === streakValue);
  if (!streak) {
    throw new Error("Invalid streak value");
  }

  if (streak.completed) {
    throw new Error("This streak is already completed");
  }

  // Check if streak should be reset (missed a day)
  if (this.lastCompletedDate && !this.isYesterday(this.lastCompletedDate) && !this.isToday(this.lastCompletedDate)) {
    // More than 1 day gap - reset streak but keep the history
    this.currentStreak = 0;
  }

  // Mark as complete
  streak.completed = true;
  streak.completedAt = new Date();
  this.lastCompletedDate = new Date();
  this.currentStreak++;
  
  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  return this.save();
};

// Reset current streak
streakSchema.methods.resetStreak = function() {
  this.currentStreak = 0;
  return this.save();
};

// Disable auto-indexing in production
streakSchema.set('autoIndex', process.env.NODE_ENV !== 'production');

streakSchema.plugin(mongoosePaginate);

export const Streak = mongoose.model("Streak", streakSchema);
