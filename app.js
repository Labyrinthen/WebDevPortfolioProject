/*
git status
git add .
git commit -m "Your commit message here"
git push origin main
*/

const express = require("express"); // loads the express package
const { engine } = require("express-handlebars"); // loads handlebars for Express
const port = 8080; // defines the port
const app = express(); // creates the Express application
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const connectSqlite3 = require("connect-sqlite3");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3");
const { error } = require("console");
const bcrypt = require("bcrypt");

// defines handlebars engine
app.engine("handlebars", engine());
// defines the view engine to be handlebars
app.set("view engine", "handlebars");
// defines the views directory
app.set("views", "./views");

// define static directory "public" to access css/ and img/
app.use(express.static("public"));

app.use("/public", express.static(path.join(__dirname, "/public")));

app.use((req, res, next) => {
  console.log("Req. URL: ", req.url);
  next();
});

// POST Forms
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const SQLiteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQLiteStore({ db: "session-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "unejam&edheTyJe¤BudallNjeriBre#",
  })
);

// MODEL (DATA)
const db = new sqlite3.Database("PORTFOLIOWEBSITE-LI.db");

// CONTROLLER (THE BOSS)
// defines routes "/"
app.get("/", (req, res) => {
  console.log("SESSION: ", req.session);

  // saltRounds = 12
  // bcrypt.hash("i", saltRounds, function(err, hash){
  //   if(err) {
  //     console.log("Error encrypting the password: ", err)
  //   } else{
  //     console.log("Hashed password (GENERATE only ONCE): ", hash)
  //   }
  // });

  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("home.handlebars", model); // Pass the model to the template
});

app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error destroying session:", error);
    }
    res.redirect("/"); // Redirect to the home page after logging out
  });
});

app.get("/about", (req, res) => {
  db.all("SELECt * FROM LanguageSkills", (error, languageskils) => {
    if (error) {
      console.error("Error fetching Languageskills: ", error);
      res.status(500).send("Error fetching Languageskills");
    } else {
      const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        LanguageSkills: languageskils,
      };
      res.render("about.handlebars", model); // Pass the model to the template
    }
  });
});

