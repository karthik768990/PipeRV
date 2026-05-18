# PipeRV UI Additions

## 1. Space-Time Diagram Implementation
A scrolling 2D grid where rows=instructions and columns=cycles is crucial for tracking pipeline execution. 

## 2. Advanced Assembler
The built-in TypeScript assembler provides real-time linting and prevents invalid commands without communicating with a backend.

## 3. Dark/Light Theme Support
A comprehensive token-based theming system allowing users to switch between presentation modes depending on the context (e.g., light mode for academic reports, dark mode for late-night debugging).

## 4. IPC Warning Banner
Added a specific guard checking for `IPC > 1.0`. Since this indicates a core simulator logic bug, it acts as an immediate feedback mechanism for developers extending the pipeline logic.

## 5. Built-in Examples
Bubble Sort is automatically pre-loaded when starting the app or when selected from a dropdown. This minimizes setup time.
