const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Voter = require("../models/Voter");

module.exports = function (passport) {
  passport.use(
    "admin-local",
    new LocalStrategy(
      { usernameField: "userName" },
      (userName, password, done) => {
        Admin.findOne({ userName: userName })
          .then((admin) => {
            if (!admin) {
              return done(null, false, { message: "Email is not registered" });
            }

            bcrypt.compare(password, admin.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                return done(null, admin);
              } else {
                return done(null, false, { message: "Password incorrect" });
              }
            });
          })
          .catch((err) => console.log(err));
      }
    )
  );

  passport.use(
    "voter-local",
    new LocalStrategy(
      {
        usernameField: "INDEX",
        passwordField: "password",
      },
      (INDEX, password, done) => {
        Voter.findOne({ INDEX: INDEX })
          .then((voter) => {
            if (!voter) {
              return done(null, false, { message: "User is not registered" });
            }

            if (password === voter.password) {
              return done(null, voter);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          })
          .catch((err) => done(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    Admin.findById(id)
      .then((admin) => {
        if (admin) {
          done(null, admin);
        } else {
          Voter.findById(id)
            .then((voter) => {
              done(null, voter);
            })
            .catch((err) => done(err));
        }
      })
      .catch((err) => done(err));
  });
};
