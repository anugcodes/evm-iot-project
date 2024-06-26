const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

// config
const app = express();
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

initializeDB();

// Set static folder for HTML files
app.use(express.static(path.join(__dirname, "public")));
// Configure body-parser
app.use(bodyParser.json()); // Parse form data

//  Route for path: /enroll
app
  .route("/enroll")
  .get((req, res) => {
    res.sendFile("enroll.html", { root: path.join(__dirname, "public") });
  })
  .post((req, res) => {
    // Access form data from req.body object (e.g., req.body.name, req.body.email)
    const { Full_Name, Gender, Sic_Number, Biometric } = req.body; // Destructuring for cleaner access

    connectDb((db) => {
      // inserting one record into voters table
      db.run(
        "INSERT INTO voters(full_name,gender,sic_number,biometric) VALUES(?,?,?,?)",
        [Full_Name, Gender, Sic_Number, Biometric],
        function (err) {
          if (err) {
            return console.log(err.message);
          } else
            console.log(
              `new enrollment -  Full Name: ${Full_Name}, Gender: ${Gender}, Sic: ${Sic_Number}, Biometric: ${Biometric} - [added]`
            ); // Example logging
        }
      );
    });
    // Respond to successful enrollment (or error handling)
    res.send(JSON.stringify({ message: "success" })); // Customize based on your logic
  });

// Route for path: /vote
app
  .route("/vote")
  .get((req, res) => {
    // res.sendFile("vote.html", { root: path.join(__dirname, "public") });

    connectDb((db) => {
      db.all("SELECT * FROM candidates", [], (err, row) => {
        let candidates;
        if (err) throw err;
        else {
          if (row.length > 0) {
            candidates = [...row];
          } else {
            candidates = "No candidates";
          }
          res.render(path.join(__dirname, "/public", "vote.html"), {
            candidates: candidates,
          });
        }
      });
    });
  })
  .post((req, res) => {
    const { id, name, sic, votes } = req.body;
    console.log(id, name, sic, votes);

    connectDb((db) => {
      db.run(
        `UPDATE candidates SET votes=votes+1 WHERE id=${id}`,
        [],
        (err, row) => {
          if (err) console.log(err);
        }
      );

      db.all("SELECT * FROM candidates", [], (err, row) => {
        if (err) throw err;
        else {
          res.send(JSON.stringify(row));
        }
      });
    });
  });

app
  .route("/add-candidate")
  .get((req, res) => {
    connectDb((db) => {
      console.log("url params:", req.params);
      if (req.params.action === "clear") {
        db.run("DELETE * FROM candidates", [], (err, row) => {
          if (err) throw err;
          else console.log(row);
        });
      }

      db.all("SELECT * FROM candidates", [], (err, row) => {
        let candidates;
        if (err) throw err;
        else {
          if (row.length > 0) {
            candidates = [...row];
          } else {
            candidates = "No candidates";
          }
          res.render(path.join(__dirname, "/public", "add-candidate.html"), {
            candidates: candidates,
          });
        }
      });
    });
  })

  .post((req, res) => {
    const { Candidate_Name, Candidate_Sic, action } = req.body;

    connectDb((db) => {
      // inserting one record into voters table
      if (Candidate_Name && Candidate_Sic) {
        db.run(
          "INSERT INTO candidates (name,sic,votes) VALUES(?,?,?)",
          [Candidate_Name, Candidate_Sic, 0],
          function (err) {
            if (err) {
              return console.log(err.message);
            } else
              console.log(
                `new enrollment -  Full Name: ${Candidate_Name}, Sic Number: ${Candidate_Sic}, Votes: ${0} - [added]`
              ); // Example logging
          }
        );
      }

      if (action === "clear") {
        // clear the table
        db.run("DELETE FROM candidates", [], function (err) {
          if (err) {
            return console.log(err.message);
          }
        });
      }

      let candidatesRes = [];
      db.all("SELECT * FROM candidates", [], (err, row) => {
        if (err) throw err;
        else {
          candidatesRes = row;
          res.send(
            JSON.stringify({
              state: "success",
              data: candidatesRes,
            })
          );
        }
      });
    });
  });

app.route("/candidates").get((req, res) => {
  console.log("url params:", req.params);

  connectDb((db) => {
    db.all("SELECT * FROM candidates", [], (err, row) => {
      if (err) throw err;
      else {
        res.send(JSON.stringify(row));
      }
    });
  });
});

app.route("/voter").get((req, res) => {
  console.log("/voter - url params: ", req.query);
  const biometric = req.query.biometric;
  console.log(biometric);

  // if (biometric !== undefined && biometric !== null) {
  connectDb((db) => {
    db.all(
      `SELECT * from voters WHERE biometric=${biometric}`,
      [],
      (err, row) => {
        if (err) throw err;
        else {
          res.send(JSON.stringify(row));
        }
      }
    );
  });
  // } else {
  //   res.send("invalid parameters")
  // }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

function initializeDB() {
  /* 
- voters table, contains details of voters(filled during enrollment process).
- candidates table, contains name of candidates and number of votes recieved during process of voting.

checks if above two db exists. if not it creates the dbs.
*/

  const voters_table_sql = `CREATE TABLE voters (
  voter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  sic_number TEXT NOT NULL,
  biometric INTEGER NOT NULL,
  voted_to INTEGER
);`;

  const candidate_table_sql = `CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sic TEXT NOT NULL,
  votes INTEGER NOT NULL
);`;

  connectDb((db) => {
    // checking if tables exists or not
    checkTableExists(db, "voters", (err, row) => {
      if (err) throw err;
      else if (!row) db.run(voters_table_sql);
    });

    checkTableExists(db, "candidates", (err, row) => {
      if (err) throw err;
      else if (!row) db.run(candidate_table_sql);
    });
  });

  // inserting one record into voters table
  // evmdb.run(
  //   "INSERT INTO voters(full_name,gender,sic_number,biometric) VALUES(?,?,?)",
  //   ["anurag", "21becc17", 23],
  //   function (err) {
  //     if (err) {
  //       return console.log(err.message);
  //     }
  //   }
  // );
  // evmdb.run(
  //   "INSERT INTO candidates(name,sic,votes) VALUES(?,?,?)",
  //   ["anurag", "21becc17", 12],
  //   function (err) {
  //     if (err) {
  //       return console.log(err.message);
  //     }
  //   }
  // );

  // fetching one row
  // evmdb.each("SELECT * FROM candidates", [], (err, row) => {
  //   if (err) throw err;
  //   else {
  //     // row.forEach((r)=> console.log(r));
  //     console.log(row);
  //   }
  // });
}

function checkTableExists(db, tableName, callback) {
  try {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      tableName,
      (err, row) => {
        if (err) {
          return callback(err);
        }
        callback(null, !!row); // row exists? (truthy/falsy check)
      }
    );
  } catch (err) {
    console.error(err);
  }
}

function connectDb(taskCallback) {
  /*
  this function connects to the database file and executes any function and closes the database.
    -- db - path to the database file.
    -- taskCallback(db) - function to execute when the database is connected. 
  */
  const databaseAddress = "./db/evm.db";
  let db = new sqlite3.Database(databaseAddress, (err) => {
    if (err) throw err.message;
    else console.log("evmdb connected successfully.");
  });

  taskCallback(db);

  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Close the database connection.");
  });
}
