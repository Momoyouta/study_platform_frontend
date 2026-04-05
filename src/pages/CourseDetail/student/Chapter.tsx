import { UpOutlined, PlaySquareOutlined, CheckCircleFilled, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Card, Collapse, Progress, Steps, Typography, Empty } from 'antd';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { throttle } from 'lodash';
import { useStore } from '@/store';
import { ROLE_MAP } from '@/type/map.js';
import { syncProgress } from '@/http/api';
import './Chapter.less';
import { toViewFileUrl } from '@/utils/fileUrl';

const { Text, Title } = Typography;

const Chapter = observer(() => {
    const location = useLocation();
    const courseId = new URLSearchParams(location.search).get('courseId');
    const { CourseStore, UserStore, StudentStore } = useStore();

    // 老师权限标志
    const isTeacher = UserStore.role === ROLE_MAP.TEACHER;

    // 选中的课时状态
    const [selectedLesson, setSelectedLesson] = useState<any>(null);

    useEffect(() => {
        if (courseId) {
            CourseStore.fetchCourseLessonOutline(courseId);
        }
    }, [courseId, CourseStore]);

    useEffect(() => {
        const schoolId = StudentStore.schoolId || CourseStore.currentSchoolId;
        if (courseId && schoolId && !isTeacher) {
            CourseStore.fetchLearningProgress({ schoolId, courseId });
        }
    }, [courseId, CourseStore, StudentStore.schoolId, CourseStore.currentSchoolId, isTeacher]);

    const chapters = CourseStore.chapters || [];

    // 计算总课时数
    let totalCount = 0;
    chapters.forEach(chapter => {
        totalCount += (chapter.lessons || []).length;
    });

    const completedCount = CourseStore.learningProgress?.total_completed || 0;
    const currentTotalLessons = CourseStore.learningProgress?.total_lessons || totalCount;
    const progressPercent = currentTotalLessons === 0 ? 0 : (completedCount / currentTotalLessons) * 100;

    // 处理选中课时的回调，使用 useCallback 保持性能
    const handleLessonSelect = useCallback((lesson: any, chapterId: string) => {
        setSelectedLesson({ ...lesson, chapter_id: chapterId });
    }, []);

    // 进度打点相关
    const lastProgressRef = useRef<number>(0);

    const handleProgressSyncRaw = useCallback((progressPercent: number) => {
        if (!courseId || !selectedLesson?.chapter_id || !selectedLesson?.lesson_id || isTeacher) return;

        syncProgress({
            courseId,
            chapterId: selectedLesson.chapter_id,
            lessonId: selectedLesson.lesson_id,
            progress_percent: progressPercent,
            schoolId: StudentStore.schoolId || CourseStore.currentSchoolId || undefined
        }).then((res: any) => {
            if (res?.code === 200 && res.data) {
                // 如果后端返回了新的进度状态（如刚满 90% 变为完成），则同步到 Store
                CourseStore.updateLessonProgress(res.data);
            }
        }).catch(err => console.error('Sync progress failed', err));
    }, [courseId, selectedLesson, isTeacher, CourseStore, StudentStore.schoolId, CourseStore.currentSchoolId]);

    const throttledSync = useMemo(
        () => throttle(handleProgressSyncRaw, 10000),
        [handleProgressSyncRaw]
    );

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (!video.duration) return;
        const percent = Math.floor((video.currentTime / video.duration) * 100);
        lastProgressRef.current = percent;
        throttledSync(percent);
    };

    const handleProgressSync = () => {
        if (lastProgressRef.current > 0) {
            handleProgressSyncRaw(lastProgressRef.current);
            throttledSync.cancel(); // 取消未执行的节流请求
        }
    };

    // 卸载或者切换 lesson 前强制同步一次最后进度
    useEffect(() => {
        return () => {
            if (lastProgressRef.current > 0) {
                handleProgressSyncRaw(lastProgressRef.current);
            }
        };
    }, [handleProgressSyncRaw]);

    // 重置进度当课时切换时
    useEffect(() => {
        lastProgressRef.current = 0;
    }, [selectedLesson?.lesson_id]);

    const [activeKeys, setActiveKeys] = useState<string[]>([]);

    // 当章节列表加载后，默认展开所有章节
    useEffect(() => {
        if (chapters.length > 0 && activeKeys.length === 0) {
            setActiveKeys(chapters.map((c: any) => c.chapter_id));
        }
    }, [chapters, activeKeys.length]);

    // 使用 useMemo 缓存由于 chapters 数据较多带来的不必要渲染损耗
    const chapterPanelItems = useMemo(() => {
        return chapters.map((chapter: any, index: number) => {
            const lessons = chapter.lessons || [];
            const chapterNumber = index + 1;

            // 获取当前章节的进度数据
            const chapProg = CourseStore.learningProgress?.chapter_progress?.find(
                (p: any) => p.chapter_id === chapter.chapter_id
            );

            const chapterStepItems = lessons.map((lesson: any) => {
                const isSelected = selectedLesson?.lesson_id === lesson.lesson_id;

                // 查找该小节的具体完成状态
                const lessonProg = chapProg?.lessons?.find((l: any) => l.lesson_id === lesson.lesson_id);
                const isLessonCompleted = lessonProg?.is_completed === 1;

                return {
                    key: lesson.lesson_id,
                    title: (
                        <div
                            className={`lesson-step-title ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleLessonSelect(lesson, chapter.chapter_id)}
                        >
                            {lesson.title}
                        </div>
                    ),
                    status: (isLessonCompleted ? 'finish' : (isSelected ? 'process' : 'wait')) as 'wait' | 'process' | 'finish',
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
                            size="small"
                            orientation="vertical"
                            current={-1}
                            items={chapterStepItems}
                        />
                    </div>
                ),
            };
        });
    }, [chapters, selectedLesson, handleLessonSelect, CourseStore.learningProgress]);

    return (
        <div className={`chapter-container ${selectedLesson ? 'has-lesson' : ''}`}>
            {selectedLesson && (
                <div className="chapter-main-content">
                    {/* 课时标题 */}
                    <div className="lesson-header">
                        <Title level={4} style={{ margin: 0 }}>
                            {selectedLesson.title}
                        </Title>
                    </div>

                    {/* 视频播放区 */}
                    <div className="lesson-video-wrapper">
                        {selectedLesson.video_path ? (
                            <video
                                key={selectedLesson.lesson_id}
                                src={`${toViewFileUrl(selectedLesson.video_path)}?token=${UserStore.token}`}
                                controls
                                controlsList="nodownload"
                                className="lesson-video-player"
                                onTimeUpdate={handleTimeUpdate}
                                onPause={handleProgressSync}
                                onEnded={handleProgressSync}
                            >
                                您的浏览器不支持 HTML5 video 标签。
                            </video>
                        ) : (
                            <div className="no-video-placeholder">
                                <PlaySquareOutlined className="no-video-icon" />
                                <Text className="no-video-text">暂无视频</Text>
                            </div>
                        )}
                    </div>

                    {/* 课时简介 */}
                    <Card className="lesson-desc-card" variant="borderless" title="课时简介">
                        {selectedLesson.description ? (
                            <div className="lesson-desc-content">
                                {selectedLesson.description}
                            </div>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无课时简介" />
                        )}
                    </Card>
                </div>
            )}

            <Card className="course-detail-chapter-card" variant="borderless" loading={CourseStore.loading}>
                {!isTeacher && (
                    <>
                        <div className="course-detail-progress-row">
                            <span className="course-detail-progress-dot" />
                            <Text className="course-detail-progress-text">
                                已完成任务点: {completedCount}/{currentTotalLessons}
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
                    </>
                )}

                <Text className="course-detail-catalog-title">目录</Text>

                <Collapse
                    className="course-detail-chapter-collapse"
                    bordered={false}
                    activeKey={activeKeys}
                    onChange={(keys) => setActiveKeys(keys as string[])}
                    expandIconPlacement="end"
                    expandIcon={({ isActive }) => (
                        <UpOutlined className={`chapter-expand-icon${isActive ? '' : ' chapter-expand-icon-collapsed'}`} />
                    )}
                    items={chapterPanelItems}
                />
            </Card>
        </div>
    );
});

export default Chapter;
