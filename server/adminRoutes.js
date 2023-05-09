/**
 * Documentation for the EMS (Election Management System) code:
The code is an implementation of an Election Management System (EMS) that allows administrators to manage elections. The system is built using Node.js and Express.js, with a MongoDB database. The system allows administrators to log in, set an election date, add candidates, and view election results.
The code is organized into modules using the Express.js Router. Each module is responsible for handling specific functionality of the system. The modules are as follows:

1. Welcome Module
This module handles the GET request to the root directory (/) of the EMS. The response is the welcome view with the title "Welcome EMS"

2. CSV Upload Module:
This module handles the POST request to the root directory (/) of the EMS, which uploads a CSV file containing voter data. The module uses multer to handle file uploads and csv-parser to parse the CSV file. The parsed data is then inserted into the Voter collection of the MongoDB database using the insertMany() method. The module redirects to the /admin/dashboard route on completion of the upload.

3. Admin Login Module:
This module handles the GET and POST requests to the /admin/login route, which displays the login form and handles the login authentication of the administrator, respectively. The module uses the passport.js library for authentication and the bcrypt.js library for password hashing. If the authentication is successful, the module redirects to the /admin/dashboard/:_id route with the administrator's ID as a parameter.

4. Admin Dashboard Module:
This module handles the GET request to the /admin/dashboard/:_id route, which displays the dashboard view of the EMS for the administrator with the given ID. The module also handles the POST request to the /admin/dashboard/:_id route, which sets the election date for the EMS. The module uses axios to get the current date and time from an external API and compares it with the date set by the administrator.

5. Add Candidate Module:
This module handles the GET and POST requests to the /admin/dashboard/:_id/addCandidate route, which displays the form for adding a new candidate and handles the insertion of the new candidate into the Candidate collection of the MongoDB database, respectively. The module uses multer to handle file uploads and saves the candidate's profile picture to the public/uploads directory.

6. View Candidate Module:
This module handles the GET request to the /admin/dashboard/:_id/viewCandidate route, which displays the list of candidates in the EMS. The module retrieves the candidate data from the Candidate collection of the MongoDB database and sorts the candidates by their positions.

7. View Election Module:
This module handles the GET request to the /admin/dashboard/:_id/viewElection route, which displays the election results of the EMS. The module retrieves the candidate data from the Candidate collection of the MongoDB database and sorts the candidates by their positions. The module then displays the candidates for each position separately.

Dependencies used in the code:
- express: a Node.js web framework
- bcryptjs: a library for password hashing
- csv-parser: a library for parsing CSV files
- multer: a library for handling file uploads
- passport: a library for authentication
- axios: a library for making HTTP requests
- mongodb: a library for connecting to MongoDB database

Overall, this EMS code allows administrators to manage elections by adding voters, setting an election date, adding candidates, and viewing the election results.
 */

/*
This code initializes an Express router to handle HTTP requests for an election app.
It requires various modules including the Express framework, bcrypt for password hashing,
multer for file uploading, passport for authentication, and axios for making HTTP requests.
It also defines the MIME types for images that are allowed to be uploaded.
*/
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

/*
 * This route handles the GET request to the root URL ("/").
 * It renders the "welcome" view and passes a title variable to it.
 */
router.get("/", (req, res) => {
  res.render("welcome", { title: "Welcome EMS" });
});

/*
This route handles the POST request to upload a CSV file of voters and save them to the database.
The middleware function `upload.single` is used to handle the file upload, and the file is stored in the
`file` variable. A new array `results` is created to store the data from the CSV file. 

We then read the file using the `fs` module, create a `csv-parser` and pipe the file to it. For each row
of data in the CSV file, the `data` event is triggered, and we push the data to the `results` array. When
we reach the end of the CSV file, the `end` event is triggered, and we use `Voter.insertMany` to save the
data to the database.

After the data has been saved, we redirect the user to the dashboard. We can also choose to delete the file
from the server using the `fs.unlink` function, which is currently commented out.
*/

