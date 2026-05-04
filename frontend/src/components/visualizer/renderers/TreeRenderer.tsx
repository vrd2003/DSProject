import React from 'react';
import { Circle, Text, Group, Line, Arrow, Rect } from 'react-konva';

interface TreeNode {
  id: string | number;
  val: any;
  left?: string | number | null;
  right?: string | number | null;
  threadLeft?: boolean;
  threadRight?: boolean;
  color?: string;
  metadata?: string;
}

interface Props {
  data: TreeNode[];
  activeId?: string | number;
  width: number;
  height: number;
}

const TreeRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  if (!data || data.length === 0) return null;

  const nodeRadius = 20;
  const levelHeight = 60;
  const nodeMap = new Map<string | number, TreeNode>();
  data.forEach(node => nodeMap.set(node.id, node));

  const root = data[0]; // Assume first node is root or find one with no parent if complex

  const renderNode = (nodeId: string | number | null, x: number, y: number, offsetW: number): React.ReactNode => {
    if (nodeId === null || nodeId === "null" || !nodeMap.has(nodeId)) return null;

    const node = nodeMap.get(nodeId)!;
    const isActive = activeId === nodeId;
    const nodeColor = node.color?.toLowerCase();
    
    let fill = "#1e293b";
    if (isActive) fill = "#facc15";
    else if (nodeColor === "red") fill = "#ef4444";
    else if (nodeColor === "black") fill = "#000000";

    return (
      <Group key={nodeId}>
        {/* Left Child Connection */}
        {node.left && nodeMap.has(node.left) && (
          <>
            {node.threadLeft ? (
               <Arrow
                 points={[x, y, x - offsetW, y + levelHeight]}
                 stroke="#10b981"
                 dash={[5, 5]}
                 strokeWidth={2}
                 pointerLength={10}
                 pointerWidth={10}
               />
            ) : (
              <Line
                points={[x, y, x - offsetW, y + levelHeight]}
                stroke="#374151"
                strokeWidth={2}
              />
            )}
            {renderNode(node.left, x - offsetW, y + levelHeight, offsetW / 2)}
          </>
        )}

        {/* Right Child Connection */}
        {node.right && nodeMap.has(node.right) ? (
          <>
            {node.threadRight ? (
               <Arrow
                 points={[x, y, x + offsetW, y + levelHeight]}
                 stroke="#10b981"
                 dash={[5, 5]}
                 strokeWidth={2}
                 pointerLength={10}
                 pointerWidth={10}
               />
            ) : (
              <Line
                points={[x, y, x + offsetW, y + levelHeight]}
                stroke="#374151"
                strokeWidth={2}
              />
            )}
            {renderNode(node.right, x + offsetW, y + levelHeight, offsetW / 2)}
          </>
        ) : (
          node.threadRight === undefined && (
            <Group>
              <Arrow points={[x, y, x + offsetW, y + levelHeight]} stroke="#374151" dash={[5, 5]} strokeWidth={1} />
              <Rect x={x + offsetW - 5} y={y + levelHeight - 5} width={10} height={10} fill="#374151" />
            </Group>
          )
        )}

        <Group x={x} y={y}>
          <Circle
            radius={nodeRadius}
            fill={fill}
            stroke={isActive ? "#fbbf24" : "#3b82f6"}
            strokeWidth={isActive ? 3 : 1}
          />
          <Text
            text={String(node.val)}
            x={-nodeRadius}
            y={-nodeRadius}
            width={nodeRadius * 2}
            height={nodeRadius * 2}
            align="center"
            verticalAlign="middle"
            fill={isActive && nodeColor !== 'red' ? "#000" : "#fff"}
            fontSize={10}
            fontStyle="bold"
          />
          {node.metadata && (
             <Text
                text={node.metadata}
                x={nodeRadius + 2}
                y={-5}
                fill="#9ca3af"
                fontSize={8}
             />
          )}
        </Group>
      </Group>
    );
  };

  return (
    <Group>
      {renderNode(root.id, width / 2, 40, width / 4)}
    </Group>
  );
};

export default TreeRenderer;
