const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Voter = require("../models/Voter");

module.exports = function (passport) {
  passport.use(
    new localStrategy({ usernameField: "INDEX" }, (INDEX, PASSWORD, done) => {
      Voter.findOne({ INDEX: INDEX })
        .then((voter) => {
          if (!voter) {
            return done(null, false, { message: "Email is not registered" });
          }

          bcrypt.compare(PASSWORD, voter.PASSWORD, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              return done(null, voter);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch((err) => console.log(err));
    })
  );

  passport.serializeUser((voter, done) => {
    done(null, voter.id);
  });

  passport.deserializeUser((id, done) => {
    Voter.findById(id)
      .then((voter) => done(null, voter))
      .catch((err) => done(err));
  });
};
