/**
 * This code sets up an Express.js web application with various middleware and configurations.
 * It connects to a MongoDB database using Mongoose and initializes Passport for authentication.
 * The application listens on a specified port for incoming requests.
 */

// Load environment variables from a .env file
require("dotenv").config();

// Import required modules
const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const port = process.env.port;
const layouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();

// Configure passport authentication
require("./config/passport")(passport);

// Set view engine and layout
app.set("view engine", "ejs");
app.set("layout", "./layouts/main.ejs");

// Connect to MongoDB database
const db = process.env.MongoUri;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.log(err));

// Middleware and static file serving
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(layouts);
app.use(express.static("public"));

// Configure session middleware
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages middleware
app.use(flash());

// Set local variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.setTimeError = req.flash("setTimeError");
  res.locals.setTimeSuccess = req.flash("setTimeSuccess");
  res.locals.createVotersError = req.flash("createVotersError");
  res.locals.createVotersSuccess = req.flash("createVotersSuccess");
  res.locals.votingSuccess_msg = req.flash("votingSuccess_msg");
  res.locals.cantVote = req.flash("cantVote");
  res.locals.noVoterFound = req.flash("noVoterFound");
  res.locals.votingError_msg = req.flash("votingError_msg");
  res.locals.createCandidateError1 = req.flash("createCandidateError1");
  res.locals.createCandidateError2 = req.flash("createCandidateError2");
  res.locals.createCandidateSuccess = req.flash("createCandidateSuccess");
  next();
});

// Route handling
app.use("/", require("./server/adminRoutes"));
app.use("/", require("./server/voterRoutes"));
app.use("/", require("./server/electionRoutes"));

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log("running on port", port);
});
