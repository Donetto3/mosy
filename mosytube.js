// ==== server/index.js ====
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 5000;

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ message: "Видео загружено!", filename: req.file.filename });
});

app.get("/videos", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ error: "Ошибка чтения" });
    const sorted = files.sort((a, b) => fs.statSync(`uploads/${b}`).ctimeMs - fs.statSync(`uploads/${a}`).ctimeMs);
    res.json(sorted);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => console.log(`Сервер работает на http://localhost:${port}`));


// ==== client/src/App.js ====
import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!video) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("video", video);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message);
      fetchVideos();
    } catch (e) {
      setMessage("Ошибка загрузки файла");
    }
    setLoading(false);
  };

  const fetchVideos = async () => {
    const res = await fetch("/videos");
    const data = await res.json();
    setVideos(data);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="App" style={{ fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ textAlign: "center" }}>🎥 Mosytube</h1>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => setVideo(e.target.files[0])}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Загрузка..." : "Загрузить"}
        </button>
      </div>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2 style={{ marginTop: "2rem" }}>📺 Последние видео:</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {videos.map((file, i) => (
          <div key={i} style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "0.5rem" }}>
            <video width="100%" controls style={{ borderRadius: "8px" }}>
              <source src={`/uploads/${file}`} type="video/mp4" />
            </video>
            <p style={{ wordBreak: "break-all", fontSize: "0.9rem", marginTop: "0.3rem" }}>{file}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;


// ==== root package.json ====
{
  "name": "mosytube",
  "scripts": {
    "start": "node server/index.js",
    "client": "cd client && npm start",
    "dev": "concurrently \"npm run start\" \"npm run client\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}


// ==== Инструкции по запуску ====

/*
1. После разработки фронтенда (в папке client):
   npm run build
   и скопируй содержимое client/build в server/public

2. Не забудь создать папку uploads/ в корне проекта:
   mkdir uploads

3. Запуск проекта локально:
   npm install && npm run dev
*/
