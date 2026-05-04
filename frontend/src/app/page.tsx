"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import DataStructureVisualizer, { DSStructure } from "@/components/visualizer/DataStructureVisualizer";
import { Handle, Position } from 'reactflow';

const DSNode = React.memo(({ data }: any) => {
  const isRoot = data.isRoot;
  const isActive = data.isActive;
  const isTerminal = data.isTerminal;
  const color = data.color?.toLowerCase();
  const pattern = data.pattern;
  const isStack = pattern === 'stack';
  const isArray = pattern === 'array';

  let nodeBg = 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-[#334155]';
  if (isActive) {
    nodeBg = 'bg-gradient-to-br from-yellow-400 to-orange-600 border-yellow-300 scale-110 ring-4 ring-yellow-400/20';
  } else if (color === 'red') {
    nodeBg = 'bg-gradient-to-br from-red-500 to-red-900 border-red-400';
  } else if (color === 'black') {
    nodeBg = 'bg-gradient-to-br from-gray-700 to-black border-gray-600';
  } else if (isTerminal) {
    nodeBg = 'bg-gradient-to-br from-red-600 to-red-950 border-red-500';
  }

  return (
    <div className={`relative group transition-all duration-300`}>
      {/* GFG Style Word Label for Terminal Nodes */}
      {isTerminal && data.word && (
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 bg-red-600 px-3 py-1 rounded-full text-[9px] text-white font-black border border-red-400 shadow-lg shadow-red-500/20 whitespace-nowrap z-50">
          [ {data.word} ]
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45 border-t border-r border-red-400" />
        </div>
      )}

      {/* Stack 'TOP' Pointer with Enhanced Glow */}
      {data.metadata?.toUpperCase().includes('TOP') && (
        <>
          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center space-x-1 animate-bounce z-50">
             <span className="text-[11px] font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] uppercase tracking-widest">TOP</span>
             <svg className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
          <div className="absolute -inset-1 border-2 border-yellow-400/50 rounded-xl blur-sm animate-pulse -z-10" />
        </>
      )}

      {/* Linked List 'HEAD' Pointer */}
      {data.pattern === 'list' && data.isFirst && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center space-x-1 animate-bounce">
           <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">HEAD</span>
           <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </div>
      )}

      {/* Array Index Labels */}
      {isArray && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-500/60 uppercase">
          idx: {data.index}
        </div>
      )}

      <div 
        className={`${(isStack || isArray) ? 'w-24 h-12 rounded-lg' : 'w-16 h-16 rounded-full'} flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-2xl ${nodeBg}`}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <span className={`text-[13px] font-black tracking-tight ${isActive ? 'text-black' : 'text-white'}`}>
          {isRoot ? "ROOT" : data.val}
        </span>
        {data.metadata && !isRoot && (
          <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 opacity-70 ${isActive ? 'text-black/80' : 'text-blue-300'}`}>
            {data.metadata}
          </span>
        )}
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>

      {isActive && (
         <div className="absolute -inset-2 bg-yellow-400/10 rounded-full blur-xl animate-pulse -z-10" />
      )}
    </div>
  );
});

const nodeTypes = {
  dsNode: DSNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const LAYOUT_CONFIGS: Record<string, any> = {
  tree: { nodesep: 250, ranksep: 200, direction: 'TB', ranker: 'tight-tree' },
  trie: { nodesep: 150, ranksep: 100, direction: 'TB' },
  linked_list: { nodesep: 100, ranksep: 40, direction: 'LR' },
  array: { nodesep: 0, ranksep: 40, direction: 'LR' }, 
  stack: { nodesep: 10, ranksep: 0, direction: 'TB' },
  queue: { nodesep: 20, ranksep: 40, direction: 'LR' },
  graph: { nodesep: 100, ranksep: 100, direction: 'TB' },
  default: { nodesep: 150, ranksep: 150, direction: 'TB' }
};

const getLayoutedElements = (nodes: any[], edges: any[], type: string = 'default', posMap?: Map<string, {x: number, y: number}>) => {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  // 1. Find Connected Components (Islands)
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
       adj.get(e.source)?.push(e.target);
       adj.get(e.target)?.push(e.source);
    }
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  nodes.forEach(node => {
     if (!visited.has(node.id)) {
        const component: string[] = [];
        const queue = [node.id];
        visited.add(node.id);
        while (queue.length > 0) {
           const curr = queue.shift()!;
           component.push(curr);
           adj.get(curr)?.forEach(neighbor => {
              if (!visited.has(neighbor)) {
                 visited.add(neighbor);
                 queue.push(neighbor);
              }
           });
        }
        components.push(component);
     }
  });

  // 2. Layout each island separately
  let layoutedNodes: any[] = [];
  let layoutedEdges: any[] = [];
  let verticalOffset = 0;

  components.forEach((compNodeIds, index) => {
     const compNodes = nodes.filter(n => compNodeIds.includes(n.id));
     const compEdges = edges.filter(e => compNodeIds.includes(e.source) && compNodeIds.includes(e.target));
     
     // Determine island type (heuristic)
     let islandType = type;
     if (compNodes.some(n => n.data?.pattern === 'stack')) islandType = 'stack';
     else if (compNodes.some(n => n.data?.pattern === 'array')) islandType = 'array';
     
     const config = LAYOUT_CONFIGS[islandType] || LAYOUT_CONFIGS.default;
     const isHorizontal = config.direction === 'LR';

     const islandGraph = new dagre.graphlib.Graph();
     islandGraph.setGraph({ 
        rankdir: config.direction,
        nodesep: config.nodesep,
        ranksep: config.ranksep,
        marginx: 50,
        marginy: 50
     });
     islandGraph.setDefaultEdgeLabel(() => ({}));

     compNodes.forEach(node => {
        const isRect = node.data?.pattern === 'stack' || node.data?.pattern === 'array' || islandType === 'stack' || islandType === 'array';
        islandGraph.setNode(node.id, { width: isRect ? 150 : 100, height: isRect ? 80 : 100 });
     });

     // 2.1 Build Directed Graph with Order-Strict Insertion + Stale Edge Purge
     const structuralEdgeIds = new Set<string>();
     const assignedChildren = new Set<string>();
     
     if (islandType === 'tree' || islandType === 'trie') {
        // Tree-Specific: Insert edges in L -> Dummy -> R order
        compNodes.forEach(node => {
          const sId = node.id;
          const lEdge = compEdges.find(e => e.source === sId && e.id.endsWith('-L') && e.style?.strokeDasharray !== '10,5');
          const rEdge = compEdges.find(e => e.source === sId && e.id.endsWith('-R') && e.style?.strokeDasharray !== '10,5');
          
          if (lEdge || rEdge) {
            const dId = `dummy-${sId}-${index}`;
            islandGraph.setNode(dId, { width: 1, height: 1 });
            
            // EXECUTE INSERTION IN STRICT LEFT-TO-RIGHT ORDER
            if (lEdge && !assignedChildren.has(lEdge.target)) {
              islandGraph.setEdge(lEdge.source, lEdge.target, { weight: 1 });
              assignedChildren.add(lEdge.target);
              structuralEdgeIds.add(lEdge.id);
            }
            
            // Dummy Anchor always centered
            islandGraph.setEdge(sId, dId, { weight: lEdge && rEdge ? 100 : 50 });
            
            if (rEdge && !assignedChildren.has(rEdge.target)) {
              islandGraph.setEdge(rEdge.source, rEdge.target, { weight: 1 });
              assignedChildren.add(rEdge.target);
              structuralEdgeIds.add(rEdge.id);
            }
          }
        });
     }

     // Normal Edge Fallback (for non-tree islands or non-hierarchical edges)
     compEdges.forEach(edge => {
        const isLogical = edge.id.includes('-S-'); 
        const isThr = edge.style?.strokeDasharray === '10,5'; 
        
        if (isLogical || isThr) {
           // These are non-structural, we keep them visually but don't layout by them
           layoutedEdges.push(edge);
        } else if (!assignedChildren.has(edge.target)) {
           islandGraph.setEdge(edge.source, edge.target);
           assignedChildren.add(edge.target);
           structuralEdgeIds.add(edge.id);
        }
     });

     dagre.layout(islandGraph);

     // Only keep structural edges that Dagre actually used, plus the threads/logical pointers
     const finalIslandEdges = compEdges.filter(e => structuralEdgeIds.has(e.id) || e.id.includes('-S-') || e.style?.strokeDasharray === '10,5');
     layoutedEdges.push(...finalIslandEdges);

     // 2.2 Collect results with Kinetic Smoothing
     compNodes.forEach(node => {
        const pos = islandGraph.node(node.id);
        const isRect = node.data?.pattern === 'stack' || node.data?.pattern === 'array' || islandType === 'stack' || islandType === 'array';
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';
        
        const newX = pos.x - (isRect ? 75 : 50);
        const newY = pos.y - (isRect ? 40 : 50) + verticalOffset;
        
        // Apply micro-smoothing to prevent rotation-jitter
        const prev = posMap?.get(node.id);
        if (prev && (islandType === 'tree' || islandType === 'trie')) {
            node.position = {
               x: (newX + prev.x) / 2,
               y: (newY + prev.y) / 2
            };
        } else {
            node.position = { x: newX, y: newY };
        }
        
        layoutedNodes.push(node);
     });

     // Update offset for next island (Island Bounding Box + Buffer)
     const islandNodes = compNodes.map(n => islandGraph.node(n.id));
     const islandHeight = Math.max(...islandNodes.map(n => n.y)) - Math.min(...islandNodes.map(n => n.y)) || 200;
     verticalOffset += islandHeight + 600; // Mandatory 600px isolation zone
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export default function Home() {
  return (
    <ReactFlowProvider>
      <VisualizerContent />
    </ReactFlowProvider>
  );
}

import { ReactFlowProvider } from 'reactflow';

function VisualizerContent() {
  const { fitView } = useReactFlow();
  const [code, setCode] = useState(`// TBT / BST Assignment\n#include <iostream>\nusing namespace std;\n\nint main() {\n  int choice = 0;\n  int data = 0;\n  while(choice != 4) {\n    cin >> choice;\n    if(choice == 1) {\n       cin >> data;\n    }\n  }\n  return 0;\n}`);

  const [sessionInputs, setSessionInputs] = useState<number[]>([]);
  const [runtimeInput, setRuntimeInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [memory, setMemory] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'visualizer' | 'analyzer'>('visualizer');
  const [autoPlay, setAutoPlay] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const maxSteps = useMemo(() => {
    const simLen = data?.simulation?.length || 0;
    const graphLen = data?.graph_states?.length || 0;
    return Math.max(simLen, graphLen, 1);
  }, [data]);

  useEffect(() => {
    if (data) {
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [data, fitView]);

  const visitedSet = useMemo(() => {
    const s = new Set<string>();
    if (!data || !data.graph_states) return s;
    for (let i = 0; i <= simStep; i++) {
      const activeId = data.graph_states[i]?.active_node_id;
      if (activeId) s.add(activeId);
    }
    return s;
  }, [data, simStep]);

  const executeAnalyzer = async (inputsPayload: number[] = []) => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inputs: inputsPayload }),
      });
      const result = await res.json();
      setData(result);

      if (inputsPayload.length === 0) {
        setSessionInputs([]);
        setSimStep(0);
        setMemory({});
      } else {
        setSessionInputs(inputsPayload);
        if (maxSteps > 1) {
          setSimStep(Math.min(maxSteps - 1, simStep + 1));
        }
      }
    } catch (e) {
      alert("Failed to reach server. Make sure backend is running on :18080");
    }
    setLoading(false);
  };

  const pushRuntimeInput = () => {
    if (runtimeInput.trim() !== "" && !isNaN(Number(runtimeInput))) {
      const val = Number(runtimeInput);
      setRuntimeInput("");
      executeAnalyzer([...sessionInputs, val]);
    }
  };

  useEffect(() => {
    const newMem: Record<string, any> = {};

    // 1. Process Local Simulation Logic (Simulated Variables)
    if (data && data.simulation && data.simulation.length > 0) {
      for (let i = 0; i <= simStep; i++) {
        const step = data.simulation[i];
        if (step && step.var && step.action !== "waiting_input") {
          newMem[step.var] = step.value;
        }
      }
    }

    // 2. Process AI Simulation Metadata (Logic Variables / Pointers)
    const currentGraphState = data?.graph_states?.[simStep];
    if (currentGraphState && currentGraphState.variables) {
      Object.entries(currentGraphState.variables).forEach(([k, v]) => {
        newMem[k] = v;
      });
    }

    setMemory(newMem);
  }, [simStep, data]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoPlay && data && data.simulation && simStep < data.simulation.length - 1) {
      interval = setInterval(() => {
        setSimStep((prev) => prev + 1);
      }, 1500);
    } else {
      setAutoPlay(false);
    }
    return () => clearInterval(interval);
  }, [autoPlay, simStep, data]);

    // 1. Determine Structure Type (Unified Inference)
    const dsType = useMemo((): string => {
      if (!data) return "default";
      const p = (data?.detected_pattern || "").toLowerCase();
      const a = (data?.algorithm_name || "").toLowerCase();
      const desc = (data?.description || "").toLowerCase();
      const combo = p + " " + a + " " + desc;

      if (combo.includes("trie") || combo.includes("prefix tree") || combo.includes("huffman")) return "trie";
      if (combo.includes("linked list") || combo.includes("list") || combo.includes("linked_list") || combo.includes("node_next")) return "linked_list";
      if (combo.includes("tbt") || combo.includes("thread") || combo.includes("binary tree") || combo.includes("bst") || combo.includes("tree") || combo.includes("avl") || combo.includes("node")) return "tree";
      if (combo.includes("stack")) return "stack";
      if (combo.includes("queue")) return "queue";
      if (combo.includes("array") || combo.includes("vector") || combo.includes("sort")) return "array";
      if (combo.includes("graph") || combo.includes("adj")) return "graph";
      return "default";
    }, [data?.detected_pattern, data?.algorithm_name, data?.description]);

    useEffect(() => {
    let currentNodes: any[] = [];
    let currentEdges: any[] = [];
    
    let viewType = dsType === 'tree' || dsType === 'trie' || dsType === 'graph' ? 'hierarchical' : 'linear';

    // Store previous positions to prevent jumping
    const posMap = new Map<string, {x: number, y: number}>();
    nodes.forEach((n: any) => posMap.set(n.id, n.position));
    nodes.forEach((n: any) => posMap.set(n.id, n.position));

    if (data && data.graph_states && data.graph_states.length > 0) {
      const currentState = data.graph_states[Math.min(simStep, data.graph_states.length - 1)] || data.graph_states[0];
      
      if (currentState && currentState.nodes) {
        const validNodes = currentState.nodes.filter((n: any) => {
          const val = String(n.val || "").toUpperCase();
          const id = String(n.id || "").toLowerCase();
          const p = (data?.detected_pattern || "").toLowerCase();
          const alg = (data?.algorithm_name || "").toLowerCase();
          const dsc = (data?.description || "").toLowerCase();
          const combo = p + " " + alg + " " + dsc;
          
          // Pure Sentinels (NIL/NULL) - Keep for TBT (Headers) and RBT (Mathematical properties)
          const isTBT = combo.includes("tbt") || combo.includes("thread");
          const isRBT = combo.includes("rbt") || combo.includes("red-black") || combo.includes("red_black") || combo.includes("red black");
          
          const isSentinel = (val === "NIL" || val === "NULL" || val === "TOP" || id.includes("null")) && !isTBT;
          const isEmpty = val === "" && id === "" && !n.children;
                            
          return !isSentinel && !isEmpty && n.id !== null && n.id !== undefined && n.id !== "";
        });
        const validNodeIds = new Set(validNodes.map((n: any) => String(n.id)));

        currentNodes = validNodes.map((n: any) => {
          const nodeIdStr = String(n.id);
          const isActive = String(currentState.active_node_id) === nodeIdStr;
          
          // ABSOLUTE GEOMETRIC HARDENING: Default to Rectangle unless strictly a Tree
          const isTreeLike = dsType === 'tree' || dsType === 'trie' || dsType === 'graph' || n.pattern === 'tree';
          const nodeShape = isTreeLike ? 'circle' : 'rectangle';

          let shapeStyles: any = { borderRadius: '8px' }; 
          if (nodeShape === 'circle') shapeStyles = { borderRadius: '50%' };
          if (dsType === 'array' || dsType === 'stack' || n.pattern === 'array' || n.pattern === 'stack') shapeStyles = { borderRadius: '0' };

          // Color handling (RB Trees support) - Always prioritize RBT math colors
          let bgColor = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
          const nodeColor = n.color?.toLowerCase();
          const nodeVal = String(n.val || "").toUpperCase();
          
          if (nodeColor === 'red') bgColor = 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
          else if (nodeColor === 'black' || nodeVal === 'NIL') bgColor = 'linear-gradient(135deg, #334155 0%, #111827 100%)';
          else if (nodeColor === 'blue') bgColor = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
          else if (n.isEndOfWord || n.isTerminal) bgColor = 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
          
          // Overlay Active highlight if applicable (different border/glow should be used instead of bg change for RBT)
          const activeStyle = isActive ? { boxShadow: '0 0 20px #fbbf24', border: '3px solid #fbbf24' } : {};

          const isRoot = n.id === 'root' || n.id === '0' || n.val?.toLowerCase() === 'root';

          return {
            id: n.id,
            type: 'dsNode',
            data: { 
              id: n.id,
              val: n.val,
              isRoot: isRoot,
              isActive: isActive,
              color: n.color,
              pattern: dsType, // Use ONLY the strictly inferred dsType from our classification
              isTerminal: n.isEndOfWord || n.isTerminal,
              word: n.word,
              isFirst: currentState.nodes[0]?.id === n.id,
              index: n.index ?? currentState.nodes.indexOf(n),
              metadata: (() => {
                const parts = [];
                if (n.metadata) parts.push(n.metadata);
                if (n.height !== undefined && n.height !== null) parts.push(`H:${n.height}`);
                if (n.balance_factor !== undefined || n.balanceFactor !== undefined) {
                   const bf = n.balance_factor ?? n.balanceFactor;
                   if (bf !== undefined && bf !== null) parts.push(`BF:${bf}`);
                }
                return parts.join(" | ") || null;
              })()
            }
          };
        });

        // AUTO-CHAINING FOR ARRAYS & LISTS: Force sequential layout if no edges exist
        // EXCLUDE STACKS: Stacks should rely strictly on their vertical layout without guide edges
        if (currentEdges.length === 0 && (dsType === 'array' || dsType === 'linked_list' || dsType === 'queue')) {
          for (let i = 0; i < currentNodes.length - 1; i++) {
            currentEdges.push({
              id: `auto-e-${currentNodes[i].id}-${currentNodes[i+1].id}`,
              source: currentNodes[i].id,
              target: currentNodes[i+1].id,
              animated: false,
              style: { stroke: 'transparent', strokeWidth: 0 }, // Invisible guide
            });
          }
        }

        // EDGE RENDERING LOOP
        validNodes.forEach((n: any) => {
          const sourceId = String(n.id);
          
          // 1. Hierarchical Pointers (Left/Right) - Isolated for linear structures
          if (dsType !== 'stack' && dsType !== 'array') {
            const lPtr = n.left || n.lThread || n.lLink || n.lc;
            if (lPtr && String(lPtr) !== "null" && validNodeIds.has(String(lPtr))) {
              const targetId = String(lPtr);
              const isThread = n.threadLeft || n.lbit === 0 || n.lbit === false || n.isLThread;
              currentEdges.push({
                id: `e-${sourceId}-${targetId}-L`,
                source: sourceId,
                target: targetId,
                label: viewType === 'hierarchical' ? 'L' : '',
                animated: isThread,
                pathOptions: { borderRadius: 20 },
                style: {
                  stroke: isThread ? '#10b981' : '#60a5fa', 
                  strokeWidth: isThread ? 2 : 3, 
                  strokeDasharray: isThread ? '10,5' : '0',
                  opacity: isThread ? 0.8 : 1
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: isThread ? '#10b981' : '#60a5fa', width: 14, height: 14 } 
              });
            }
            const rPtr = n.right || n.rThread || n.rLink || n.rc;
            if (rPtr && String(rPtr) !== "null" && validNodeIds.has(String(rPtr))) {
              const targetId = String(rPtr);
              const isThread = n.threadRight || n.rbit === 0 || n.rbit === false || n.isRThread;
              currentEdges.push({
                id: `e-${sourceId}-${targetId}-R`,
                source: sourceId,
                target: targetId,
                label: viewType === 'hierarchical' ? 'R' : '',
                animated: isThread,
                pathOptions: { borderRadius: 20 },
                style: {
                  stroke: isThread ? '#10b981' : '#3b82f6', 
                  strokeWidth: isThread ? 4 : 5, 
                  strokeDasharray: isThread ? '10,5' : '0',
                  opacity: isThread ? 0.8 : 1,
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: isThread ? '#10b981' : '#3b82f6', width: 22, height: 22 } 
              });
            }
          }

          // 2. Sequential Pointers (Next) - Isolated for Stacks
          if (n.next && String(n.next) !== "null" && validNodeIds.has(String(n.next))) {
             if (dsType !== 'stack') {
                const targetId = String(n.next);
                currentEdges.push({
                  id: `e-${sourceId}-${targetId}-N`,
                  source: sourceId,
                  target: targetId,
                  animated: true,
                  pathOptions: { borderRadius: 20 },
                  style: { stroke: '#6366f1', strokeWidth: 4 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 25, height: 25 }
                });
             }
          }

          // 3. Trie/Graph Multi-Children
          if (n.children) {
            const childrenEntries = Array.isArray(n.children) 
              ? n.children.map((c, i) => [i, c]) 
              : Object.entries(n.children);

            childrenEntries.forEach(([key, child]: [any, any], idx: number) => {
              const rawTarget = child?.id || child?.target || (typeof child === 'string' ? child : (typeof child === 'number' ? String(child) : null));
              const targetId = rawTarget ? String(rawTarget) : null;
              
              if (targetId && validNodeIds.has(targetId)) {
                currentEdges.push({
                  id: `e-${sourceId}-${targetId}-C-${idx}`,
                  source: sourceId,
                  target: targetId,
                  label: child?.char || child?.label || (typeof key === 'string' ? key : ''),
                  style: { stroke: '#10b981', strokeWidth: 4 },
                  pathOptions: { borderRadius: 20 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 }
                });
              }
            });
          }

          // 4. DEEP SCAN FALLBACK: Logic Pointers (Iterators, Pivots)
          Object.entries(n).forEach(([key, value]) => {
            const valueStr = String(value);
            if (typeof value !== 'object' && validNodeIds.has(valueStr) && valueStr !== sourceId && !['id','left','right','next','lThread','rThread','lLink','rLink','word','val','metadata','color','shape'].includes(key)) {
              const targetId = valueStr;
              const exists = currentEdges.some(e => e.source === sourceId && e.target === targetId);
              if (!exists) {
                currentEdges.push({
                  id: `e-${sourceId}-${targetId}-S-${key}`,
                  source: sourceId,
                  target: targetId,
                  label: key,
                  style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5,5' },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' }
                });
              }
            }
          });
        });
      }
    } else if (data && data.simulation && data.simulation.length > 0) {
      // Fallback: Generate linear graph from simulation steps
      currentNodes = data.simulation.slice(0, simStep + 1).map((step: any, idx: number) => ({
        id: `step-${idx}`,
        data: { label: `${step.action}\n${step.var || ''}` },
        style: {
          background: idx === simStep ? '#facc15' : '#1e293b',
          color: idx === simStep ? '#000' : '#60a5fa',
          border: '1px solid #3b82f6',
          borderRadius: '4px',
          width: 100,
          height: 40,
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }
      }));

      for (let i = 0; i < currentNodes.length - 1; i++) {
        currentEdges.push({
          id: `e-step-${i}-${i + 1}`,
          source: `step-${i}`,
          target: `step-${i + 1}`,
          animated: true,
          style: { stroke: '#3b82f6' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
        });
      }
      viewType = 'linear';
    }

    if (currentNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(currentNodes, currentEdges, dsType || 'default', posMap);
      
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [data, simStep, setNodes, setEdges, visitedSet]);


  const prepareDSData = () => {
    if (!data?.graph_states?.[simStep]) return [];
    const state = data.graph_states[simStep];
    if (dsType === "array" || dsType === "stack" || dsType === "queue") {
        return state.nodes || [];
    }
    if (dsType === "tree" || dsType === "linked_list" || dsType === "graph") {
        return state.nodes || [];
    }
    if (dsType === "hash") {
        // Assume AI generates buckets for hash
        return state.variables?.buckets || [];
    }
    return state.nodes || [];
  };

  const onInit = (instance: any) => {
    setTimeout(() => instance.fitView({ padding: 0.2 }), 100);
  };

  const isPaused = data && data.status === "waiting_input" && simStep === data.simulation.length - 1;

  return (
    <div className="h-screen bg-[#06090f] text-gray-300 font-sans p-4 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full space-y-4">

        <header className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-default">
            DSA Advanced Visualizer
          </h1>
          {data?.algorithm_name && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-400 text-xs font-black tracking-widest">
                {data.algorithm_name.toUpperCase()}
              </div>
              {data.detected_pattern && (
                <div className="bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 text-[9px] font-bold uppercase tracking-tighter">
                  {data.detected_pattern}
                </div>
              )}
            </div>
          )}
          {loading && <div className="text-xs text-blue-400 animate-pulse font-mono tracking-tighter">AGENT_ANALYZING_PAYLOAD...</div>}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">

          {/* Left Column: Editor & Control */}
          <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
            <section className="bg-[#161b22] border border-gray-800 rounded-xl p-4 shadow-2xl flex flex-col flex-1 overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Code Editor</h2>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full flex-1 bg-[#0d1117] text-purple-300 font-mono text-sm p-4 rounded-lg outline-none border border-gray-800 focus:border-blue-500 transition-all resize-none mb-4 shadow-inner"
                spellCheck="false"
              />
              <button
                onClick={() => executeAnalyzer([])}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? "PROCESSING..." : "RESTART SIMULATION"}
              </button>
            </section>

            <section className="bg-[#161b22] border border-gray-800 rounded-xl p-4 shadow-2xl h-48 overflow-y-auto">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Input Stack</h2>
              <div className="bg-[#0d1117] rounded-lg border border-gray-800 p-3 text-xs font-mono text-blue-300 min-h-[60px] flex flex-wrap gap-2">
                {sessionInputs.length === 0 && <span className="text-gray-600 italic">No inputs provided to stack yet.</span>}
                {sessionInputs.map((val, i) => (
                  <div key={i} className="bg-blue-900/40 text-blue-300 border border-blue-800/50 px-2 py-1 rounded">#{i + 1}: {val}</div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Visualizer & AI Tabs */}
          <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">

            <div className="flex items-center justify-between bg-[#161b22] p-1.5 rounded-xl border border-gray-800">
              <div className="flex space-x-1 items-center">
                <button
                  onClick={() => setActiveTab('visualizer')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'visualizer' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  VISUALIZER
                </button>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analyzer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  AI ANALYZER
                </button>
                <div className="ml-4 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/40 border border-gray-700">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Isolation Mode:</span>
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{dsType.replace('_', ' ')}</span>
                </div>
              </div>
              
              {data?.graph_states?.[simStep]?.description && (
                <div className="flex-1 px-6 truncate">
                   <p className="text-[10px] text-blue-400 font-mono font-bold truncate">
                     {data.graph_states[simStep].description}
                   </p>
                </div>
              )}
            </div>

            {activeTab === 'analyzer' && (
              <div className="flex-1 bg-[#161b22] border border-blue-900/30 rounded-xl p-6 shadow-2xl relative overflow-y-auto animate-in fade-in duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2" />
                  Analysis Report
                </h2>
                {data ? (
                  <div className="space-y-6 relative z-10">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-500 uppercase mb-2">Algorithm Description</h3>
                      <p className="text-sm text-gray-300 leading-relaxed font-light">{data.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0d1117] border border-blue-900/20 p-4 rounded-xl">
                        <div className="text-[9px] font-bold text-blue-500 uppercase mb-1">Total Time Complexity</div>
                        <div className="text-xl font-mono text-blue-300">{data.overall_time_complexity || 'O(N)'}</div>
                      </div>
                      <div className="bg-[#0d1117] border border-green-900/20 p-4 rounded-xl">
                        <div className="text-[9px] font-bold text-green-500 uppercase mb-1">Peak Space complexity</div>
                        <div className="text-xl font-mono text-green-300">{data.overall_space_complexity || 'O(1)'}</div>
                      </div>
                    </div>

                    {data.functions?.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3">Identified Procedures</h3>
                        <div className="space-y-2">
                          {data.functions.map((f: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-gray-800">
                              <span className="text-xs font-mono text-indigo-400 font-bold">{f.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{f.time_complexity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.suggestions?.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3">Refactor Suggestions</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {data.suggestions.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-blue-200/60 bg-blue-900/10 border-l-2 border-blue-500 pl-4 py-2 rounded-r-lg">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(data.bottlenecks?.length > 0 || data.edge_cases?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                        {data.bottlenecks?.length > 0 && (
                          <div>
                            <h3 className="text-[10px] font-black text-red-500 uppercase mb-3 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Performance Bottlenecks
                            </h3>
                            <ul className="space-y-1.5">
                              {data.bottlenecks.map((b: string, i: number) => (
                                <li key={i} className="text-[11px] text-gray-400 bg-red-900/5 px-2 py-1 rounded border-l border-red-500/30">{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {data.edge_cases?.length > 0 && (
                          <div>
                            <h3 className="text-[10px] font-black text-orange-500 uppercase mb-3 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Edge Case Matrix
                            </h3>
                            <ul className="space-y-1.5">
                              {data.edge_cases.map((e: string, i: number) => (
                                <li key={i} className="text-[11px] text-gray-400 bg-orange-900/5 px-2 py-1 rounded border-l border-orange-500/30">{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-gray-600">
                    <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <span className="text-xs font-mono uppercase tracking-[0.2em]">Awaiting Simulation Pulse...</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visualizer' && (
              <div className="flex-1 bg-[#161b22] border border-gray-800 rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className="absolute top-4 right-4 z-20 pointer-events-none">
                  {data?.graph_states?.[simStep]?.description && (
                    <div className="bg-[#1c2128]/80 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl max-w-xs pointer-events-auto shadow-2xl animate-in slide-in-from-right duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Logic Insight</div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed font-mono font-semibold">
                        {data.graph_states[simStep].description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full bg-[#0d1117] relative">
                  {nodes.length > 0 ? (
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onInit={onInit}
                      nodeTypes={nodeTypes}
                      connectionLineType={ConnectionLineType.SmoothStep}
                    >
                      <Background color="#1e293b" gap={24} size={1.5} variant={'dots' as any} />
                      <Controls className="bg-gray-900 border-gray-800 fill-white" />
                      
                      {/* Tree Branch Legend: Only show for Trees */}
                      {dsType === 'tree' && (
                        <div className="absolute top-4 left-4 z-50 pointer-events-none">
                          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 p-4 rounded-2xl shadow-2xl flex flex-col space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-white/5 pb-1 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                              Hierarchical Legend
                            </h4>
                            <div className="flex flex-col space-y-2">
                               <div className="flex items-center space-x-3">
                                  <div className="w-8 h-[2px] bg-[#60a5fa] relative">
                                     <div className="absolute -right-1 -top-[3px] border-[4px] border-transparent border-l-[#60a5fa]" />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-300 uppercase leading-none">Small Arrow = Left</span>
                               </div>
                               <div className="flex items-center space-x-3 pr-2">
                                  <div className="w-8 h-[4px] bg-[#3b82f6] relative">
                                     <div className="absolute -right-2 -top-[4px] border-[6px] border-transparent border-l-[#3b82f6]" />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-300 uppercase leading-none">Big Arrow = Right</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Error ribbon if data.error is present */}
                      {data?.error && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/40 backdrop-blur border border-red-500/50 px-4 py-2 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-4">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest">{data.error}</span>
                        </div>
                      )}
                    </ReactFlow>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">
                      NO_STRUCTURAL_DATA_RESOLVED
                    </div>
                  )}

                  {/* Memory list overlay - cleaner, docked in right corner */}
                  <div className="absolute bottom-16 right-6 z-10 flex flex-col gap-1.5 max-h-[40%] max-w-[40%] overflow-y-auto pl-2 custom-scrollbar pointer-events-auto">
                    {Object.entries(memory).map(([k, v]) => (
                      <div key={k} className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl flex items-start space-x-4 shadow-2xl hover:border-blue-500/50 transition-all group">
                        <span className="text-[9px] font-black text-blue-400 group-hover:text-blue-300 uppercase tracking-tighter mt-1">{k}</span>
                        <div className="text-[11px] text-gray-100 font-mono font-medium leading-relaxed break-all">
                          {typeof v === 'object' && v !== null ? (
                            <div className="bg-white/5 p-2 rounded-lg border border-white/10 mt-1 max-w-[250px] overflow-hidden">
                                {Object.entries(v).map(([subK, subV]) => (
                                    <div key={subK} className="flex space-x-2">
                                        <span className="text-blue-500/70">{subK}:</span>
                                        <span className="text-gray-400">{String(subV)}</span>
                                    </div>
                                ))}
                            </div>
                          ) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controller Footer */}
                <div className="bg-[#1c2128] p-4 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSimStep(Math.max(0, simStep - 1))}
                      disabled={simStep === 0}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg disabled:opacity-20 transition-all border border-blue-900/30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-[10px] font-black text-gray-500 font-mono bg-black/40 px-3 py-1.5 rounded border border-gray-800">
                      STEP {simStep + 1} / {maxSteps}
                    </div>
                    <button
                      onClick={() => setSimStep(Math.min(maxSteps - 1, simStep + 1))}
                      disabled={!data || simStep >= maxSteps - 1}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg disabled:opacity-20 transition-all border border-blue-900/30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <button
                      onClick={() => setAutoPlay(!autoPlay)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all border ${autoPlay ? 'bg-orange-600 border-orange-400 text-white' : 'bg-green-600/10 border-green-500/30 text-green-400'}`}
                    >
                      {autoPlay ? 'STOP' : 'AUTO-PLAY'}
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-600/20 transition-all"
                    >
                      RESET VIEW
                    </button>
                  </div>

                  <div className="flex-1 mx-6 truncate text-right">
                    {data?.graph_states?.[simStep]?.description ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">State Narrative</span>
                        <span className="text-xs font-mono text-white font-bold max-w-md break-words truncate">
                          {data.graph_states[simStep].description}
                        </span>
                      </div>
                    ) : data?.simulation?.[simStep] ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Operation</span>
                        <span className="text-xs font-mono text-purple-400 font-bold truncate max-w-xs capitalize">
                          {data.simulation[simStep].action}: {data.simulation[simStep].var} ➔ {data.simulation[simStep].value}
                        </span>
                      </div>
                    ) : <span className="text-[10px] uppercase font-bold text-gray-700 tracking-widest">SYSTEM_IDLE</span>}
                  </div>
                </div>

                {/* Terminal Pause Overlay */}
                {isPaused && (activeTab === 'visualizer') && (
                  <div className="absolute inset-x-0 bottom-[100px] p-6 flex justify-center z-50 pointer-events-none">
                    <div className="w-full max-w-sm bg-blue-900/90 border border-blue-500 rounded-2xl p-5 shadow-[0_0_80px_-15px_rgba(59,130,246,0.8)] backdrop-blur-lg animate-in slide-in-from-bottom-8 duration-500 pointer-events-auto">
                      <div className="flex items-center justify-between mb-3 border-b border-blue-500/30 pb-2">
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping mr-2" />
                          Terminal Stream Required
                        </label>
                        <span className="text-[10px] font-mono text-blue-400 bg-black/40 px-2 py-0.5 rounded italic">var: {data.expected_var}</span>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          autoFocus
                          value={runtimeInput}
                          onChange={(e) => setRuntimeInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && pushRuntimeInput()}
                          className="flex-1 bg-black/40 border border-blue-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-400 placeholder-blue-900 transition-all font-mono text-sm"
                          placeholder="Input parameter..."
                        />
                        <button onClick={pushRuntimeInput} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all active:scale-95 shadow-[0_4px_20px_rgba(37,99,235,0.4)] uppercase text-[10px]">Push</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
