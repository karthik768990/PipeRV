from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import subprocess
import json
import asyncio

app = FastAPI()

class MemoryInit(BaseModel):
    addr: int
    value: int

class Config(BaseModel):
    forwarding_enabled: bool
    IF_latency: int
    ID_latency: int
    EX_latency: int
    MEM_latency: int
    WB_latency: int
    cache_enabled: bool
    L1_cache_size: int
    L1_block_size: int
    L1_miss_penalty: int

class LoadRequest(BaseModel):
    asm: str
    memory: List[MemoryInit]
    config: Config

# Since the C++ core doesn't natively support JSON over stdin yet (unless we compiled an interactive wrapper),
# we simulate the structure of the API. In a real scenario, this would communicate via IPC with the running simulator.

current_state = {}

@app.post("/api/load")
async def load_program(req: LoadRequest):
    global current_state
    # This would execute the C++ binary or write to its stdin
    # For now, it's just a mock that sets an initial state
    current_state = {"status": "loaded", "asm": req.asm}
    return {"status": "ok"}

@app.post("/api/step")
async def step():
    # Invoke step on the C++ process
    return {"cycle": 1, "halted": False} # Mock

@app.post("/api/run")
async def run():
    return {"cycle": 100, "halted": True}

@app.post("/api/reset")
async def reset():
    return {"cycle": 0, "halted": False}

@app.get("/api/config")
async def get_config():
    return {}

@app.put("/api/config")
async def set_config(config: Config):
    return {"status": "ok"}

@app.websocket("/ws/simulate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        # Stream states back
        await websocket.send_text(json.dumps({"cycle": 1}))
