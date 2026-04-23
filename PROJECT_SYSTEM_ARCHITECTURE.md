# DSPro Project Documentation: System Architecture & File Registry

This document provides a comprehensive overview of the **DSPro Universal Algorithm Visualization Engine**, detailing the purpose and interaction of every file in the project.

---

## 1. Frontend: The Visualization Engine (`/frontend`)

Built with **Next.js 15+**, **React Flow**, and **TailwindCSS**, the frontend is responsible for transforming raw simulation state into high-fidelity, interactive visualizations.

### Core Structure
- **`app/page.tsx`**: 
    - **The Brain**: Contains the main application state, simulation logic, and the unified structural classification engine (`dsType` inference).
    - **Layout Engine**: Integrates the `Dagre` layout algorithm with custom "Phantom Anchoring" to ensure trees and lists maintain geometric symmetry. 
    - **Global Simulation Loop**: Manages step-by-step playback and real-time state mapping.
- **`components/visualizer/DataStructureVisualizer.tsx`**: 
    - **Dispatcher**: Acts as the traffic controller, routing data structures to their respective visual profiles based on the detected pattern.
- **`globals.css`**: 
    - **Design System**: Defines the premium "Aero Dark" aesthetic, including custom canvas backgrounds, glassmorphism containers, and animated gradient badges.

---

## 2. Backend: The Simulation & Inference Core (`/backend`)

Built in **C++20** with **Crow Microframework**, the backend performs the heavy lifting of parsing, simulating, and analyzing C++ algorithms using AI-driven structural inference.

### Core Logic
- **`main.cpp`**: 
    - **Server Host**: Initializes the Crow server, handles CORS, and defines the `/analyze` and `/simulate` REST endpoints.
- **`parser/`**: 
    - `Tokenizer.cpp / .h`: Lexical analysis of C++ code into tokens.
    - `Parser.cpp / .h`: Recursive descent parser that builds an Abstract Syntax Tree (AST) from code.
- **`simulator/`**: 
    - `ExecutionEngine.cpp / .h`: A step-through VM that simulates the AST, tracking variable memory and pointer updates to generate a raw execution trace.
- **`compiler/`**: 
    - `ASTtoJSON.cpp / .h`: Converts the internal C++ AST into a JSON format digestible by the AI Analyzer.
- **`analyzer/`**:
    - **`AIAnalyzer.cpp / .h`**: The **Inference Hub**. Uses the Groq LLM API to analyze the simulation trace and code, outputting a strictly isolated JSON graph state for the frontend. Includes specialized "Expert Modes" for AVL, TBT, and RBT.
    - `ComplexityAnalyzer.cpp / .h`: Performs static and dynamic analysis to calculate Big-O time and space complexity.
    - `PatternDetector.cpp / .h`: Uses heuristic signature matching to identify standard data structure patterns (e.g., detecting `left/right` as a Binary Tree).

---

## 3. Communication Protocol (JSON Schema)

The backend and frontend communicate via a **Strict Structural State JSON**:
- **`graph_states`**: An array of objects representing the state of memory at every simulation step.
- **`nodes`**: Objects containing `id`, `val`, and hierarchical pointers (`left`, `right`, `next`).
- **`special_flags`**: Props like `threadLeft` or `height` which trigger specialized rendering behaviors in the frontend.

---

## 4. Operational Lifecycle
1. **User Action**: Code is submitted via the frontend editor.
2. **Parsing**: `Parser` converts code into an `AST`.
3. **Simulation**: `ExecutionEngine` generates a trace of step-by-step memory updates.
4. **Analysis**: `AIAnalyzer` passes the trace to the LLM with specific "Expert Mode" instructions.
5. **Rendering**: The frontend receives the JSON, resolves the `dsType`, and applies the correct `Dagre` island layout with standard/curvy arrows.
