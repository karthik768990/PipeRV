"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, Play, FileText, Settings, Terminal, Activity, BarChart, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("setup");
  const [traceFile, setTraceFile] = useState<File | null>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "trace" | "config") => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === "trace") setTraceFile(e.target.files[0]);
      if (type === "config") setConfigFile(e.target.files[0]);
      toast({
        title: "File attached",
        description: `${e.target.files[0].name} ready for simulation.`,
        variant: "success",
      });
    }
  };

  const runSimulation = async () => {
    if (!traceFile && !configFile) {
      return toast({
        title: "Upload Required",
        description: "Please upload at least a trace or config file before running.",
        variant: "destructive",
      });
    }
    
    setStatus("uploading");
    
    const formData = new FormData();
    if (traceFile) formData.append("trace", traceFile);
    if (configFile) formData.append("config", configFile);

    try {
      // Backend is expected to be running on API_URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.jobId) throw new Error("Upload failed");
      
      setJobId(uploadData.jobId);
      setStatus("running");
      setActiveTab("console");

      await fetch(`${API_URL}/api/run/${uploadData.jobId}`, { method: "POST" });
      
      // Poll for status
      const interval = setInterval(async () => {
        const statusRes = await fetch(`${API_URL}/api/status/${uploadData.jobId}`);
        const statusData = await statusRes.json();
        
        setLogs(statusData.logs);
        
        if (statusData.status === "completed" || statusData.status === "failed") {
          clearInterval(interval);
          setStatus(statusData.status);
          
          if (statusData.status === "completed") {
            const resultsRes = await fetch(`${API_URL}/api/results/${uploadData.jobId}`);
            const resultsData = await resultsRes.json();
            setResults(resultsData.result);
            setActiveTab("stats");
          }
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      setStatus("failed");
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <Link href="/" className="h-16 flex items-center px-6 border-b border-border font-bold text-lg hover:text-primary transition-colors">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          PipeRV
        </Link>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("setup")}
            className={`flex items-center w-full px-4 py-2 rounded-md transition-colors ${activeTab === 'setup' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <Settings className="mr-3 h-4 w-4" /> Setup & Run
          </button>
          <button 
            onClick={() => setActiveTab("console")}
            className={`flex items-center w-full px-4 py-2 rounded-md transition-colors ${activeTab === 'console' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <Terminal className="mr-3 h-4 w-4" /> Execution Console
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            disabled={!results}
            className={`flex items-center w-full px-4 py-2 rounded-md transition-colors ${!results ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'stats' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <BarChart className="mr-3 h-4 w-4" /> Statistics Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("viz")}
            disabled={!results}
            className={`flex items-center w-full px-4 py-2 rounded-md transition-colors ${!results ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'viz' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <Database className="mr-3 h-4 w-4" /> TLB/VM Visualization
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 flex items-center px-8 border-b border-border bg-background">
          <h1 className="text-xl font-semibold capitalize">
            {activeTab === 'setup' ? 'Simulator Setup' : activeTab === 'console' ? 'Execution Console' : activeTab === 'stats' ? 'Statistics' : 'Visualizations'}
          </h1>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground flex items-center">
              Status: 
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                status === 'idle' ? 'bg-secondary text-secondary-foreground' :
                status === 'running' || status === 'uploading' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {status.toUpperCase()}
              </span>
            </span>
          </div>
        </header>

        <div className="p-8 flex-1 max-w-6xl mx-auto w-full">
          {activeTab === "setup" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-border rounded-xl p-6 bg-card">
                <h3 className="text-lg font-medium mb-4 flex items-center"><FileText className="mr-2 h-5 w-5" /> Trace File</h3>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-primary/50 cursor-pointer relative">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "trace")} />
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">{traceFile ? traceFile.name : "Drag & drop or click to upload"}</p>
                  <p className="text-xs text-muted-foreground mt-2">Supports .trace files</p>
                </div>
              </div>

              <div className="border border-border rounded-xl p-6 bg-card">
                <h3 className="text-lg font-medium mb-4 flex items-center"><Settings className="mr-2 h-5 w-5" /> Config File (Optional)</h3>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-primary/50 cursor-pointer relative">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "config")} />
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">{configFile ? configFile.name : "Drag & drop or click to upload"}</p>
                  <p className="text-xs text-muted-foreground mt-2">Supports .txt config files</p>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button 
                  onClick={runSimulation}
                  disabled={status === 'running' || status === 'uploading'}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-medium flex items-center transition-all disabled:opacity-50"
                >
                  {status === 'running' ? (
                    <><Activity className="animate-spin mr-2 h-5 w-5" /> Executing...</>
                  ) : (
                    <><Play className="mr-2 h-5 w-5" /> Run Simulation</>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "console" && (
            <div className="h-full border border-border rounded-xl bg-[#0d1117] overflow-hidden flex flex-col font-mono text-sm shadow-xl">
              <div className="bg-[#161b22] px-4 py-2 border-b border-border/50 flex items-center">
                <Terminal className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-muted-foreground text-xs">simulator_execution.log</span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground italic">Waiting for simulator output...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : 'text-green-400/90'}`}>
                      <span className="text-gray-600 mr-4">{(i+1).toString().padStart(4, '0')}</span>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "stats" && results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Cycles" value={results.totalCycles} />
                <StatCard title="IPC" value={results.ipc?.toFixed(2) || 0} />
                <StatCard title="TLB Hits" value={results.tlbHits} trend="good" />
                <StatCard title="TLB Misses" value={results.tlbMisses} trend="bad" />
                <StatCard title="Page Faults" value={results.pageFaults} trend="bad" />
                <StatCard title="Evictions" value={results.evictions} trend="neutral" />
                <StatCard title="Stalls" value={results.stalls} trend="bad" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="border border-border bg-card p-6 rounded-xl">
                  <h3 className="font-semibold mb-4 text-lg">TLB Performance</h3>
                  {/* Mock Chart Area */}
                  <div className="h-64 flex items-end space-x-4 border-l border-b border-border p-4">
                    <div className="bg-green-500/80 w-1/2 rounded-t-sm transition-all duration-1000" style={{ height: '80%' }}>
                      <p className="text-center mt-2 text-xs text-white">Hits</p>
                    </div>
                    <div className="bg-red-500/80 w-1/2 rounded-t-sm transition-all duration-1000" style={{ height: '20%' }}>
                      <p className="text-center mt-2 text-xs text-white">Misses</p>
                    </div>
                  </div>
                </div>
                <div className="border border-border bg-card p-6 rounded-xl">
                  <h3 className="font-semibold mb-4 text-lg">Cycle Breakdown</h3>
                  {/* Mock Chart Area */}
                  <div className="h-64 flex items-end space-x-4 border-l border-b border-border p-4">
                    <div className="bg-blue-500/80 w-1/2 rounded-t-sm transition-all duration-1000" style={{ height: '85%' }}>
                      <p className="text-center mt-2 text-xs text-white">Execute</p>
                    </div>
                    <div className="bg-yellow-500/80 w-1/2 rounded-t-sm transition-all duration-1000" style={{ height: '15%' }}>
                      <p className="text-center mt-2 text-xs text-white">Stall</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "viz" && results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="border border-border bg-card rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-6 flex items-center"><Database className="mr-2 h-5 w-5"/> Virtual Memory Viewer</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">TLB Current State (Mock)</h4>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 bg-background border border-border rounded-lg text-sm font-mono">
                          <span className="text-muted-foreground">Index: {i}</span>
                          <span className="text-blue-400">VPN: 0x{Math.floor(Math.random()*10000).toString(16)}</span>
                          <span className="text-green-400">PFN: 0x{Math.floor(Math.random()*100).toString(16)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Page Table Excerpt (Mock)</h4>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 bg-background border border-border rounded-lg text-sm font-mono">
                          <span className="text-muted-foreground">PTE: {Math.floor(Math.random()*100)}</span>
                          <span className="text-yellow-400">Valid: 1</span>
                          <span className="text-purple-400">Dirty: {i%2}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string, value: string | number, trend?: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
      </div>
    </div>
  );
}
