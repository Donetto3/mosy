const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 5000;

app.use(cors());
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + ".mp4"),
});

const upload = multer({ storage });

app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ message: "Видео загружено!" });
});

app.get("/videos", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ error: "Ошибка чтения" });
    res.json(files);
  });
});

app.listen(port, () => console.log(`Сервер работает на http://localhost:${port}`));