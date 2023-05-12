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

router.get("/", (req, res) => {
  res.render("welcome", { title: "Welcome EMS" });
});

router.post("/admin/login", async (req, res, next) => {
  const loginErrors = [];
  try {
    const { userName, password } = req.body;
    admin = await Admin.findOne({ userName: userName });
    passport.authenticate("admin-local", {
      successRedirect: `/admin/dashboard/${admin._id}`,
      failureRedirect: `/admin/login`,
      failureFlash: true,
    })(req, res, next);
  } catch (error) {
    console.log(error);
    loginErrors.push({ loginErrorMsg: "Can't find User" });
    res.render("admin/login", {
      title: "EMS Login",
      loginErrors: loginErrors,
    });
  }
});

router.post(
  "/admin/dashboard/:_id/uploadVoters",
  upload.single("csv-file"),
  async (req, res) => {
    const id = req.params._id;
    const admin = Admin.findOne({ _id: id });
    const file = req.file;
    console.log(file);
    const results = [];
    try {
      fs.createReadStream("./public/uploads/" + file.filename)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          console.log(results);
          await Voter.insertMany(results)
            .then(() => console.log("Student saved to database"))
            .catch((err) => console.error(err));
        });

      req.flash("createVotersSuccess", "Voters added successfully");
      res.redirect(`/admin/dashboard/${id}`);
    } catch (error) {
      console.log(error);
      req.flash("createVotersError", "Something went wrong, Please try again");
      res.redirect(`/admin/dashboard/${id}`);
    }
  }
);

router.get("/admin/login", (req, res) => {
  res.render("admin/login", { title: "Admin login page" });
});

router.get("/admin/dashboard/:_id", ensureAuthenticated, async (req, res) => {
  const admin = await Admin.findOne({ _id: req.params._id });
  const _admin = await Admin.findOne({ role: "Supervisor" });

  res.render("admin/dashboard", {
    title: "Kam 3 dashboard",
    admin: admin,
    _admin: _admin,
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) throw err;
  });
  res.redirect("/admin/login");
});

router.post("/admin/dashboard/:_id", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;
  const admin = await Admin.findOne({ _id: id });
  console.log(admin.role);

  const setTime = req.body.electionDate;
  const ElectionEndDate = req.body.ElectionEndDate;

  try {
    if (admin.role == "Supervisor") {
      const result = await Admin.updateOne(
        { _id: id },
        { setTime: setTime },
        { ElectionEndDate: ElectionEndDate }
      );
      req.flash("setTimeSuccess", "Date has been changed");
      res.redirect("/admin/dashboard/" + id);
    } else {
      req.flash("setTimeError", "Sorry You cannot set Date");
      res.redirect("/admin/dashboard/" + id);
    }

    //  // get current date and time from worldtimeapi
    //  const response = await axios.get(
    //    "http://worldtimeapi.org/api/timezone/Africa/Accra"
    //  );
    //  const { datetime } = response.data;

    //  // log whether the set election date matches the current date
    //  console.log(
    //    `Current date and time: ${
    //      datetime.split("T")[0] == setTime.split("T")[0]
    //    }`
    //  );
  } catch (error) {
    console.log(error);
  }
});

router.get(
  "/admin/dashboard/:_id/addCandidate",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const id = req.params._id;
      const candidate = await Candidate.find({});
      const voters = await Voter.find({});
      const admin = await Admin.findOne({ _id: id });

      res.render("admin/newCandidate", {
        title: "Node App Add Candidate",
        admin: admin,
        candidate: candidate,
        voters: voters,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/admin/dashboard/:_id/addCandidate",
  ensureAuthenticated,
  async (req, res) => {
    const id = req.params._id;

    try {
      const candidate = new Candidate({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        voter: req.body.voter,
        position: req.body.position,
        department: req.body.department,
      });

      saveCover(candidate, req.body.cover);

      try {
        const newCandidate = await candidate.save();

        req.flash(
          "createCandidateSuccess",
          "Candidate Registration successful"
        );
        res.redirect(`/admin/dashboard/${id}/addCandidate`);
      } catch (err) {
        req.flash("createCandidateError2", "Something went wrong");
        res.redirect(`/admin/dashboard/${id}/addCandidate`);
      }
    } catch (error) {
      req.flash(
        "createCandidateError1",
        "Sorry Candidate is already registered"
      );
      res.redirect(`/admin/dashboard/${id}/addCandidate`);
    }
  }
);

router.get(
  "/admin/dashboard/:_id/viewCandidate",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const id = req.params._id;
      const president = await Candidate.find({position: "president"});
      const secretary = await Candidate.find({position: "secretary"});
      const admin = await Admin.findOne({ _id: id });
      res.render("admin/viewCandidate", {
        title: "Node App View Candidate",
        admin: admin,
        president: president,
        secretary: secretary,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.get(
  "/admin/dashboard/:_id/addAdmin",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const id = req.params._id;
      const admin = await Admin.findOne({ _id: id });
      res.render("admin/addAdmin", {
        title: "Node App View Election",
        admin: admin,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/admin/dashboard/:_id/viewElection",
  ensureAuthenticated,
  async (req, res) => {
    const id = req.params._id;
    const admin = Admin.findOne({ _id: id });

    try {
      const {
        firstName,
        lastName,
        userName,
        password,
        password2,
        department,
        phone,
        role,
        dob,
      } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = new Admin({
        firstName,
        lastName,
        userName,
        password: hashedPassword,
        department,
        phone,
        dob,
        role,
      });

      try {
        await admin.save();
        res.redirect("/admin/dashboard/" + id);
      } catch (err) {
        console.error(err);
      }
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/admin/dashboard/:_id/removeAll",
  ensureAuthenticated,
  async (req, res) => {
    const id = req.params._id;
    const admin = Admin.findOne({ _id: id });

    try {
      async function deleteAll() {
        try {
          const result = await Candidate.deleteMany({});
          console.log(`${result.deletedCount} documents deleted`);
          res.redirect("/admin/dashboard/" + id);
        } catch (error) {
          console.error(error);
        }
      }
      deleteAll();
    } catch (error) {
      console.log(error);
    }
  }
);

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

async function createAdmin(
  firstName,
  lastName,
  userName,
  password,
  department,
  phone,
  dob
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    firstName: firstName,
    lastName: lastName,
    userName: userName,
    password: hashedPassword,
    department: department,
    phone: phone,
    dob: dob,
  });

  try {
    await admin.save();
    console.log("Admin user created successfully");
  } catch (err) {
    console.error(err);
  }
}

module.exports = router;
