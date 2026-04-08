import { Bar } from '@ant-design/plots';
import type { LessonFunnelItemDto } from '@/type/api';

type LessonLearnCountBarChartProps = {
    data: LessonFunnelItemDto[];
};

const LessonLearnCountBarChart = ({ data }: LessonLearnCountBarChartProps) => {
    const chartData = [...(data || [])]
        .sort((left, right) => Number(right.learnCount || 0) - Number(left.learnCount || 0))
        .map((item, index) => {
            return {
                lessonName: item.lessonName || `课时 ${index + 1}`,
                learnCount: Number(item.learnCount || 0),
            };
        });

    const config = {
        data: chartData,
        xField: 'lessonName',
        yField: 'learnCount',
        seriesField: 'lessonName',
        legend: false,
        label: {
            text: 'learnCount',
            style: {
                fill: '#ffffff',
            },
        },
        tooltip: {
            title: 'lessonName',
        },
    };

    return <Bar height={280} {...config} />;
};

export default LessonLearnCountBarChart;