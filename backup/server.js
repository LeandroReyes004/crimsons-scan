const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let clients = [];

app.get('/api/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

function broadcastLog(data) {
  clients.forEach(client => client.write(`data: ${JSON.stringify({ text: data })}\n\n`));
}

const activeProcesses = {
  db: false,
  r2: false,
  zip: false
};

function runTask(taskId, command, args) {
  if (activeProcesses[taskId]) {
    broadcastLog(`⚠️ La tarea de ${taskId} ya está en ejecución.\n`);
    return;
  }
  
  activeProcesses[taskId] = true;
  broadcastLog(`\n🚀 INICIANDO: ${command} ${args.join(' ')}\n`);
  
  const child = spawn(command, args, { shell: true, cwd: __dirname });

  child.stdout.on('data', (data) => {
    broadcastLog(data.toString());
  });

  child.stderr.on('data', (data) => {
    broadcastLog(`ERROR: ${data.toString()}`);
  });

  child.on('close', (code) => {
    activeProcesses[taskId] = false;
    broadcastLog(`\n✅ TAREA '${taskId}' FINALIZADA (Código: ${code})\n`);
  });
}

app.post('/api/backup/db', (req, res) => {
  runTask('db', 'npm', ['run', 'backup:db']);
  res.json({ success: true });
});

app.post('/api/backup/r2', (req, res) => {
  runTask('r2', 'npm', ['run', 'backup:r2']);
  res.json({ success: true });
});

app.post('/api/backup/zip', (req, res) => {
  runTask('zip', 'npm', ['run', 'backup:zip']);
  res.json({ success: true });
});

app.listen(PORT, async () => {
  console.log(`\n==============================================`);
  console.log(`🌐 GUI DE BACKUPS LISTA EN: http://localhost:${PORT}`);
  console.log(`==============================================\n`);
  
  spawn('cmd', ['/c', 'start', `http://localhost:${PORT}`]);
});
