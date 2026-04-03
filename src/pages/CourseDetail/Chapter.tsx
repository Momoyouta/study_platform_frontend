import { UpOutlined } from '@ant-design/icons';
import { Card, Collapse, Progress, Steps, Typography } from 'antd';
import './Chapter.less';

const { Text } = Typography;

const chapterPoints: Array<{ id: string; label: string }> = [
    { id: '1-1', label: '1.1 导学' },
    { id: '1-2', label: '1.2 数学基础' },
    { id: '1-3', label: '1.3 贪心算法' },
    { id: '1-4', label: '1.4 递推求解' },
    { id: '1-5', label: '1.5 DP入门' },
    { id: '1-6', label: '1.6 背包算法1' },
    { id: '1-7', label: '1.7 BFS入门' },
    { id: '1-8', label: '1.8 DFS入门' },
    { id: '1-9', label: '1.9 最短路径问题1' },
    { id: '1-10', label: '1.10 二分匹配算法' },
    { id: '1-11', label: '1.11 组合博弈入门' },
    { id: '1-12', label: '1.12 算法设计基础案例' },
];

const completedCount = 0;
const totalCount = chapterPoints.length;
const normalizedCompleted = Math.max(0, Math.min(completedCount, totalCount));
const currentStep = totalCount > 0 ? Math.min(normalizedCompleted, totalCount - 1) : 0;

const chapterInfo = {
    key: 'chapter-1',
    number: 1,
    title: '算法与程序设计基础实训入门',
};

const chapterStepItems = chapterPoints.map((point, index) => {
    let status: 'wait' | 'process' | 'finish' = 'wait';
    if (normalizedCompleted >= totalCount || index < normalizedCompleted) {
        status = 'finish';
    } else if (index === normalizedCompleted) {
        status = 'process';
    }

    return {
        key: point.id,
        title: point.label,
        status,
    };
});

const chapterPanelItems = [
    {
        key: chapterInfo.key,
        label: (
            <div className="chapter-panel-title">
                <span className="chapter-panel-index" aria-label={`第${chapterInfo.number}章`}>
                    <span className="chapter-panel-index-circle">{chapterInfo.number}</span>
                </span>
                <span className="chapter-panel-label">{chapterInfo.title}</span>
            </div>
        ),
        children: (
            <div className="chapter-task-list">
                <Steps
                    orientation="vertical"
                    current={currentStep}
                    items={chapterStepItems}
                />
            </div>
        ),
    },
];

const Chapter = () => {
    const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

    return (
        <Card className="course-detail-chapter-card" bordered={false}>
            <div className="course-detail-progress-row">
                <span className="course-detail-progress-dot" />
                <Text className="course-detail-progress-text">
                    已完成任务点: {completedCount}/{totalCount}
                </Text>
                <Progress
                    className="course-detail-progress-bar"
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor="#bdd1ea"
                    trailColor="#eaf0f7"
                    size={[110, 12]}
                />
            </div>

            <div className="course-detail-divider" />

            <Text className="course-detail-catalog-title">目录</Text>

            <Collapse
                className="course-detail-chapter-collapse"
                bordered={false}
                defaultActiveKey={['chapter-1']}
                expandIconPosition="end"
                expandIcon={({ isActive }) => (
                    <UpOutlined className={`chapter-expand-icon${isActive ? '' : ' chapter-expand-icon-collapsed'}`} />
                )}
                items={chapterPanelItems}
            />
        </Card>
    );
};

export default Chapter;
