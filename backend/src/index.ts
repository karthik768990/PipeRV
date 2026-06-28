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

const jobs = new Map<string, any>();

app.post('/api/upload', upload.fields([{ name: 'trace', maxCount: 1 }, { name: 'config', maxCount: 1 }]), (req, res) => {
    const traceFile = (req.files as any)['trace']?.[0];
    const configFile = (req.files as any)['config']?.[0];
    
    if (!traceFile && !configFile) return res.status(400).json({ error: 'No files uploaded' });
    
    const jobId = Date.now().toString();
    jobs.set(jobId, { status: 'uploaded', tracePath: traceFile?.path, configPath: configFile?.path, logs: [] });
    
    res.json({ jobId });
});
app.get('/',(req,res)=>{
    res.json({ status: 200,health: "Ok" });

})

app.post('/api/run/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    if (typeof jobId !== 'string' || jobId.length > 50) return res.status(400).json({ error: 'Invalid Job ID format' });
    
    const job = jobs.get(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    job.status = 'running';
    job.logs = [];
    res.json({ success: true });
    
    const isWin = process.platform === 'win32';
    const simulatorPath = process.env.SIMULATOR_PATH || path.join(__dirname, '../../simulator' + (isWin ? '.exe' : ''));
    
    if (!fs.existsSync(simulatorPath)) {
        job.status = 'failed';
        job.logs.push(`Simulator binary not found at ${simulatorPath}`);
        return;
    }

    const args = [];
    if (job.tracePath) { args.push('--trace'); args.push(job.tracePath); }
    if (job.configPath) { args.push('--config'); args.push(job.configPath); }
    
    const proc = spawn(simulatorPath, args, { cwd: path.join(__dirname, '../../') });
    proc.stdout.on('data', data => {
      const text = data.toString();
      text.split('\n').forEach((line: string) => { if (line.trim()) job.logs.push(line); });
    });
    proc.stderr.on('data', data => job.logs.push('[ERROR] ' + data.toString()));
    proc.on('close', code => {
        job.status = code === 0 ? 'completed' : 'failed';
        // Mock stats until proper parser is integrated
        job.result = { totalCycles: 2304, ipc: 0.92, tlbHits: 432, tlbMisses: 12, pageFaults: 2, evictions: 0, stalls: 124 }; 
    });
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json({ status: job.status, logs: job.logs });
});

app.get('/api/results/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json({ result: job.result });
});

// WebSocket Server for Live IDE
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let currentProcess: any = null;

  socket.on('run_asm', ({ code, config }) => {
    // Basic Security: Input Validation & Payload Size Limiting
    if (typeof code !== 'string' || code.length > 500000) { // Limit to 500KB
        socket.emit('execution_error', 'Invalid payload: Assembly code exceeds maximum size limit (500KB).');
        return;
    }
    if (config && (typeof config !== 'string' || config.length > 50000)) {
        socket.emit('execution_error', 'Invalid payload: Configuration exceeds maximum size limit (50KB).');
        return;
    }

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

    currentProcess = spawn(simulatorPath, args, { cwd: path.join(__dirname, '../../') });
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