app.get("/projects", (req, res) => {
  db.all("SELECT * FROM projects", (error, theProjects) => {
    if (error) {
      const model = {
        hasDatabaseError: true,
        theError: error,
        projects: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      res.render("projects.handlebars", model);
    } else {
      const model = {
        hasDatabaseError: false,
        theError: "",
        projects: theProjects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      res.render("projects.handlebars", model);
    }
  });
});

app.post("/projects/delete/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    db.run(
      "DELETE FROM projects WHERE pid=?",
      [id],
      function (error, theProjects) {
        if (error) {
          const model = {
            dbError: true,
            theError: error,
            isLoggedIn: req.session.isLoggedIn,
            name: req.session.name,
            isAdmin: req.session.isAdmin,
          };
          res.render("projects.handlebars", model);
        } else {
          res.redirect("/projects");
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/projects/new", (req, res) => {
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    const model = {
      isLoggedIn: req.session.isLoggedIn,
      name: req.session.name,
      isAdmin: req.session.isAdmin,
      session,
    };
    res.render("newproject.handlebars", model);
  } else {
    res.redirect("/login");
  }
});

app.post("/projects/new", (req, res) => {
  console.log("Request Body:", req.body);
  const newp = [
    req.body.projname,
    req.body.projyear,
    req.body.projdesc,
    req.body.projtype,
    req.body.projimg,
  ];
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    db.run(
      "INSERT INTO projects (pname, pyear, pdesc, ptype, pimgURL) VALUES(?,?,?,?,?)",
      newp,
      (error) => {
        if (error) {
          console.log("ERROR: ", error);
        } else {
          console.log("Line added into the projects table!");
        }
        res.redirect("/projects");
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/projects/update/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM projects WHERE pid=?", [id], (error, theProject) => {
    if (error) {
      console.log("ERROR: ", error);
      const model = {
        dbError: true,
        theError: error,
        projects: {},
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      res.render("modifyproject.handlebars", model);
    } else {
      const model = {
        dbError: false,
        theError: "",
        project: theProject,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        helpers: {
          theTypeR(value) {
            return value == "Reasearch";
          },
          theTypeT(value) {
            return value == "Teaching";
          },
          theTypeO(value) {
            return value == "Other";
          },
        },
      };
      res.render("modifyproject.handlebars", model);
    }
  });
});

app.post("/projects/update/:id", (req, res) => {
  const id = req.params.id;
  const updatedData = [
    req.body.projname,
    req.body.projyear,
    req.body.projdesc,
    req.body.projtype,
    req.body.projimg,
    id,
  ];
  if (req.session.isLoggedIn && req.session.isAdmin) {
    db.run(
      "UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=? WHERE pid=?",
      updatedData,
      (error) => {
        if (error) {
          console.log("ERROR: ", error);
          // You might want to add more error handling here.
          res.redirect("/projects");
        } else {
          res.redirect("/projects");
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});
app.get("/contact", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("contact.handlebars", model);
});

app.get("/login", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("login.handlebars", model);
});

db.run(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL)",
  (error) => {
    if (error) {
      console.error("Error creating 'users' table: ", error);
    } else {
      console.log("Table 'users' created!");
    }
  }
);

app.get("/registration", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("registration.handlebars", model); // Redirect to the home page after logging out
});

app.post("/registration", (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;
  const role = req.body.role; // Get the selected role

  // Check if the user already exists
  db.get("SELECT username FROM users WHERE username = ?", [un], (error, existingUser) => {
    if (error) {
      console.error("Error checking for existing user: ", error);
      res.redirect("/registration"); // Handle registration failure
    } else if (existingUser) {
      console.log("User already exists.");
      // Handle the case where the user already exists (e.g., display an error message)
      res.redirect("/registration"); // Redirect back to the registration page
    } else {
      // Generate a salt
      bcrypt.genSalt(12, function (saltError, salt) {
        if (saltError) {
          console.log("Error generating salt: ", saltError);
          res.redirect("/registration"); // Handle registration failure
        } else {
          // Hash the user's password with the generated salt
          bcrypt.hash(pw, salt, function (hashError, hash) {
            if (hashError) {
              console.log("Error in hashing password: ", hashError);
              res.redirect("/registration"); // Handle registration failure
            } else {
              // Store the hashed password and role in the users table
              db.run(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                [un, hash, role],
                (insertError) => {
                  if (insertError) {
                    console.log("Error inserting user data: ", insertError);
                    res.redirect("/registration"); // Handle registration failure
                  } else {
                    console.log("User registered and password hashed!");
                    res.redirect("/login"); // Redirect to the login page after successful registration
                  }
                }
              );
            }
          });
        }
      });
    }
  });
});


// POST route for user login
app.post("/login", (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;

  db.get(
    "SELECT username, password, role FROM users WHERE username = ?",
    [un],
    (error, result) => {
      if (error) {
        console.error("Error fetching user data: ", error);
        res.redirect("/login"); // Handle login failure
      } else if (result) {
        const storedHashedPassword = result.password;

        // Compare the entered password with the stored hashed password
        bcrypt.compare(pw, storedHashedPassword, function (err, passwordMatch) {
          if (err) {
            console.error("Error comparing passwords: ", err);
            res.redirect("/login"); // Handle login failure
          } else if (passwordMatch) {
            console.log("Password is correct. User is logged in!");
            // Set user's role in the session
            req.session.isAdmin = result.role === "admin";
            req.session.isLoggedIn = true;
            req.session.name = un;
            res.redirect("/");
          } else {
            console.log("Password is incorrect. User is NOT logged in!");
            res.redirect("/login"); // Handle login failure
          }
        });
      } else {
        console.log("User not found.");
        res.redirect("/login"); // Handle login failure
      }
    }
  );
});



// defines the final default route 404 NOT FOUND
app.use(function (req, res) {
  res.status(404).render("404.handlebars");
});

// runs the app and listens to the port
app.listen(port, () => {
  console.log(`Server running and listening on port ${port}...`);
});



// creates table projects at startup

db.run(
  "CREATE TABLE IF NOT EXISTS projects (pid INTEGER PRIMARY KEY AUTOINCREMENT, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("Table 'projects' already exists:", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table projects created!");
      const projects = [];

      function projectExists(project, callback) {
        db.get(
          "SELECT COUNT(*) as count FROM projects WHERE pname = ? AND pyear = ? AND pdesc = ?",
          [project.name, project.year, project.desc],
          (error, result) => {
            if (error) {
              callback(error, null);
            } else {
              const count = result.count;
              callback(null, count > 0);
            }
          }
        );
      }

      // inserts projects
      projects.forEach((oneProject) => {
        projectExists(oneProject, (error, exists) => {
          if (error) {
            console.log("ERROR: ", error);
          } else {
            if (!exists) {
              // Only insert the project if it doesn't already exist
              db.run(
                "INSERT INTO projects (pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?)",
                [
                  oneProject.name,
                  oneProject.year,
                  oneProject.desc,
                  oneProject.type,
                  oneProject.url,
                ],
                (insertError) => {
                  if (insertError) {
                    console.log("ERROR: ", insertError);
                  } else {
                    console.log("Line added into the projects table!");
                  }
                }
              );
            } else {
              console.log("Project already exists:", oneProject.name);
            }
          }
        });
      });
    }
  }
);

