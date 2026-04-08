import { Column } from '@ant-design/plots';
import type { LessonFunnelItemDto } from '@/type/api';

type LessonFunnelChartProps = {
    data: LessonFunnelItemDto[];
};

const LessonFunnelChart = ({ data }: LessonFunnelChartProps) => {
    const labelMap: Record<string, string> = {};

    const chartData = (data || []).map((item, index) => {
        const rawName = String(item.lessonName || '').trim() || '未命名课时';
        const lessonId = String(item.lessonId || '').trim();
        const stageKey = lessonId || `${rawName}#${index + 1}`;
        const stageLabel = lessonId ? rawName : `${rawName}${index + 1}`;
        labelMap[stageKey] = stageLabel;

        return {
            stageKey,
            stageLabel,
            value: Number(item.avgProgressPercent || 0),
        };
    });

    const config = {
        data: chartData,
        xField: 'stageKey',
        yField: 'value',
        insetTop: 20,
        color: '#4f73d6',
        label: {
            text: (datum: { value: number }) => `${Math.round(Number(datum.value || 0))}%`,
            style: {
                fill: '#1f2a44',
                fontSize: 12,
                dy: -16,
            },
        },
        tooltip: {
            title: 'stageLabel',
        },
        axis: {
            x: {
                labelFormatter: (value: string) => labelMap[value] || value,
            },
            y: {
                title: '平均观看进度(%)',
            },
        },
        style: {
            radiusTopLeft: 6,
            radiusTopRight: 6,
        },
    };

    return <Column height={280} {...config} />;
};

export default LessonFunnelChart;