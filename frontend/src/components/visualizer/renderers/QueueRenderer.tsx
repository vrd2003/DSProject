import React from 'react';
import { Rect, Text, Group, Arrow } from 'react-konva';

interface Props {
  data: any[];
  activeId?: string | number;
  width: number;
  height: number;
}

const QueueRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const boxW = 80;
  const boxH = 50;
  const spacing = 4;
  const totalH = data.length * (boxH + spacing);
  const centerX = width / 2 - boxW / 2;
  const startY = (height - totalH) / 2;

  return (
    <Group>
      {data.map((item, idx) => {
        return (
          <Group key={idx} x={centerX} y={startY + idx * (boxH + spacing)}>
            <Rect
              width={boxW}
              height={boxH}
              fill="#1e293b"
              stroke="#3b82f6"
              strokeWidth={1}
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
            {idx === 0 && (
              <Group x={-70} y={boxH / 2 - 5}>
                <Arrow points={[0, 5, 60, 5]} pointerLength={10} pointerWidth={10} fill="#f87171" stroke="#f87171" strokeWidth={2} />
                <Text text="FRONT" x={-45} y={-5} align="left" fill="#f87171" fontSize={10} fontStyle="bold" />
              </Group>
            )}
            {idx === data.length - 1 && (
              <Group x={boxW + 10} y={boxH / 2 - 5}>
                <Arrow points={[60, 5, 0, 5]} pointerLength={10} pointerWidth={10} fill="#4ade80" stroke="#4ade80" strokeWidth={2} />
                <Text text="REAR" x={70} y={-5} align="left" fill="#4ade80" fontSize={10} fontStyle="bold" />
              </Group>
            )}
          </Group>
        );
      })}
    </Group>
  );
};

export default QueueRenderer;
