import { List, Progress, Space, Typography } from 'antd';
import type { QuestionAccuracyItemDto } from '@/type/api';
import './QuestionAccuracyColumnChart.less';

const { Text } = Typography;

type QuestionAccuracyColumnChartProps = {
    data: QuestionAccuracyItemDto[];
};

const QuestionAccuracyColumnChart = ({ data }: QuestionAccuracyColumnChartProps) => {
    const rankingData = [...(data || [])]
        .map((item, index) => {
            return {
                questionNo: Number(item.questionNo || index + 1),
                correctRate: Number(item.correctRate || 0) * 100,
            };
        })
        .sort((left, right) => right.correctRate - left.correctRate)
        .map((item, index) => {
            return {
                ...item,
                rank: index + 1,
            };
        });

    return (
        <div className="question-accuracy-ranking">
            <List
                size="small"
                dataSource={rankingData}
                renderItem={(item: { rank: number; questionNo: number; correctRate: number }) => {
                    return (
                        <List.Item className="question-accuracy-ranking-item" key={`q_${item.questionNo}_${item.rank}`}>
                            <div className="question-accuracy-ranking-row">
                                <Space size={10} align="start">
                                    <span className={`rank-badge rank-${item.rank <= 3 ? item.rank : 4}`}>{item.rank}</span>
                                    <div className="question-meta">
                                        <Text strong>{`题号 Q${item.questionNo}`}</Text>
                                        <Progress
                                            percent={Math.round(item.correctRate)}
                                            size="small"
                                            strokeColor="#3a7afe"
                                            showInfo={false}
                                        />
                                    </div>
                                </Space>
                                <Text className="question-accuracy-value">{`${Math.round(item.correctRate)}%`}</Text>
                            </div>
                        </List.Item>
                    );
                }}
            />
        </div>
    );
};

export default QuestionAccuracyColumnChart;