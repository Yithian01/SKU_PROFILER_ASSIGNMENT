const express = require('express');
const app = express();
const indexRouter = require('./routes/index');
const path = require('path');
const pool = require('./db');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRouter);

const createTables = `
CREATE TABLE IF NOT EXISTS input_batch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cpu_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    core_id VARCHAR(10),
    task_id VARCHAR(10),
    throughput INT,
    batch_id INT,
    FOREIGN KEY (batch_id) REFERENCES input_batch(id)
);
`;

async function initializeDatabase() {
  try {
    const queries = createTables.split(';').map(q => q.trim()).filter(q => q.length > 0);
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('Tables created or already exist');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

// 서버 시작 전에 DB 초기화 실행 후 리스닝
initializeDatabase().then(() => {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
