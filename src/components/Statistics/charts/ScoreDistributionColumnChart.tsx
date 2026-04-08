import { Column } from '@ant-design/plots';
import type { ScoreDistributionDto } from '@/type/api';

type ScoreDistributionColumnChartProps = {
    data: ScoreDistributionDto | null;
};

const ScoreDistributionColumnChart = ({ data }: ScoreDistributionColumnChartProps) => {
    const chartData = (data?.buckets || []).map((bucket) => {
        return {
            label: bucket.label || bucket.key,
            count: Number(bucket.count || 0),
        };
    });

    const config = {
        data: chartData,
        xField: 'label',
        yField: 'count',
        label: {
            text: 'count',
            style: {
                fill: '#1f2a44',
                dy: -12,
            },
        },
        tooltip: {
            title: 'label',
        },
        axis: {
            y: {
                title: '人数',
            },
        },
    };

    return <Column height={280} {...config} />;
};

export default ScoreDistributionColumnChart;