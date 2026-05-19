# PipeRV Web Platform & Simulator Dashboard

This is the web platform for the PipeRV RISC-V Pipeline & Virtual Memory Simulator. It provides a polished, enterprise-grade interface to interact with the C++ simulator binary.

## Architecture

The platform follows a modern separated architecture:
- **Frontend (`/frontend`)**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend (`/backend`)**: Node.js, Express, Multer (for trace/config uploads). It manages child process execution of the simulator binary.
- **Simulator (`/`)**: The existing C++ PipeRV simulator.

## Getting Started Locally

### Prerequisites
- Node.js 20+
- The compiled `simulator` binary in the root directory or `build/` directory.

### Setup Backend
1. `cd backend`
2. `npm install`
3. `npm run dev` (Runs on port 3001)

### Setup Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on port 3000)

## Production Deployment

This project is fully Dockerized and production-ready.

### Using Docker Compose
Simply run:
```bash
docker-compose up --build -d
```
This will start both the frontend and backend services. Make sure the `build` directory containing your compiled simulator binary is present, as it is mounted into the backend container.

### Deploying to Vercel (Frontend)
1. Import the repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Framework Preset: `Next.js`.
4. Build Command: `npm run build`.

### Deploying to Render / Railway (Backend)
1. Import the repository into Render/Railway.
2. Set the Root Directory to `backend`.
3. Make sure to include a build step that compiles the C++ simulator before starting the Node server, or use a Docker deployment pointing to `backend/Dockerfile` (modified to copy the simulator source and run `make`).

## Features
- **Trace Upload**: Drag-and-drop trace files and configurations.
- **Real-Time Console**: Stream simulator output live in a VSCode-like terminal.
- **Statistics Dashboard**: Visual breakdown of total cycles, IPC, TLB Hits/Misses, Page Faults, and Stalls.
- **Live ASM IDE (`/ide`)**: Write RISC-V assembly directly in the browser using the integrated Monaco Editor.
  - **Auto-Assembly**: The backend automatically compiles supported instructions (e.g., `LW x5 0x1000`, `ADD x7 x5 x6`) into `.trace` files for immediate simulation.
  - **Live WebSockets Console**: See simulator execution output streamed instantly via `xterm.js` over Socket.io.
  - **Pipeline & Memory Visualizer**: Interactive live views of your Pipeline stages, TLB entries, and Page Table.
  - **Execution Controls**: Run, Stop, and Step actions for deep debugging.
