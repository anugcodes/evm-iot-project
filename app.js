const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

// config
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

initializeDB();

// Set static folder for HTML files
app.use(express.static(path.join(__dirname, "public")));
// Configure body-parser
app.use(bodyParser.json()); // Parse form data

app
  .route("/enroll")
  .get((req, res) => {
    res.sendFile("enroll.html", { root: path.join(__dirname, "public") });
  })
  .post((req, res) => {
    // Access form data from req.body object (e.g., req.body.name, req.body.email)
    const { Full_Name, Gender, Sic_Number, Biometric } = req.body; // Destructuring for cleaner access

    let evmdb = new sqlite3.Database("./db/evm.db", (err) => {
      if (err) throw err.message;
      else console.log("evmdb connected successfully.");
    });

    // inserting one record into voters table
    evmdb.run(
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

    evmdb.close((err) => {
      if (err) {
        console.error(err.message);
      } else console.log("Close the database connection.");
    });

    // Respond to successful enrollment (or error handling)
    res.send("Enrollment successful!"); // Customize based on your logic
  });

// Route for live voting form
app.get("/vote", (req, res) => {
  res.sendFile("vote.html", { root: path.join(__dirname, "public") });
});

app
  .route("/add-candidate")
  .get((req, res) => {
    res.sendFile("add-candidate.html", {
      root: path.join(__dirname, "public"),
    });
  })
  .post((req, res) => {
    console.log(req.headers, req.body);
    const { Candidate_Name, Candidate_Sic } = req.body;

    let evmdb = new sqlite3.Database("./db/evm.db", (err) => {
      if (err) throw err.message;
      else console.log("evmdb connected successfully.");
    });

    // inserting one record into voters table
    evmdb.run(
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
    let candidatesRes = [];

    evmdb.all("SELECT * FROM candidates", [], (err, row) => {
      if (err) throw err;
      else {
        candidatesRes = row;
        console.log(candidatesRes, row);
        res.send(
          JSON.stringify({
            state: "success",
            data: candidatesRes,
          })
        );
      }
    });

    evmdb.close((err) => {
      if (err) {
        console.error(err.message);
      } else console.log("Close the database connection.");
    });
  });

app.listen(port, () => {
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
  biometric TEXT NOT NULL
);`;

  const candidate_table_sql = `CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sic TEXT NOT NULL,
  votes INTEGER NOT NULL
);`;

  let evmdb = new sqlite3.Database("./db/evm.db", (err) => {
    if (err) throw err.message;
    else console.log("evmdb connected successfully.");
  });

  // checking if tables exists or not
  checkTableExists(evmdb, "voters", (err, row) => {
    if (err) throw err;
    else if (!row) evmdb.run(voters_table_sql);
  });

  checkTableExists(evmdb, "candidates", (err, row) => {
    if (err) throw err;
    else if (!row) evmdb.run(candidate_table_sql);
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
  evmdb.each("SELECT * FROM candidates", [], (err, row) => {
    if (err) throw err;
    else {
      // row.forEach((r)=> console.log(r));
      console.log(row);
    }
  });

  evmdb.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Close the database connection.");
  });
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
