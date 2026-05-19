"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimulatorStore } from '@/store/simulatorStore';
import DebugToolbar from '@/components/simulator/DebugToolbar';
import RegisterPanel from '@/components/simulator/RegisterPanel';
import MemoryPanel from '@/components/simulator/MemoryPanel';
import PipelineVisualization from '@/components/simulator/PipelineVisualization';
import ConsolePanel from '@/components/simulator/ConsolePanel';
import PerformancePanel from '@/components/simulator/PerformancePanel';
import ConfigPanel from '@/components/simulator/ConfigPanel';
import DatapathVisualization from '@/components/simulator/DatapathVisualization';
import PipelineTimingDiagram from '@/components/simulator/PipelineTimingDiagram';
import {
  Cpu, Layers, BarChart3, Settings, MemoryStick, GitBranch,
  Timer, PanelLeftClose, PanelLeftOpen, PanelBottomClose, PanelBottomOpen,
  Code2, BookOpen, FileText,
} from 'lucide-react';
import type { ActivePanel } from '@/store/simulatorStore';

// Monaco editor - dynamic import
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0d1117] text-muted-foreground text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground/60">Loading editor…</span>
      </div>
    </div>
  ),
});

const SNIPPETS = [
  {
    name: 'Simple Addition',
    icon: '➕',
    code: `# Simple addition example
addi x1, x0, 10
addi x2, x0, 20
add x3, x1, x2
sw x3, 0(x0)`,
  },
  {
    name: 'Data Hazard Demo',
    icon: '⚠️',
    code: `# Data hazard demonstration
# Shows load-use hazard
addi x1, x0, 42
sw x1, 0(x0)
lw x2, 0(x0)
add x3, x2, x1    # Hazard: x2 not ready
addi x4, x3, 1`,
  },
  {
    name: 'Forwarding Demo',
    icon: '🔄',
    code: `# Forwarding demonstration
# Enable forwarding to see the difference
addi x1, x0, 5
addi x2, x0, 3
add x3, x1, x2    # Uses x1, x2
sub x4, x3, x1    # Forward x3 from EX
add x5, x4, x3    # Forward x4 from EX, x3 from MEM`,
  },
  {
    name: 'Loop Counter',
    icon: '🔁',
    code: `# Loop counting from 5 down to 0
addi x1, x0, 5
addi x2, x0, 0

loop:
addi x1, x1, -1
addi x2, x2, 1
bne x1, x0, loop

sw x2, 0(x0)`,
  },
  {
    name: 'Bubble Sort',
    icon: '📊',
    code: `# Bubble Sort for 5 elements
addi x1, x0, 5
sw x1, 0(x0)
addi x1, x0, 1
sw x1, 4(x0)
addi x1, x0, 4
sw x1, 8(x0)
addi x1, x0, 2
sw x1, 12(x0)
addi x1, x0, 8
sw x1, 16(x0)

addi x10, x0, 5
addi x11, x0, 0

outer_loop:
addi x12, x10, -1
sub x13, x11, x12
bne x13, x0, inner_init
jal x0, end

inner_init:
addi x14, x0, 0

inner_loop:
sub x15, x10, x11
addi x15, x15, -1
sub x16, x14, x15
bne x16, x0, compare
jal x0, outer_inc

compare:
add x17, x14, x14
add x17, x17, x17
lw x18, 0(x17)
addi x19, x17, 4
lw x20, 0(x19)
blt x20, x18, do_swap
jal x0, skip_swap

do_swap:
sw x20, 0(x17)
sw x18, 0(x19)

skip_swap:
addi x14, x14, 1
jal x0, inner_loop

outer_inc:
addi x11, x11, 1
jal x0, outer_loop

end:
nop
nop`,
  },
];

const RIGHT_PANELS: { id: ActivePanel; label: string; icon: React.ElementType }[] = [
  { id: 'registers', label: 'Registers', icon: Cpu },
  { id: 'memory', label: 'Memory', icon: MemoryStick },
  { id: 'pipeline', label: 'Pipeline', icon: Layers },
  { id: 'datapath', label: 'Datapath', icon: GitBranch },
  { id: 'timing', label: 'Timing', icon: Timer },
  { id: 'performance', label: 'Stats', icon: BarChart3 },
  { id: 'config', label: 'Config', icon: Settings },
];

