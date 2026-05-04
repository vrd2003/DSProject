import React from 'react';
import { Stage, Layer } from 'react-konva';
import ArrayRenderer from './renderers/ArrayRenderer';
import StackRenderer from './renderers/StackRenderer';
import QueueRenderer from './renderers/QueueRenderer';
import LinkedListRenderer from './renderers/LinkedListRenderer';
import TreeRenderer from './renderers/TreeRenderer';
import GraphRenderer from './renderers/GraphRenderer';
import HashTableRenderer from './renderers/HashTableRenderer';

export type DSStructure = "array" | "stack" | "queue" | "linked_list" | "tree" | "graph" | "hash";

export interface VisualizerProps {
  type: DSStructure;
  data: any;
  activeId?: string | number;
  width?: number;
  height?: number;
}

const DataStructureVisualizer: React.FC<VisualizerProps> = ({ 
  type, 
  data, 
  activeId,
  width = 800, 
  height = 400 
}) => {
  const getRenderer = () => {
    switch (type) {
      case "array": return <ArrayRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "stack": return <StackRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "queue": return <QueueRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "linked_list": return <LinkedListRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "tree": return <TreeRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "graph": return <GraphRenderer data={data} activeId={activeId} width={width} height={height} />;
      case "hash": return <HashTableRenderer data={data} activeId={activeId} width={width} height={height} />;
      default: return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#0d1117]/50 rounded-xl overflow-auto border border-gray-800 shadow-inner flex flex-col items-center p-8">
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
           <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
           <span className="text-[10px] uppercase tracking-widest font-black">No structural metadata detected for this step</span>
        </div>
      ) : (
        <Stage width={width || 800} height={height || 1200} className="bg-black/20 rounded shadow-2xl">
          <Layer>
            {getRenderer()}
          </Layer>
        </Stage>
      )}
    </div>
  );
};

export default DataStructureVisualizer;