// creates skills at startup
db.run(
  "CREATE TABLE IF NOT EXISTS skills (sid INTEGER PRIMARY KEY AUTOINCREMENT, sname TEXT NOT NULL, sdesc TEXT NOT NULL, stype TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("Table 'skills' already exists:", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table skills created!");
      const skills = [
        {
          name: "c++",
          type: "Programming language",
          desc: "Programming software",
        },
        {
          name: "Sql",
          type: "Database Programming language",
          desc: "Programming databases.",
        },
      ];

      function skillExists(skill, callback) {
        db.get(
          "SELECT COUNT(*) as count FROM skills WHERE sname = ?",
          [skill.name],
          (error, result) => {
            if (error) {
              callback(error, null);
            } else {
              const count = result.count;
              callback(null, count > 0);
            }
          }
        );
      }
      // inserts skills
      skills.forEach((oneSkill) => {
        skillExists(oneSkill, (error, exists) => {
          if (error) {
            console.log("ERROR: ", error);
          } else {
            if (!exists) {
              // Only insert the skill if it doesn't already exist
              db.run(
                "INSERT INTO skills (sname, sdesc, stype) VALUES (?, ?, ?)",
                [oneSkill.name, oneSkill.desc, oneSkill.type],
                (insertError) => {
                  if (insertError) {
                    console.log("ERROR: ", insertError);
                  } else {
                    console.log("Line added into the skills table!");
                  }
                }
              );
            } else {
              console.log("Skill already exists:", oneSkill.name);
            }
          }
        });
      });
    }
  }
);

// creates table LanguageSkills at startup
db.run(
  "CREATE TABLE IF NOT EXISTS LanguageSkills (lgid INTEGER PRIMARY KEY AUTOINCREMENT, lname TEXT NOT NULL, lamount TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("Table 'LanguageSkills' already exists:", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table LanguageSkills created!");
      const LanguageSkills = [
        { lname: "Swedish", lamount: "fluent" },
        { lname: "English", lamount: "fluent" },
        { lname: "Albanian", lamount: "good" },
      ];

      function languageSkillExists(skill, callback) {
        db.get(
          "SELECT COUNT(*) as count FROM LanguageSkills WHERE lname = ?",
          [skill.lname],
          (error, result) => {
            if (error) {
              callback(error, null);
            } else {
              const count = result.count;
              callback(null, count > 0);
            }
          }
        );
      }

      // inserts LanguageSkills
      LanguageSkills.forEach((oneLanguageSkill) => {
        languageSkillExists(oneLanguageSkill, (error, exists) => {
          if (error) {
            console.log("ERROR: ", error);
          } else {
            if (!exists) {
              // Only insert the language skill if it doesn't already exist
              db.run(
                "INSERT INTO LanguageSkills (lname, lamount) VALUES (?, ?)",
                [oneLanguageSkill.lname, oneLanguageSkill.lamount],
                (insertError) => {
                  if (insertError) {
                    console.log("ERROR: ", insertError);
                  } else {
                    console.log("Line added into the LanguageSkills table!");
                  }
                }
              );
            } else {
              console.log(
                "Language skill already exists:",
                oneLanguageSkill.lname
              );
            }
          }
        });
      });
    }
  }
);
