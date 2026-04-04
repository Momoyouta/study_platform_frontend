import { UpOutlined } from '@ant-design/icons';
import { Card, Collapse, Progress, Steps, Typography } from 'antd';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import './Chapter.less';

const { Text } = Typography;

const Chapter = observer(() => {
    const location = useLocation();
    const courseId = new URLSearchParams(location.search).get('courseId');
    const { CourseStore } = useStore();

    useEffect(() => {
        if (courseId) {
            CourseStore.fetchCourseLessonOutline(courseId);
        }
    }, [courseId, CourseStore]);

    const chapters = CourseStore.chapters || [];

    // 计算总课时数
    let totalCount = 0;
    chapters.forEach(chapter => {
        totalCount += (chapter.lessons || []).length;
    });

    const completedCount = 0; // 目前暂无完成状态数据，预留
    const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

    const chapterPanelItems = chapters.map((chapter: any, index: number) => {
        const lessons = chapter.lessons || [];
        const chapterNumber = index + 1;

        const chapterStepItems = lessons.map((lesson: any) => {
            return {
                key: lesson.lesson_id,
                title: lesson.title,
                status: 'wait' as 'wait' | 'process' | 'finish',
            };
        });

        return {
            key: chapter.chapter_id,
            label: (
                <div className="chapter-panel-title">
                    <span className="chapter-panel-index" aria-label={`第${chapterNumber}章`}>
                        <span className="chapter-panel-index-circle">{chapterNumber}</span>
                    </span>
                    <span className="chapter-panel-label">{chapter.title}</span>
                </div>
            ),
            children: (
                <div className="chapter-task-list">
                    <Steps
                        progressDot
                        orientation="vertical"
                        current={-1}
                        items={chapterStepItems}
                    />
                </div>
            ),
        };
    });

    return (
        <Card className="course-detail-chapter-card" variant="borderless" loading={CourseStore.loading}>
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
                    railColor="#eaf0f7"
                    size={[110, 12]}
                />
            </div>

            <div className="course-detail-divider" />

            <Text className="course-detail-catalog-title">目录</Text>

            <Collapse
                className="course-detail-chapter-collapse"
                bordered={false}
                defaultActiveKey={chapters.length > 0 ? [chapters[0].chapter_id] : []}
                expandIconPlacement="end"
                expandIcon={({ isActive }) => (
                    <UpOutlined className={`chapter-expand-icon${isActive ? '' : ' chapter-expand-icon-collapsed'}`} />
                )}
                items={chapterPanelItems}
            />
        </Card>
    );
});

export default Chapter;
