const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Voter = require("../models/Voter");
const passport = require("passport");
const axios = require("axios");
const Candidate = require("../models/Candidate");
const { ensureAuthenticated } = require("../config/2-auth");

router.get("/voter/login", (req, res) => {
  res.render("voter/login", { title: "Voter login page" });
});

router.post("/voter/login", async (req, res, next) => {
  try {
    const { INDEX, password } = req.body;
    voter = await Voter.findOne({ INDEX: INDEX });
    passport.authenticate("voter-local", {
      successRedirect: `/voter/dashboard/${voter._id}`,
      failureRedirect: `/voter/login`,
      failureFlash: true,
    })(req, res, next);
  } catch (error) {
    console.log(error);
    res.redirect("/voter/login");
  }
});

router.get("/voter/dashboard/:_id", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;

  try {
    const voter = await Voter.findOne({ _id: id });
    const admin = await Admin.find({});
    const _admin = await Admin.findOne({ role: "Supervisor" });

    res.render("voter/dashboard", {
      title: "EMS Voting",
      admin: admin,
      _admin: _admin,
      voter: voter,
    });
  } catch (error) {
    req.flash("noVoterFound", "No User found");
    res.redirect("/voter/login")
  }
});

router.get("/voter/:_id/voting", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;

  try {
    const voter = await Voter.findOne({ _id: id });
    const president = await Candidate.find({ position: "president" });
    const secretary = await Candidate.find({ position: "secretary" });
    const admin = await Admin.findOne({ role: "Supervisor" });
    const setTime = admin.setTime;
    const endTime = admin.ElectionEndDate;
    const candidate = { president, secretary };

    const response = await axios.get(
      "http://worldtimeapi.org/api/timezone/Africa/Accra"
    );

    const { datetime } = response.data;

    const setTimeDate = new Date(setTime);
    const endTimeDate = new Date(endTime);
    const currentDateTime = new Date(datetime);

    let canVote1 = setTimeDate.getTime() <= currentDateTime.getTime();
    let canVote2 = endTimeDate.getTime() >= currentDateTime.getTime();

    if (canVote1 && canVote2) {
      res.render("voter/voting", {
        title: "Voting Voting",
        voter: voter,
        candidate: candidate,
        admin: admin,
      });
    } else {
      req.flash("cantVote", "Election time no reach");
      res.redirect(`/voter/dashboard/${id}`);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/voter/:_id/voting", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;
  const { presidentOption, secretaryOption } = req.body;

  try {
    const candidate = await Candidate.findOne({ _id: presidentOption });
    const voter = await Voter.findOne({ _id: id });
    if (!voter.Voted) {
      await Candidate.updateMany(
        { _id: { $in: [presidentOption, secretaryOption] } },
        { $inc: { votes: 1 } }
      );
      await Voter.updateOne({ _id: id }, { Voted: true });
      req.flash("votingSuccess_msg", "Thank you for voting");
      res.redirect(`/voter/dashboard/${id}`);
    } else {
      req.flash("votingError_msg", "You have already voted");
      res.redirect(`/voter/dashboard/${id}`);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) throw err;
  });
  res.redirect("/voter/login");
});
module.exports = router;
