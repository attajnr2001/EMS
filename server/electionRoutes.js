const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");
const { ensureAuthenticated } = require("../config/auth");


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
       const admin = await Admin.findOne({ role: "Supervisor" });
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
