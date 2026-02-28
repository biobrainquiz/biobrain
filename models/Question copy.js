const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    qno: {
      type: Number,
      required: true
    },

    question: {
      type: String,
      required: true,
      trim: true
    },

    opt1: {
      type: String,
      required: true,
      trim: true
    },

    opt2: {
      type: String,
      required: true,
      trim: true
    },

    opt3: {
      type: String,
      required: true,
      trim: true
    },

    opt4: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ Answer stored as option number (1–4)
    answer: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },

    difficulty_level: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"]
    },

    marks: {
      type: Number,
      required: true,
      min: 1
    },

    exam: {
      type: String,
      required: true,
      default: "gate"
    },
    
    subject: {
      type: String,
      required: true,
      default: "zoology"

    },
    unit: {
      type: String,
      required: true,
      default: "zoology"

    },
    chapter: {
      type: String,
      required: true,
      default: "zoology"

    },
    
  },
  {
    collection: "mcqs",   // 🔥 Ensures it uses existing mcqs collection
    timestamps: true      // Adds createdAt & updatedAt automatically
  }
);


module.exports = mongoose.model("Question", questionSchema);