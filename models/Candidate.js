const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  coverImage: {
    type: Buffer,
    required: true,
  },
  coverImageType: {
    type: String,
    required: true,
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Voter",
    unique: true,
  },
});

candidateSchema.virtual("coverImagePath").get(function () {
  if (this.coverImage != null && this.coverImageType != null) {
    return `data: ${
      this.coverImageType
    }; charset=utf-8;base64, ${this.coverImage.toString("base64")}`;
  }
});

const Candidate = mongoose.model("Candidate", candidateSchema);
module.exports = Candidate;
