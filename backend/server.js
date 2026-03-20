const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/volunteers", require("./routes/volunteers"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/matching", require("./routes/matching"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Attachment must be 5MB or less" });
    }
    return res.status(400).json({ message: err.message || "File upload failed" });
  }
  if (err.message && err.message.includes("Only .jpg, .png, and .pdf")) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
