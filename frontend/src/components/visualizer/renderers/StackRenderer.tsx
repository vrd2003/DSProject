import React from 'react';
import { Rect, Text, Group, Line } from 'react-konva';

interface Props {
  data: any[];
  activeId?: string | number;
  width: number;
  height: number;
}

const StackRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const boxW = 100;
  const boxH = 40;
  const startX = (width - boxW) / 2;
  const startY = height - 50;

  return (
    <Group>
      {/* Stack Base */}
      <Line
        points={[startX - 10, startY + 5, startX + boxW + 10, startY + 5]}
        stroke="#374151"
        strokeWidth={3}
      />
      
      {data.map((item, idx) => {
        const isActive = activeId === idx || idx === data.length - 1; // Top is usually active
        return (
          <Group key={idx} x={startX} y={startY - idx * (boxH + 5) - boxH}>
            <Rect
              width={boxW}
              height={boxH}
              fill={isActive ? "#3b82f6" : "#111827"}
              stroke="#60a5fa"
              strokeWidth={1}
              cornerRadius={4}
            />
            <Text
              text={String(typeof item === 'object' ? item.val : item)}
              width={boxW}
              height={boxH}
              align="center"
              verticalAlign="middle"
              fill="#fff"
              fontSize={14}
            />
            {idx === data.length - 1 && (
              <Text
                text="TOP"
                x={boxW + 15}
                y={boxH / 2 - 5}
                fill="#facc15"
                fontSize={10}
                fontStyle="bold"
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
};

export default StackRenderer;
