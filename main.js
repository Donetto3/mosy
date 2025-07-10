const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Папка для хранения видео
const VIDEOS_DIR = path.join(__dirname, 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR);
}

// Используем multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    // Чтобы не было коллизий, добавим дату в имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 ГБ
});

// Простая БД в JSON (в реальном проекте — настоящая база)
const DB_FILE = path.join(__dirname, 'db.json');
let db = { videos: [] };

// Загрузить БД из файла
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    try {
      db = JSON.parse(data);
    } catch {
      db = { videos: [] };
    }
  }
}
// Сохранить БД в файл
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
loadDB();

// Получить список видео
app.get('/videos', (req, res) => {
  res.json(db.videos);
});

// Отдать видео файл по id
app.get('/videos/file/:filename', (req, res) => {
  const filePath = path.join(VIDEOS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Видео не найдено');
  }
});

// Загрузить новое видео
app.post('/videos', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл видео обязателен' });
  }
  const { title, desc } = req.body;
  const video = {
    id: Date.now().toString(),
    title: title || 'Без названия',
    desc: desc || '',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadDate: new Date().toISOString(),
  };
  db.videos.push(video);
  saveDB();
  res.json(video);
});

// Удалить видео по id
app.delete('/videos/:id', (req, res) => {
  const id = req.params.id;
  const videoIndex = db.videos.findIndex(v => v.id === id);
  if (videoIndex === -1) return res.status(404).json({ error: 'Видео не найдено' });

  // Удаляем файл
  const filename = db.videos[videoIndex].filename;
  const filePath = path.join(VIDEOS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Удаляем из БД
  db.videos.splice(videoIndex, 1);
  saveDB();
  res.json({ message: 'Видео удалено' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
