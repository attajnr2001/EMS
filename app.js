require("dotenv").config();
const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const port = process.env.port;
const layouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();

// require("./config/passport-v")(passport);
require("./config/passport")(passport);
app.set("view engine", "ejs");
app.set("layout", "./layouts/main.ejs");

const db = process.env.MongoUri;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(layouts);

app.use(express.static("public"));

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.setTimeError = req.flash("setTimeError");
  res.locals.setTimeSuccess = req.flash("setTimeSuccess");
  res.locals.createVotersError = req.flash("createVotersError");
  res.locals.votingSuccess_msg = req.flash("votingSuccess_msg");
  res.locals.votingError_msg = req.flash("votingError_msg");
  res.locals.createCandidateError1 = req.flash("createCandidateError1");
  res.locals.createCandidateError2 = req.flash("createCandidateError2");
  res.locals.createCandidateSuccess = req.flash("createCandidateSuccess");
  next();
});

app.use("/", require("./server/adminRoutes"));
app.use("/", require("./server/voterRoutes"));
app.use("/", require("./server/electionRoutes"));

app.listen(port, () => {
  console.log("running on port", port);
});

// const express = require("express");
// const app = express();
// const flash = require("connect-flash");
// const session = require("express-session");

// app.set("view engine", "ejs");
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// app.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// app.use(flash());
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash("success_msg");
//   next();
// });

// app.get("/", (req, res) => {
//   res.render("form");
// });

// app.get("/goto", (req, res) => {
//   res.render("goto");
// });

// app.post("/", (req, res) => {
//   const { username } = req.body;
//   const errors = [];

//   if (username.length < 6) {
//     errors.push({ msg: "asshole" });
//   }

//   if (errors.length > 0) {
//     res.render("form", { errors });
//   } else {
//     req.flash("success_msg", "Registration successful");
//     res.redirect("/goto");
//   }
// });

// app.listen(3000, () => {
//   console.log("running on port", 3000);
// });
