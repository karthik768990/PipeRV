"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Cpu, Terminal, Activity, FileText, ChevronRight, Settings, Code, Zap } from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'overview', title: 'Overview', icon: BookOpen },
  { id: 'architecture', title: 'Pipeline Architecture', icon: Cpu },
  { id: 'memory', title: 'Virtual Memory', icon: Settings },
  { id: 'ide', title: 'Live ASM IDE', icon: Terminal },
  { id: 'performance', title: 'Performance Metrics', icon: Activity },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-2">
              Getting Started
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">PipeRV Documentation</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Welcome to the official documentation for the PipeRV Simulator. PipeRV is a high-performance, cycle-accurate 5-stage RISC-V pipeline simulator built for educational purposes and systems architecture analysis.
            </p>
            
            <div className="grid gap-6 mt-8 md:grid-cols-2">
              <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cycle-Accurate</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed step-by-step execution mirroring real hardware, including forwarding paths, stalls, and hazard detection.
                </p>
              </div>
              <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Assembly IDE</h3>
                <p className="text-muted-foreground text-sm">
                  Write, compile, and run RISC-V assembly directly in your browser with real-time feedback and syntax highlighting.
                </p>
              </div>
            </div>
          </div>
        );
      case 'architecture':
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-2">
              Core Engine
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Pipeline Architecture</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              PipeRV implements a classic 5-stage RISC-V pipeline: Fetch, Decode, Execute, Memory, and Writeback.
            </p>
            
            <div className="grid gap-4 mt-8 relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border/50 hidden md:block"></div>
              {[
                { name: 'Instruction Fetch (IF)', desc: 'Fetches the next instruction from memory using the PC. Handles branch prediction logic and updates PC.' },
                { name: 'Instruction Decode (ID)', desc: 'Decodes the instruction, reads operands from the Register File, and performs hazard detection.' },
                { name: 'Execute (EX)', desc: 'ALU operations, branch target calculation, and data forwarding logic are evaluated here.' },
                { name: 'Memory (MEM)', desc: 'Data memory access (load/store) including TLB translation and cache interactions.' },
                { name: 'Writeback (WB)', desc: 'Writes the computed result or loaded memory data back to the destination register.' },
              ].map((stage, idx) => (
                <div key={idx} className="relative flex items-start group">
                  <div className="hidden md:flex h-12 w-12 rounded-full border-4 border-background bg-muted items-center justify-center z-10 font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/20 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="md:ml-6 bg-card border border-border/50 p-6 rounded-2xl flex-1 hover:border-primary/30 transition-colors shadow-sm">
                    <div className="text-foreground font-bold text-lg mb-2">{stage.name}</div>
                    <p className="text-muted-foreground">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'memory':
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-2">
              Subsystems
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Virtual Memory Subsystem</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              PipeRV features a comprehensive virtual memory hierarchy, simulating address translation, TLB caching, and page faults.
            </p>
            <div className="space-y-6 mt-8">
              <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Settings className="mr-3 h-6 w-6 text-primary" />
                  Translation Lookaside Buffer (TLB)
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  The TLB caches recent virtual-to-physical address translations to speed up memory access. 
                  A <strong>TLB hit</strong> takes 1 cycle. A <strong>TLB miss</strong> incurs a penalty as the hardware must perform a page table walk.
                </p>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500 w-3/4"></div>
                  <div className="h-full bg-red-500 w-1/4"></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-muted-foreground font-medium">
                  <span>Typical Hit Rate (~75%)</span>
                  <span>Miss Penalty</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-4">Page Tables & Page Faults</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We simulate a multi-level page table structure. If a requested page is not present in physical RAM (invalid valid bit), 
                  a <strong>Page Fault exception</strong> is raised. The OS must then handle the fault, which is simulated by a large penalty (thousands of cycles).
                </p>
              </div>
            </div>
          </div>
        );
      case 'ide':
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-2">
              Interactive Tools
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Live ASM IDE</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              The built-in Monaco IDE allows you to write RISC-V assembly, compile it into machine code, and immediately simulate it without leaving the browser.
            </p>
            
            <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border border-border/40">
              <div className="bg-muted px-4 py-3 border-b border-border/40 flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                <span className="ml-4 text-xs font-mono text-muted-foreground">example.s</span>
              </div>
              <div className="bg-[#1e1e1e] p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <span className="text-[#569cd6]">.text</span><br/>
                <span className="text-[#569cd6]">.globl</span> <span className="text-[#dcdcaa]">_start</span><br/><br/>
                <span className="text-[#dcdcaa]">_start:</span><br/>
                &nbsp;&nbsp;<span className="text-[#c586c0]">li</span>&nbsp;&nbsp;t0, <span className="text-[#b5cea8]">10</span><br/>
                &nbsp;&nbsp;<span className="text-[#c586c0]">li</span>&nbsp;&nbsp;t1, <span className="text-[#b5cea8]">20</span><br/>
                &nbsp;&nbsp;<span className="text-[#c586c0]">add</span>&nbsp;t2, t0, t1<br/>
              </div>
            </div>
            
            <div className="pt-6">
              <Link href="/ide" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25">
                Open IDE Now <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary mb-2">
              Analytics
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Performance Metrics</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              After a simulation finishes, the dashboard provides a detailed performance breakdown so you can analyze bottlenecks.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 mt-8">
              {[
                { title: 'Instructions Per Cycle (IPC)', val: '1.0 - 0.5', desc: 'Higher is better. Max is 1.0 for scalar pipelines.' },
                { title: 'Total Execution Cycles', val: 'Variable', desc: 'Total clock cycles taken including stalls.' },
                { title: 'Data Hazard Stalls', val: 'Load-Use', desc: 'Cycles wasted waiting for memory loads.' },
                { title: 'Branch Mispredictions', val: 'Control', desc: 'Cycles wasted flushing the pipeline.' },
              ].map((metric, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold">{metric.title}</h4>
                    <Activity className="h-5 w-5 text-primary opacity-50" />
                  </div>
                  <div className="text-2xl font-black mb-1">{metric.val}</div>
                  <div className="text-sm text-muted-foreground">{metric.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur z-50">
        <Link className="flex items-center justify-center transition-transform hover:scale-105" href="/">
          <Cpu className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-xl tracking-tight">PipeRV Docs</span>
        </Link>
        <div className="ml-auto flex items-center space-x-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link href="/ide" className="text-sm font-medium hover:text-primary transition-colors">Live IDE</Link>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border/40 bg-card/30 hidden lg:block overflow-y-auto">
          <div className="p-6">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 px-2">
              Documentation
            </div>
            <nav className="space-y-1.5">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'opacity-70'}`} />
                      {section.title}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
          
          <div className="p-6 lg:p-16 max-w-4xl mx-auto min-h-full">
            {/* Mobile Nav Header */}
            <div className="lg:hidden mb-8 border-b border-border/40 pb-4 overflow-x-auto flex space-x-2 scrollbar-hide">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeSection === section.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