/*
 * Handles POST request to '/admin/login'
 * Attempts to find an Admin in the database with the given username
 * If found, uses Passport.js middleware to authenticate the user using the 'local' strategy
 * If authentication succeeds, redirects the user to the dashboard with the Admin's ID
 * If authentication fails, redirects the user to the login page with a flash message
 * If an error occurs during the process, sends a JSON response with a 404 error message
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
    loginErrors.push({loginErrorMsg: "Can't find User"});
    res.render("admin/login", {
      title: "EMS Login",
      loginErrors: loginErrors
    })
  }
});

router.post(
  "/admin/dashboard/:_id/uploadVoters",
  upload.single("csv-file"),
  (req, res) => {
    const id = req.params._id;
    const admin = Admin.findOne({ _id: id });
    const file = req.file;
    const results = [];
    try {
      console.log(file.destination);

      fs.createReadStream("./public/uploads/" + file.filename)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          console.log(results);
          await Voter.insertMany(results)
            .then(() => console.log("Student saved to database"))
            .catch((err) => console.error(err));
        });

      res.redirect(`/admin/dashboard/${id}`);
      //   fs.unlink(file.destination + "\\" + file.filename, (err) => {
      //     if (err) console.log(err);
      //     console.log("File deleted successfully");
      //   });
    } catch (error) {
      req.flash("createVotersError", "Something went wrong, Please try again");
      res.redirect(`/admin/dashboard/${id}`);
    }
  }
);

/*
Route: GET /admin/login
Description: Renders the admin login page
*/
router.get("/admin/login", (req, res) => {
  res.render("admin/login", { title: "Admin login page" });
});

/*
  Route to handle GET requests to the admin dashboard page.
  Uses the ensureAuthenticated middleware to check if the user is authenticated.
  Finds the admin in the database based on the _id parameter and renders the admin dashboard page.
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

/* 
  Route to handle user logout, when a user logs out,
  the req.logout() method is called which comes with
  PassportJS to remove the user session from the req object
*/
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) throw err;
  });
  res.redirect("/admin/login");
});
/*
 * Route for setting election date on admin dashboard
 */
router.post("/admin/dashboard/:_id", ensureAuthenticated, async (req, res) => {
  const id = req.params._id;
  const admin = await Admin.findOne({ _id: id });
  console.log(admin.role);

  // get election date from request body
  const setTime = req.body.electionDate;
  const ElectionEndDate = req.body.ElectionEndDate;

  try {
    // update election date in database
    if (admin.role == "Supervisor") {
      const result = await Admin.updateOne({ _id: id }, { setTime: setTime }, { ElectionEndDate: ElectionEndDate });
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

/*
  Route to display the page for adding a new candidate. 
  Only accessible by authenticated admin users. 
  Retrieves existing candidates and voters from the database.
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

// Handle POST request to add a new candidate
router.post(
  "/admin/dashboard/:_id/addCandidate",
  ensureAuthenticated,
  async (req, res) => {
    const id = req.params._id;

    // Create a new Candidate object with data from the request body
    try {
      const candidate = new Candidate({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        voter: req.body.voter,
        position: req.body.position,
        department: req.body.department,
      });

      // Save the candidate's cover image using the saveCover function
      saveCover(candidate, req.body.cover);

      try {
        const newCandidate = await candidate.save();

        // Redirect back to the add candidate page with the admin ID in the URL
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

/*
 * GET request to display a view of all candidates on the dashboard
 * Route: /admin/dashboard/:_id/viewCandidate
 */
router.get(
  "/admin/dashboard/:_id/viewCandidate",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const id = req.params._id;
      const candidates = await Candidate.find({}).sort({ position: "asc" });
      const admin = await Admin.findOne({ _id: id });
      res.render("admin/viewCandidate", {
        title: "Node App View Candidate",
        admin: admin,
        candidates: candidates,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

/*
Route to render the add admin page. Only accessible by authenticated admin users.
Displays a form to add a new admin user.
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

/*
  Route: /admin/dashboard/:_id/viewElection
  Method: POST
  Description: Create a new admin user
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

      // Create a new admin user
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
      // Define an async function to delete all documents from the Candidates collection
      async function deleteAll() {
        try {
          const result = await Candidate.deleteMany({});
          console.log(`${result.deletedCount} documents deleted`);
          res.redirect("/admin/dashboard/" + id);
        } catch (error) {
          console.error(error);
        }
      }

      // Call the deleteAll function
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
  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new admin user
  const admin = new Admin({
    firstName: firstName,
    lastName: lastName,
    userName: userName,
    password: hashedPassword,
    department: department,
    phone: phone,
    dob: dob,
  });

  // Save the admin user to the database
  try {
    await admin.save();
    console.log("Admin user created successfully");
  } catch (err) {
    console.error(err);
  }
}

module.exports = router;
