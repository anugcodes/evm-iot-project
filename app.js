const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Set static folder for HTML files
app.use(express.static(path.join(__dirname, "public")));

// Route for enrollment form
app.get("/enroll", (req, res) => {
  res.sendFile("enroll.html", { root: path.join(__dirname, "pages") });
});

// Route for live voting form
app.get("/vote", (req, res) => {
  res.sendFile("vote.html", { root: path.join(__dirname, "pages") });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});