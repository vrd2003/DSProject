import React from 'react';
import { Rect, Text, Group } from 'react-konva';

interface Props {
  data: any[];
  activeId?: string | number;
  width: number;
  height: number;
}

const ArrayRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const boxSize = 60;
  const spacing = 10;
  const totalWidth = data.length * (boxSize + spacing);
  const startX = (width - totalWidth) / 2;
  const startY = (height - boxSize) / 2;

  return (
    <Group>
      {data.map((item, idx) => {
        const isActive = activeId === idx || activeId === `arr_${idx}`;
        return (
          <Group key={idx} x={startX + idx * (boxSize + spacing)} y={startY}>
            <Rect
              width={boxSize}
              height={boxSize}
              fill={isActive ? "#facc15" : "#1e293b"}
              stroke="#3b82f6"
              strokeWidth={isActive ? 4 : 1}
              cornerRadius={8}
              shadowBlur={isActive ? 20 : 0}
              shadowColor="#facc15"
            />
            <Text
              text={String(typeof item === 'object' ? item.val : item)}
              width={boxSize}
              height={boxSize}
              align="center"
              verticalAlign="middle"
              fill={isActive ? "#000" : "#60a5fa"}
              fontSize={14}
              fontStyle="bold"
            />
            <Text
              text={String(idx)}
              x={0}
              y={boxSize + 5}
              width={boxSize}
              align="center"
              fill="#4b5563"
              fontSize={10}
            />
          </Group>
        );
      })}
    </Group>
  );
};

export default ArrayRenderer;
