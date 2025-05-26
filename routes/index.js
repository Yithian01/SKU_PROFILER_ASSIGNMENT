const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const multer = require('multer');

// 임시 폴더인 uploads 를 설정해준다. 
const upload = multer({ dest: 'uploads/' });

// 1. 메인 - batch 목록 DB에서 가져와 화면에 보여준다. ( 리스트로 )
router.get('/', async (req, res) => {
  try {
    const [batches] = await pool.query('SELECT * FROM input_batch ORDER BY created_at DESC');
    res.render('index', { batches });
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// 2. 리스트에 목록을 누르면 상세 정보 페이지로 이동한다.
router.get('/batch/:id', async (req, res) => {
  try {
    const batchId = req.params.id;
    const [[batch]] = await pool.query('SELECT * FROM input_batch WHERE id = ?', [batchId]);
    if (!batch) return res.status(404).send('Batch not found.');

    const [metrics] = await pool.query('SELECT * FROM cpu_metrics WHERE batch_id = ?', [batchId]);

    res.render('batchDetailChart', { batch, metrics });
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// 3. 형식에 맞는 .txt 파일을 임시폴더에서 읽어서 DB에 저장한다. BUT 잘못된 형식 트랜잭션 처리는 하지 않았다.
router.post('/upload', upload.single('inputFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const [result] = await pool.query('INSERT INTO input_batch (description) VALUES (?)', [req.file.originalname]);
    const batchId = result.insertId;

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('파일 내용이 너무 짧습니다.');
    }

    const firstLineCols = lines[0].trim().split(/\t+/);

    if (firstLineCols[0].toLowerCase() === 'core id' && firstLineCols[1].toLowerCase() === 'task id' && firstLineCols[2].toLowerCase() === 'throughput') {
      let lastCore = null;
      let taskCounter = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(/\t+/);
        const core = cols[0];
        let task = cols[1];
        const throughput = parseInt(cols[2]);

        if (core !== lastCore) {
          lastCore = core;
          taskCounter = 1;
        } else {
          taskCounter++;
        }

        if (!task || task.trim() === '') {
          task = `task${taskCounter}`;
        }

        if (isNaN(throughput)) {
          continue;
        }

        await pool.query(
          'INSERT INTO cpu_metrics (core_id, task_id, throughput, batch_id) VALUES (?, ?, ?, ?)',
          [core, task, throughput, batchId]
        );
      }

    } else {
      let headerLineIndex = 0;
      while (headerLineIndex < lines.length) {
        const maybeHeader = lines[headerLineIndex].trim();
        if (maybeHeader.startsWith('task1') || maybeHeader.startsWith('task')) {
          break;
        }
        headerLineIndex++;
      }
      if (headerLineIndex >= lines.length - 1) {
        throw new Error('헤더를 찾을 수 없거나 데이터가 부족합니다.');
      }

      const header = lines[headerLineIndex].trim().split(/\t+/);
      const taskCount = header.length; 
      const tasks = [];
      for (let i = 1; i <= taskCount; i++) {
        tasks.push(`task${i}`);
      }

      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(/\t+/);
        const core = cols[0];
        for (let j = 1; j < cols.length; j++) {
          const throughput = parseInt(cols[j]);
          if (!isNaN(throughput)) {
            const task = tasks[j - 1];
            await pool.query(
              'INSERT INTO cpu_metrics (core_id, task_id, throughput, batch_id) VALUES (?, ?, ?, ?)',
              [core, task, throughput, batchId]
            );
          }
        }
      }
    }

    fs.unlinkSync(filePath);

    res.redirect('/');
  } catch (e) {
    res.status(500).render('error', { message: "지원하지 않는 형식입니다.!!" });
  }
});



// 4. 배치 삭제 DB에 해당 항목 삭제한다.
router.post('/delete/:id', async (req, res) => {
  try {
    const batchId = req.params.id;
    await pool.query('DELETE FROM cpu_metrics WHERE batch_id = ?', [batchId]);
    await pool.query('DELETE FROM input_batch WHERE id = ?', [batchId]);
    res.redirect('/');
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
