const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });
const passport = require("passport");
const { ensureAuthenticated } = require("../config/auth");
const axios = require("axios");
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

router.get("/election/stats", ensureAuthenticated, async (req, res) => {
  try {
    const id = req.params._id;
    const admin = await Admin.findOne({ _id: id });
    const votersCount = await Voter.countDocuments({});
    const voted = await Voter.countDocuments({ Voted: true });
    const notVoted = await Voter.countDocuments({ Voted: false });

    const voters = { votersCount, voted, notVoted };
    res.render("election/stats", {
      title: "Node App View Election",
      admin: admin,
      voters: voters,
    });
  } catch (error) {
    console.log(error);
  }
});


router.get(
   "/election/results",
   ensureAuthenticated,
   async (req, res) => {
     try {
       const id = req.params._id;
       const president = await Candidate.find({ position: "president" });
       const secretary = await Candidate.find({ position: "secretary" });
 
       const candidates = { president, secretary };
       const admin = await Admin.findOne({ _id: id });
       res.render("election/results", {
         title: "Node App View Election",
         admin: admin,
         candidates: candidates,
       });
     } catch (error) {
       console.log(error);
     }
   }
 );

module.exports = router;
