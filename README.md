# DSPro: Universal Code Visualization Engine

**DSPro** is a high-fidelity, universal algorithm simulation and visualization platform. It combines static C++ analysis, advanced AI-driven state management, and pixel-perfect canvas rendering to provide deep academic insights into data structures and algorithms.

---

## 🚀 Key Features

### 1. Pixel-Perfect Multi-Engine Rendering
*   **Custom Konva Renderers**: Dedicated canvas-based visualization for all major data structures.
*   **Hierarchical Tree Logic**: Support for **Threaded Binary Trees (TBT)** with dashed threads, **Red-Black Trees** with color-coding, and **AVL Trees** with balance factors.
*   **Dynamic Layouts**: 
    *   **Top-Down Linked Lists**: Clean vertical flows with HEAD and NULL markers.
    *   **Vertical Queues**: Clear FRONT and REAR pointer tracking.
    *   **Visual Stacks**: Intuitive LIFO representation.

### 2. High-Fidelity AI Simulation
*   **Virtual Execution Machine**: Powered by **Llama-4 Maverick**, the system performs an intelligent "dry run" of C++ code, capturing frame-by-frame state changes.
*   **Memory Mirroring**: Real-time tracking of variable values, pointers, and memory state.

### 3. Advanced Technical Analysis
*   **Complexity Matrix**: Automatic computation of Big O Time and Space complexity.
*   **Bottleneck Detection**: Pinpoints efficiency issues as input scales.
*   **Edge Case Matrix**: Identifies potential logical failures (overflow, null pointers, empty sets).
*   **Smart Suggestions**: Provides high-level architectural refactoring advice.

---

## 🏗️ System Architecture

### Backend: C++ Core
*   **Lexer & Parser**: Deconstructs source code into an **Abstract Syntax Tree (AST)**.
*   **Execution Engine**: Traces procedural logic and maintains a Symbol Table.
*   **AI Analyzer**: Orchestrates with Groq API (Llama models) for deep behavioral simulation.
*   **Server**: Built with **Crow (C++ Web Framework)** and **Asio** for high-performance networking.

### Frontend: React Canvas
*   **Next.js 14**: Modern, responsive dashboard.
*   **React-Konva**: High-performance canvas library for pixel-perfect structural rendering.
*   **React Flow**: Hybrid fallback for generic procedural logic flows.

---

## 📊 Supported Concepts & Data Structures

| Category | Data Structures |
| :--- | :--- |
| **Linear** | Arrays, Vectors, Singly/Doubly Linked Lists |
| **Non-Linear** | Graphs (Adjacency Lists/Matrices), Trees |
| **Hierarchical** | BST, AVL Trees, **Threaded Binary Trees (TBT)**, Red-Black Trees |
| **Associative** | Hash Tables (Collision via Chaining) |
| **Specialized** | Stacks, Queues (Vertical/Horizontal) |

---

## 🛠️ Internal Engineering (Data Structures Used)

*   **Abstract Syntax Tree (AST)**: Internal representation of parsed code.
*   **Symbol Table (Unordered Map)**: Mapping identifiers to memory states.
*   **Call Stack (Stack)**: Managing nested logical frames.
*   **Adjacency Lists**: Managing visual edge connections in the frontend.
*   **Asynchronous Queues**: Managing server requests.

---

## 🏁 Getting Started

### 1. Backend Setup
1.  Navigate to the `backend/` directory.
2.  Run the compiled server:
    ```bash
    ./server.exe
    ```
    *(The backend runs on port 18080 by default)*

### 2. Frontend Setup
1.  Navigate to the `frontend/` directory.
2.  Install dependencies: `npm install`
3.  Start the dev server:
    ```bash
    npm run dev
    ```

### 3. Usage
1.  Paste any C++ data structure implementation into the editor.
2.  Click **"RESTART SIMULATION"**.
3.  Use the **Step Controls** or **Auto-Play** to watch the algorithm come to life.
4.  Switch to the **AI Analyzer** tab for deep performance metrics.

---
**Status**: Ready for Final Submission.
**Developed for**: Advanced Algorithm Visualization & Academic Excellence.