export default function SimulatorIDE() {
  const {
    code, setCode, status, parseErrors, breakpoints,
    activeRightPanel, setActiveRightPanel,
    showSidebar, toggleSidebar,
    showBottomPanel, toggleBottomPanel,
    loadProgram, stepCycle,
    pc, pipelineStages,
  } = useSimulatorStore();

  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
  const resizingRef = useRef<'right' | 'bottom' | null>(null);
  const editorRef = useRef<any>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        loadProgram();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        const { status: s, run, pause } = useSimulatorStore.getState();
        if (s === 'running') pause();
        else run();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        stepCycle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loadProgram, stepCycle]);

  // Panel resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (resizingRef.current === 'right') {
        setRightPanelWidth(Math.max(280, Math.min(700, window.innerWidth - e.clientX)));
      }
      if (resizingRef.current === 'bottom') {
        setBottomPanelHeight(Math.max(120, Math.min(500, window.innerHeight - e.clientY)));
      }
    };
    const onUp = () => { resizingRef.current = null; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Monaco editor setup
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register RISC-V language
    monaco.languages.register({ id: 'riscv' });
    monaco.languages.setMonarchTokensProvider('riscv', {
      tokenizer: {
        root: [
          [/#.*$/, 'comment'],
          [/\/\/.*$/, 'comment'],
          [/\b(add|sub|addi|mul|and|or|xor|andi|ori|xori|sll|srl|sra|slli|srli|srai|slt|sltu|slti|sltiu|lui|auipc|nop)\b/i, 'keyword'],
          [/\b(lw|sw|lb|lh|lbu|lhu|sb|sh)\b/i, 'keyword.memory'],
          [/\b(beq|bne|blt|bge|bltu|bgeu|jal|jalr)\b/i, 'keyword.branch'],
          [/\b(x\d{1,2}|zero|ra|sp|gp|tp|fp|t[0-6]|s[0-9]|s1[0-1]|a[0-7])\b/i, 'variable'],
          [/\b0x[0-9a-fA-F]+\b/, 'number.hex'],
          [/\b-?\d+\b/, 'number'],
          [/[a-zA-Z_]\w*:/, 'type.identifier'],
        ],
      },
    });

    monaco.editor.defineTheme('piperv-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: '79c0ff', fontStyle: 'bold' },
        { token: 'keyword.memory', foreground: 'd2a8ff', fontStyle: 'bold' },
        { token: 'keyword.branch', foreground: 'ffa657', fontStyle: 'bold' },
        { token: 'variable', foreground: '7ee787' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'number.hex', foreground: '56d4dd' },
        { token: 'type.identifier', foreground: 'ffa657', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2266',
        'editor.selectionBackground': '#264f7844',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'editorGutter.background': '#0d1117',
        'editor.selectionHighlightBackground': '#3fb95020',
      },
    });

    monaco.editor.setTheme('piperv-dark');

    // Breakpoint gutter click
    editor.onMouseDown((e: any) => {
      if (e.target?.type === 2 || e.target?.type === 3) { // gutter line numbers or margin
        const line = e.target.position?.lineNumber;
        if (line) useSimulatorStore.getState().toggleBreakpoint(line);
      }
    });

    // RISC-V completions
    monaco.languages.registerCompletionItemProvider('riscv', {
      provideCompletionItems: () => ({
        suggestions: [
          ...['add', 'sub', 'addi', 'mul', 'and', 'or', 'xor', 'sll', 'srl', 'sra',
              'lw', 'sw', 'beq', 'bne', 'blt', 'bge', 'jal', 'jalr', 'lui', 'auipc', 'nop'
          ].map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: op,
          })),
          ...Array.from({ length: 32 }, (_, i) => ({
            label: `x${i}`,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: `x${i}`,
          })),
        ],
      }),
    });
  }, []);

  // Update editor decorations for breakpoints and current PC
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const decorations: any[] = [];

    // Breakpoints
    for (const [line, bp] of Array.from(breakpoints.entries())) {
      if (bp.enabled) {
        decorations.push({
          range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
          options: {
            isWholeLine: true,
            glyphMarginClassName: 'breakpoint-glyph',
            className: 'breakpoint-line',
          },
        });
      }
    }

    // Current PC indicator
    if (status !== 'idle' && pc >= 0) {
      const cpu = useSimulatorStore.getState().cpu;
      if (cpu && pc < cpu.instructions.length) {
        const instrLine = cpu.instructions[pc].sourceLine;
        if (instrLine) {
          decorations.push({
            range: { startLineNumber: instrLine, startColumn: 1, endLineNumber: instrLine, endColumn: 1 },
            options: {
              isWholeLine: true,
              className: 'current-pc-line',
              glyphMarginClassName: 'current-pc-glyph',
            },
          });
        }
      }
    }

    // Parse errors
    for (const err of parseErrors) {
      decorations.push({
        range: { startLineNumber: err.line, startColumn: 1, endLineNumber: err.line, endColumn: 1000 },
        options: {
          isWholeLine: true,
          className: err.severity === 'error' ? 'error-line' : 'warning-line',
          hoverMessage: { value: err.message },
        },
      });
    }

    editor.deltaDecorations?.(editor.__prevDecorations || [], decorations);
    editor.__prevDecorations = decorations.map((_: any, i: number) => `decoration-${i}`);
  }, [breakpoints, pc, status, parseErrors]);

  const renderRightPanel = () => {
    switch (activeRightPanel) {
      case 'registers': return <RegisterPanel />;
      case 'memory': return <MemoryPanel />;
      case 'pipeline': return <PipelineVisualization />;
      case 'datapath': return <DatapathVisualization />;
      case 'timing': return <PipelineTimingDiagram />;
      case 'performance': return <PerformancePanel />;
      case 'config': return <ConfigPanel />;
      default: return <RegisterPanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Debug Toolbar */}
      <DebugToolbar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══════ Left Sidebar (Snippets) ═══════ */}
        {showSidebar && (
          <aside className="w-56 border-r border-border/40 bg-[#0d1117] flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Examples</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {SNIPPETS.map((snip, idx) => (
                <button
                  key={idx}
                  onClick={() => setCode(snip.code)}
                  className="w-full text-left px-2.5 py-2 text-xs rounded-md hover:bg-muted/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{snip.icon}</span>
                    <span className="text-foreground/80 group-hover:text-foreground font-medium">{snip.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick info */}
            <div className="px-3 py-2 border-t border-border/40 text-[10px] text-muted-foreground/60 space-y-0.5">
              <div className="flex justify-between">
                <span>Ctrl+Enter</span><span>Assemble</span>
              </div>
              <div className="flex justify-between">
                <span>F5</span><span>Run/Pause</span>
              </div>
              <div className="flex justify-between">
                <span>F10</span><span>Step Cycle</span>
              </div>
            </div>
          </aside>
        )}

        {/* ═══════ Center: Editor ═══════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor header */}
          <div className="h-8 bg-[#161b22] border-b border-border/30 flex items-center px-3 shrink-0">
            <button onClick={toggleSidebar} className="p-1 mr-2 hover:bg-muted/30 rounded transition-colors">
              {showSidebar ? <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <Code2 className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <span className="text-[11px] font-medium text-muted-foreground">program.asm</span>
            <div className="flex-1" />
            <button onClick={toggleBottomPanel} className="p-1 hover:bg-muted/30 rounded transition-colors">
              {showBottomPanel ? <PanelBottomClose className="w-3.5 h-3.5 text-muted-foreground" /> : <PanelBottomOpen className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>

          {/* Editor + Bottom panel */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Monaco Editor */}
            <div className="flex-1 relative min-h-0">
              <Editor
                height="100%"
                defaultLanguage="riscv"
                theme="piperv-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                  fontLigatures: true,
                  lineHeight: 22,
                  padding: { top: 12, bottom: 12 },
                  glyphMargin: true,
                  folding: false,
                  renderLineHighlight: 'all',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>

            {/* Bottom panel resize handle */}
            {showBottomPanel && (
              <>
                <div
                  className="h-1 bg-border/20 hover:bg-sky-500/30 cursor-row-resize transition-colors shrink-0"
                  onMouseDown={() => { resizingRef.current = 'bottom'; document.body.style.cursor = 'row-resize'; }}
                />
                <div className="shrink-0" style={{ height: bottomPanelHeight }}>
                  <ConsolePanel />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══════ Right panel resize handle ═══════ */}
        <div
          className="w-1 bg-border/20 hover:bg-sky-500/30 cursor-col-resize transition-colors shrink-0"
          onMouseDown={() => { resizingRef.current = 'right'; document.body.style.cursor = 'col-resize'; }}
        />

        {/* ═══════ Right Panel ═══════ */}
        <div className="flex shrink-0" style={{ width: rightPanelWidth }}>
          {/* Panel tab bar (vertical) */}
          <div className="w-10 bg-[#0d1117] border-r border-border/30 flex flex-col items-center py-2 gap-1 shrink-0">
            {RIGHT_PANELS.map(panel => {
              const Icon = panel.icon;
              const isActive = activeRightPanel === panel.id;
              return (
                <button
                  key={panel.id}
                  onClick={() => setActiveRightPanel(panel.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-sky-500/15 text-sky-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  title={panel.label}
                >
                  <Icon className="w-4 h-4" />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {panel.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div className="flex-1 min-w-0 bg-card/30">
            {renderRightPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
