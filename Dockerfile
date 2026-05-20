# ═══════════════════════════════════════════════════════════════════════
# PipeRV Backend Dockerfile
# Compiles the C++ Simulator and runs the Node.js Express backend
# ═══════════════════════════════════════════════════════════════════════

# Use an official Node runtime as a parent image
FROM node:20-bullseye

# Install C++ compiler and build tools required for the simulator
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory for the application
WORKDIR /app

# 1. Copy the C++ simulator source code and compile it
COPY include/ ./include/
COPY src/ ./src/
COPY vm_config.txt ./

# Remove wasm_bridge.cpp because we are building a native Linux binary, not WebAssembly
RUN rm -f src/wasm_bridge.cpp

# Compile all C++ files in src/ and src/vm/ subdirectory into a Linux executable
RUN g++ -O3 -I include src/*.cpp src/vm/*.cpp -o simulator

# 2. Setup the Node.js Backend
WORKDIR /app/backend

# Copy package.json and install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY backend/ ./

# Build the TypeScript backend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Set Environment Variables for Production
ENV PORT=3001
ENV NODE_ENV=production
# Map the Node server to the freshly compiled Linux simulator binary
ENV SIMULATOR_PATH=/app/simulator

# Command to run the backend
CMD ["npm", "start"]
