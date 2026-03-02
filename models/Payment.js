const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // 👤 User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 💰 Amount in paise
    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    // 🧾 Razorpay Details
    razorpayOrderId: {
      type: String,
      required: true
    },

    razorpayPaymentId: {
      type: String
    },

    razorpaySignature: {
      type: String
    },

    // 📦 What Payment Is For
    paymentFor: {
      type: String,
      enum: ["quiz", "subscription", "exam_access"],
      default: "quiz"
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam"
    },

    // 📊 Status
    status: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created"
    },

    // 🌐 Payment Method
    method: {
      type: String
    },

    // 🧾 Accounting Fields
    paidAt: {
      type: Date
    },

    receiptNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    // Extra metadata
    notes: {
      type: Object
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);