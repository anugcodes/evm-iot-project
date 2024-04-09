const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Set static folder for HTML files
app.use(express.static(path.join(__dirname, "public")));

// Configure body-parser
app.use(bodyParser.urlencoded({ extended: true })); // Parse form data

// Route for enrollment (GET to display form, POST to process data)
app
  .route("/enroll")
  .get((req, res) => {
    res.sendFile("enroll.html", { root: path.join(__dirname, "public") });
  })
  .post((req, res) => {
    // Access form data from req.body object (e.g., req.body.name, req.body.email)
    console.log(req.body);
    const { First_Name,Last_Name,Sic_Number,Biometric } = req.body; // Destructuring for cleaner access
    console.log(`New enrollment: First Name: ${First_Name}, Last Name: ${Last_Name}, Sic: ${Sic_Number}, Biometric: ${Biometric}`); // Example logging

    // Implement logic to process enrollment data (e.g., database storage)

    // Respond to successful enrollment (or error handling)
    res.send("Enrollment successful!"); // Customize based on your logic
  });


// Route for live voting form
app.get("/vote", (req, res) => {
  res.sendFile("vote.html", { root: path.join(__dirname, "public") });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
