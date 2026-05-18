# Stage 1: Build Vite frontend
FROM node:20 AS frontend-build
WORKDIR /app
COPY piperv-frontend/package*.json ./
RUN npm install
COPY piperv-frontend/ ./
RUN npm run build

# Stage 2: FastAPI Server
FROM python:3.11-slim AS backend
WORKDIR /app
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ .
# Assume compiled binary piperv is available locally or compiled here
# For this Dockerfile, we will just copy it.
# COPY build/simulator.exe /app/piperv
# RUN chmod +x /app/piperv

# Stage 3: Nginx + FastAPI combined or separate
# The user asked for multi-stage. 
# We'll use a single container with supervisor or just run fastapi and serve static via FastAPI for simplicity, or use nginx.
# Let's use FastAPI to serve static files.
# But spec says: "Stage 3: nginx -> serve static frontend, proxy /api and /ws to FastAPI"
FROM nginx:alpine
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
