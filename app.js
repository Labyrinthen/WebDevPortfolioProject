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
  console.log("SESSION ", req.session);
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
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("about.handlebars", model); // Pass the model to the template
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

app.get("/projects/new", (req, res) => {
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

app.post("/login", (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;

  if (un == "l" && pw == "i") {
    console.log("Lavdim is logged in!");
    req.session.isAdmin = true;
    req.session.isLoggedIn = true;
    req.session.name = "Lavdim";
    res.redirect("/");
  } else {
    console.log("Bad user and/or bad password");
    req.session.isAdmin = false;
    req.session.isLoggedIn = false;
    req.session.name = "";
    res.redirect("/login");
  }
  console.log("LOGIN: ", un);
  console.log("PASSWORD: ", pw);
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
  "CREATE TABLE IF NOT EXISTS projects (pid INTEGER PRIMARY KEY, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table projects created!");
      const projects = [
        {
          id: "1",
          name: "Cyberpunk tiger",
          type: "other",
          desc: "Cool art of a tiger in the future",
          year: 2022,
          url: "/img/a.png",
        },
        {
          id: "2",
          name: "Father and son",
          type: "other",
          desc: "Father and son in the desert praying with the moon in the background ",
          year: 2021,
          url: "/img/b.png",
        },
        {
          id: "3",
          name: "Ai jungle",
          type: "other",
          desc: "exploring ai jungle ",
          year: 2020,
          url: "/img/c.png",
        },
        {
          id: "4",
          name: "cool ai art",
          desc: "man ai",
          year: 2023,
          type: "other",
          url: "/img/d.png",
        },
        {
          id: "5",
          name: "cyberpunk cowboy",
          desc: "cowboy in 2042",
          year: 2023,
          type: "other",
          url: "/img/e.png",
        },
      ];

      // inserts projects
      projects.forEach((oneProject) => {
        db.run(
          "INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?, ?)",
          [
            oneProject.id,
            oneProject.name,
            oneProject.year,
            oneProject.desc,
            oneProject.type,
            oneProject.url,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projects table!");
            }
          }
        );
      });
    }
  }
);

// creates skills projects at startup
db.run(
  "CREATE TABLE IF NOT EXISTS skills (sid INTEGER PRIMARY KEY, sname TEXT NOT NULL, sdesc TEXT NOT NULL, stype TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table skills created!");
      const skills = [
        {
          id: "1",
          name: "c++",
          type: "Programming language",
          desc: "Programming software",
        },
        {
          id: "2",
          name: "Sql",
          type: "Database Programming language",
          desc: "Programming databases.",
        },
        {
          id: "3",
          name: "html/css/javascript",
          type: "Programming language",
          desc: "Programming websites",
        },
        {
          id: "4",
          name: "wix",
          type: "website maker",
          desc: "Making websites without coding",
        },
      ];
      // inserts skills
      skills.forEach((oneSkill) => {
        db.run(
          "INSERT INTO skills (sid, sname, sdesc, stype) VALUES (?, ?, ?, ?)",
          [oneSkill.id, oneSkill.name, oneSkill.desc, oneSkill.type],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the skills table!");
            }
          }
        );
      });
    }
  }
);

// creates table LanguageSkills at startup
db.run(
  "CREATE TABLE IF NOT EXISTS LanguageSkills (lgid INTEGER PRIMARY KEY, lname TEXT NOT NULL, lamount TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table LanguageSkills created!");
      const LanguageSkills = [
        { lgid: "1", lname: "Swedish", lamount: "fluent" },
        { lgid: "2", lname: "English", lamount: "fluent" },
        { lgid: "3", lname: "Albanian", lamount: "good" },
      ];
      // inserts LanguageSkills
      LanguageSkills.forEach((oneLanguageSkill) => {
        db.run(
          "INSERT INTO LanguageSkills (lgid, lname, lamount) VALUES (?, ?, ?)",
          [
            oneLanguageSkill.lgid,
            oneLanguageSkill.lname,
            oneLanguageSkill.lamount,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the LanguageSkills table!");
            }
          }
        );
      });
    }
  }
);
