const mongoose = require("mongoose");
const axios = require("axios");

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },

  setTime: {
    type: Date,
    required: false,
  },

  ElectionEndDate: {
    type: Date,
    required: false,
  },

  role: {
    type: String,
    default: "admin",
    required: true,
  },

  dob: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
