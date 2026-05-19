import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { parseAssemblyToTrace } from './assembler';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Existing REST APIs for file uploads
app.post('/api/upload', upload.fields([{ name: 'trace', maxCount: 1 }, { name: 'config', maxCount: 1 }]), (req, res) => {
    // ... logic remains similar but simplified since UI mainly uses WebSockets now
    res.json({ message: 'Upload via REST supported but WebSockets preferred for IDE.' });
});

// WebSocket Server for Live IDE
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let currentProcess: any = null;

  socket.on('run_asm', ({ code, config }) => {
    console.log(`Running ASM for client: ${socket.id}`);
    
    // Convert ASM to Trace
    const traceData = parseAssemblyToTrace(code);
    const tracePath = path.join(uploadDir, `${socket.id}.trace`);
    fs.writeFileSync(tracePath, traceData);

    let configPath = '';
    if (config) {
        configPath = path.join(uploadDir, `${socket.id}_config.txt`);
        fs.writeFileSync(configPath, config);
    }

    const isWin = process.platform === 'win32';
    const simulatorPath = process.env.SIMULATOR_PATH || path.join(__dirname, '../../simulator' + (isWin ? '.exe' : ''));

    if (!fs.existsSync(simulatorPath)) {
        socket.emit('execution_error', `Simulator binary not found at ${simulatorPath}`);
        return;
    }

    const args = ['--trace', tracePath];
    if (configPath) args.push('--config', configPath);

    if (currentProcess) currentProcess.kill();

    currentProcess = spawn(simulatorPath, args);
    socket.emit('execution_start');

    currentProcess.stdout.on('data', (data: any) => {
        const out = data.toString();
        socket.emit('execution_log', out);
        // Naive line-by-line streaming parser for stepping logic can be handled in frontend
    });

    currentProcess.stderr.on('data', (data: any) => {
        socket.emit('execution_error', data.toString());
    });

    currentProcess.on('close', (code: number) => {
        socket.emit('execution_end', { code });
        currentProcess = null;
    });

    // Timeout
    setTimeout(() => {
        if (currentProcess) {
            currentProcess.kill();
            socket.emit('execution_error', 'Execution timed out (30s limit).');
        }
    }, 30000);
  });

  socket.on('stop_execution', () => {
      if (currentProcess) {
          currentProcess.kill();
          currentProcess = null;
          socket.emit('execution_end', { code: -1, killed: true });
      }
  });

  socket.on('disconnect', () => {
    if (currentProcess) currentProcess.kill();
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Backend API running on port ${port}`);
});
