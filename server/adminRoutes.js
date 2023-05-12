/**
 * This code defines the routes and handlers for the admin-related functionality in the application.
 * It includes routes for login, dashboard, uploading voters, setting election date, deleting voters,
 * adding candidates, and logging out.
 */

// Import required modules
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


/**
 * Route: GET /
 * Description: Renders the welcome page
 */
router.get("/", (req, res) => {
  res.render("welcome", { title: "Welcome EMS" });
});


/**
 * Route: POST /admin/login
 * Description: Handles admin login functionality
 */
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



/**
 * Route: POST /admin/dashboard/:_id/uploadVoters
 * Description: Handles uploading voters from a CSV file
 */
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

/**
 * Route: GET /admin/login
 * Description: Renders the admin login page
 */
router.get("/admin/login", (req, res) => {
  res.render("admin/login", { title: "Admin login page" });
});


/**
 * Route: GET /admin/dashboard/:_id
 * Description: Renders the admin dashboard page
 */
router.get("/admin/dashboard/:_id", ensureAuthenticated, async (req, res) => {
  const admin = await Admin.findOne({ _id: req.params._id });
  const _admin = await Admin.findOne({ role: "Supervisor" });

  res.render("admin/dashboard", {
    title: "Kam 3 dashboard",
    admin: admin,
    _admin: _admin,
  });
});

/**
 * Logout route for the admin user.
 * Clears the session and redirects to the login page.
 */
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) throw err;
  });
  res.redirect("/admin/login");
});

/**
 * Route for updating the election date and time in the admin dashboard.
 * Only accessible for admin users with a role of "Supervisor".
 * Updates the electionEndDate and setTime fields in the Admin model based on the request body.
 * Redirects to the admin dashboard with a success message if the update is successful.
 * Redirects to the admin dashboard with an error message if the user is not authorized or an error occurs.
 */
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
        { ElectionEndDate: ElectionEndDate },
      );
      const result2 = await Admin.updateOne(
        { _id: id },
        { setTime: setTime },
      );
      req.flash("setTimeSuccess", "Date has been changed");
      res.redirect("/admin/dashboard/" + id);
    } else {
      req.flash("setTimeError", "Sorry You cannot set Date");
      res.redirect("/admin/dashboard/" + id);
    }
  } catch (error) {
    console.log(error);
  }
});


/**
 * Route for deleting all voters and candidates in the admin dashboard.
 * Only accessible for admin users with a role of "Supervisor".
 * Deletes all documents in the Candidate and Voter models.
 * Redirects to the admin dashboard after deleting the documents.
 * Returns a JSON response with an error message if the user is not authorized or an error occurs.
 */
router.post("/admin/dashboard/:_id/deleteVoters", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;
  const admin = await Admin.findOne({ _id: id });

  try {
    if(admin.role == "Supervisor"){
      await Candidate.deleteMany({})
      await Voter.deleteMany({});

      res.redirect(`/admin/dashboard/${id}`);
    }else{
      res.json("cant delete voters")
    }
  } catch (error) {
    console.log(error);
  }
});


/**
 * Route for adding a candidate in the admin dashboard.
 * Displays a form for adding a new candidate and renders the "admin/newCandidate" view.
 * Only accessible for authenticated admin users.
 * 
 * GET request:
 * Fetches the admin user, candidates, and voters from the database and renders the "admin/newCandidate" view.
 */
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


/* POST request:
* Creates a new candidate based on the form data submitted.
* Saves the candidate to the database.
* If successful, a success flash message is set and the user is redirected to the "/admin/dashboard/:_id/addCandidate" page.
* If an error occurs during the save operation, an error flash message is set and the user is redirected to the same page.
* If the candidate is already registered, a specific error flash message is set.
*/
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


/**
 * Route for viewing candidates in the admin dashboard.
 * Displays the candidates for the "president" and "secretary" positions.
 * Only accessible for authenticated admin users.
 * 
 * GET request:
 * Fetches the admin user, candidates for "president" and "secretary" positions from the database,
 * and renders the "admin/viewCandidate" view with the retrieved data.
 */
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
/**
 * Route for adding an admin user in the admin dashboard.
 * Only accessible for authenticated admin users.
 * 
 * GET request:
 * Fetches the admin user with the specified ID from the database
 * and renders the "admin/addAdmin" view with the retrieved data.
 */
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


/**
 * Route for creating an admin user in the admin dashboard.
 * Only accessible for authenticated admin users.
 * 
 * POST request:
 * Retrieves the admin user details from the request body,
 * creates a new admin user with the provided data, and saves
 * it to the database. Redirects to the admin dashboard page
 * for the specified admin user ID upon successful creation.
 */

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

/* Route for removing all candidates and voters from the admin dashboard.
* Only accessible for authenticated admin users.
* 
* POST request:
* Retrieves the admin user ID from the request parameters,
* finds the corresponding admin user in the database, and then
* deletes all candidate and voter documents from the database.
* Finally, redirects to the admin dashboard page for the specified
* admin user ID after the deletion is complete.
*/

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

/**
 * Function for saving the cover image of a book.
 * 
 * @param {object} book - The book object to save the cover image for.
 * @param {string} coverEncoded - The encoded cover image data.
 */

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
