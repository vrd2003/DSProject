import React from 'react';
import { Rect, Circle, Text, Group, Arrow } from 'react-konva';

interface HashEntry {
  key: string | number;
  val: any;
}

interface Bucket {
  index: number;
  entries: HashEntry[];
}

interface Props {
  data: Bucket[];
  activeId?: string | number;
  width: number;
  height: number;
}

const HashTableRenderer: React.FC<Props> = ({ data, activeId, width, height }) => {
  const bucketW = 40;
  const bucketH = 30;
  const entryW = 60;
  const entryH = 30;
  const spacingY = 5;
  const spacingX = 20;

  const startX = 50;
  const startY = (height - data.length * (bucketH + spacingY)) / 2;

  return (
    <Group>
      {data.map((bucket, bIdx) => {
        const y = startY + bIdx * (bucketH + spacingY);
        return (
          <Group key={bIdx} y={y}>
            {/* Index Label */}
            <Text text={String(bucket.index)} x={startX - 30} y={8} fill="#4b5563" fontSize={10} />
            
            {/* Bucket Slot */}
            <Rect
              x={startX}
              width={bucketW}
              height={bucketH}
              fill="#111827"
              stroke="#374151"
            />
            
            {/* Entry Chain */}
            {bucket.entries.map((entry, eIdx) => {
              const x = startX + bucketW + spacingX + eIdx * (entryW + spacingX);
              const isActive = activeId === entry.key;
              
              return (
                <Group key={eIdx} x={x}>
                  {/* Arrow from previous */}
                  <Arrow
                    points={[-spacingX, bucketH/2, 0, bucketH/2]}
                    stroke="#374151"
                    fill="#374151"
                    pointerLength={5}
                    pointerWidth={5}
                  />
                  
                  <Rect
                    width={entryW}
                    height={entryH}
                    fill={isActive ? "#3b82f6" : "#1e293b"}
                    stroke="#3b82f6"
                    cornerRadius={4}
                  />
                  <Text
                    text={`${entry.key}:${entry.val}`}
                    width={entryW}
                    height={entryH}
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
      })}
    </Group>
  );
};

export default HashTableRenderer;
