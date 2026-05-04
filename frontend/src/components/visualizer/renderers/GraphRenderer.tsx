import React from 'react';
import { Circle, Text, Group, Line } from 'react-konva';

interface GraphNode {
  id: string | number;
  val: any;
  neighbors?: (string | number)[];
}

interface Props {
  data: GraphNode[];
  activeId?: string | number;
  width: number;
  height: number;
}

const GraphRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const nodeRadius = 20;
  const layoutRadius = Math.min(width, height) * 0.35;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodePositions = new Map<string | number, { x: number, y: number }>();
  data.forEach((node, i) => {
    const angle = (i / data.length) * 2 * Math.PI;
    nodePositions.set(node.id, {
      x: centerX + layoutRadius * Math.cos(angle),
      y: centerY + layoutRadius * Math.sin(angle)
    });
  });

  return (
    <Group>
      {/* Edges */}
      {data.map(node => (
        (node.neighbors || []).map(neighborId => {
          const start = nodePositions.get(node.id)!;
          const end = nodePositions.get(neighborId);
          if (!end) return null;
          return (
            <Line
              key={`e-${node.id}-${neighborId}`}
              points={[start.x, start.y, end.x, end.y]}
              stroke="#374151"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })
      ))}

      {/* Nodes */}
      {data.map(node => {
        const { x, y } = nodePositions.get(node.id)!;
        const isActive = activeId === node.id;
        return (
          <Group key={node.id} x={x} y={y}>
            <Circle
              radius={nodeRadius}
              fill={isActive ? "#3b82f6" : "#1e293b"}
              stroke="#3b82f6"
            />
            <Text
              text={String(node.val)}
              x={-nodeRadius}
              y={-nodeRadius}
              width={nodeRadius * 2}
              height={nodeRadius * 2}
              align="center"
              verticalAlign="middle"
              fill="#fff"
              fontSize={10}
            />
          </Group>
        );
      })}
    </Group>
  );
};

export default GraphRenderer;
