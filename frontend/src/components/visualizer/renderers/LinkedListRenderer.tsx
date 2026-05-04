import React from 'react';
import { Circle, Text, Group, Arrow, Rect } from 'react-konva';

interface NodeData {
  id: string | number;
  val: any;
  next?: string | number;
}

interface Props {
  data: NodeData[];
  activeId?: string | number;
  width: number;
  height: number;
}

const LinkedListRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const nodeRadius = 25;
  const spacing = 80;
  const startY = 60;
  const centerX = width / 2;

  // Map nodes for easy lookup - Vertical Layout
  const nodeMap = new Map(data.map((n, i) => [n.id, { ...n, x: centerX, y: startY + i * spacing }]));

  return (
    <Group>
      {data.map((node, idx) => {
        const nodeInfo = nodeMap.get(node.id)!;
        const isActive = activeId === node.id;
        
        return (
          <Group key={node.id}>
            {/* Connection to Next - Points Down */}
            {(node.next || (node as any).right) && (
              <Arrow
                points={[
                  nodeInfo.x, nodeInfo.y + nodeRadius,
                  nodeMap.get(String(node.next || (node as any).right))?.x || nodeInfo.x, 
                  nodeMap.get(String(node.next || (node as any).right))?.y ? nodeMap.get(String(node.next || (node as any).right))!.y - nodeRadius : nodeInfo.y + spacing - nodeRadius
                ]}
                stroke="#374151"
                fill="#374151"
                strokeWidth={2}
                pointerLength={10}
                pointerWidth={10}
              />
            )}

            <Group x={nodeInfo.x} y={nodeInfo.y}>
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
                fontSize={12}
                fontStyle="bold"
              />
              {idx === 0 && (
                <Text text="HEAD" x={nodeRadius + 10} y={-5} fill="#facc15" fontSize={10} fontStyle="bold" />
              )}
            </Group>

            {/* NULL Pointer at the end - Below the last node */}
            {idx === data.length - 1 && (
               <Group x={nodeInfo.x} y={nodeInfo.y + spacing / 1.5}>
                  <Arrow points={[0, -spacing/3 + nodeRadius, 0, -10]} stroke="#374151" fill="#374151" />
                  <Rect x={-10} y={-10} width={20} height={20} fill="#374151" cornerRadius={4} />
                  <Text text="NULL" x={-20} y={15} width={40} align="center" fill="#64748b" fontSize={8} fontStyle="bold" />
                  <Text text="X" x={-10} y={-10} width={20} height={20} align="center" verticalAlign="middle" fill="#fff" fontSize={10} />
               </Group>
            )}
          </Group>
        );
      })}
    </Group>
  );
};

export default LinkedListRenderer;
