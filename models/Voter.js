const mongoose = require("mongoose");
const axios = require("axios");

const voterSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: false,
  },
  INDEX: {
    type: String,
    required: true,
    unique: true,
  },
  Voted: {
    type: Boolean,
    default: false,
    required: true,
  },
  department: {
    type: String,
    default: "ICT",
  },
  password: {
    type: String,
    required: true,
  },
});

const Voter = mongoose.model("Voter", voterSchema);

module.exports = Voter;
