import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store';
import { ROLE_MAP } from '@/type/map.js';
import { Radio, Input, Progress, Empty, Typography, Space, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import AssignmentOverview from './components/AssignmentOverview';
import './index.less';

const { Text, Title } = Typography;

const Homework = observer(({ courseId }: { courseId: string }) => {
    const { UserStore, HomeworkStore, CourseStore } = useStore();
    const isTeacher = UserStore.role === ROLE_MAP.TEACHER;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const assignmentId = searchParams.get('assignmentId') || '';
    const teachingGroupId = searchParams.get('teachingGroupId') || CourseStore.currentTeachingGroupId || '';

    const [filterStatus, setFilterStatus] = useState('all');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (courseId) {
            HomeworkStore.fetchHomeworkList(
                courseId, 
                isTeacher ? 'teacher' : 'student',
                isTeacher ? teachingGroupId : undefined
            );
        }
    }, [courseId, isTeacher, teachingGroupId]);

    // 计算统计数据 (仅对学生有模拟进度意义，教师可直接展示)
    const totalCount = HomeworkStore.list.length;
    const completedCount = HomeworkStore.list.filter(item => item.isCompleted).length;

    const selectedTeacherAssignment = HomeworkStore.list.find((item) => item.id === assignmentId);

    const updateQuery = (patch: Record<string, string | undefined>) => {
        const next = new URLSearchParams(searchParams);
        if (courseId) {
            next.set('courseId', courseId);
        }
        if (teachingGroupId) {
            next.set('teachingGroupId', teachingGroupId);
        }

        Object.entries(patch).forEach(([key, value]) => {
            if (value) {
                next.set(key, value);
            } else {
                next.delete(key);
            }
        });

        setSearchParams(next);
    };

    // 过滤列表
    const displayList = HomeworkStore.list.filter(item => {
        // 根据角色过滤
        if (isTeacher) {
            if (filterStatus === 'published' && !item.isPublished) return false;
            if (filterStatus === 'unpublished' && item.isPublished) return false;
        } else {
            if (filterStatus === 'completed' && !item.isCompleted) return false;
            if (filterStatus === 'uncompleted' && item.isCompleted) return false;
        }

        // 根据搜索过滤
        if (searchText && !item.title.toLowerCase().includes(searchText.toLowerCase())) {
            return false;
        }

        return true;
    });

    const handleItemClick = (id: string) => {
        if (isTeacher) {
            updateQuery({ assignmentId: id });
            return;
        }

        const next = new URLSearchParams({
            courseId,
            assignmentId: id,
            questionNo: '1',
        });
        if (teachingGroupId) {
            next.set('teachingGroupId', teachingGroupId);
        }

        navigate(`/homeworkDetail?${next.toString()}`);
    };

    const handleCreateAssignment = () => {
        if (!courseId) {
            return;
        }

        const next = new URLSearchParams({
            courseId,
            questionNo: '1',
        });
        if (teachingGroupId) {
            next.set('teachingGroupId', teachingGroupId);
        }

        navigate(`/homeworkDetail?${next.toString()}`);
    };

    if (isTeacher && assignmentId) {
        return (
            <AssignmentOverview
                assignmentId={assignmentId}
                courseId={courseId}
                teachingGroupId={teachingGroupId}
                fallbackItem={selectedTeacherAssignment}
                onBackToList={() => updateQuery({ assignmentId: undefined })}
            />
        );
    }

    return (
        <div className="homework-list-container">
            <Title level={4} className="homework-page-title">作业列表</Title>

            <div className="homework-filter-bar">
                <div className="filter-left">
                    <Text type="secondary" className="filter-label">筛选</Text>
                    {isTeacher ? (
                        <Radio.Group 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            options={[
                                { label: '全部', value: 'all' },
                                { label: '已发布', value: 'published' },
                                { label: '未发布', value: 'unpublished' },
                            ]}
                        />
                    ) : (
                        <>
                            <Radio.Group 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[
                                    { label: '全部', value: 'all' },
                                    { label: '已完成', value: 'completed' },
                                    { label: '未完成', value: 'uncompleted' },
                                ]}
                            />
                            <div className="progress-wrapper">
                                <Progress 
                                    percent={totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)} 
                                    showInfo={false} 
                                    strokeColor="#4f73d6"
                                    trailColor="#e5e7eb"
                                    className="homework-progress-bar"
                                />
                                <span className="progress-text">{completedCount}/{totalCount}</span>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="filter-right">
                    {isTeacher && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="create-assignment-btn"
                            onClick={handleCreateAssignment}
                        >
                            创建作业
                        </Button>
                    )}
                    <Input 
                        placeholder="搜索作业" 
                        suffix={<SearchOutlined />} 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="homework-search-input"
                    />
                </div>
            </div>

            <div className="homework-list-content">
                {displayList.length === 0 ? (
                    <Empty description="暂无相关作业" />
                ) : (
                    displayList.map(item => {
                        const isOngoing = item.status === 'ongoing';
                        const iconClass = isOngoing ? 'homework-icon ongoing' : 'homework-icon ended';
                        
                        return (
                            <div 
                                key={item.id} 
                                className={`homework-item ${isTeacher ? 'teacher-view clickable' : 'student-view'}`}
                                onClick={() => handleItemClick(item.id)}
                            >
                                <div className="homework-item-left">
                                    <div className={iconClass}>作业</div>
                                    <div className="homework-item-info">
                                        <div className="homework-title">{item.title}</div>
                                        <div className="homework-subtitle">
                                            {isTeacher ? (
                                                <Space>
                                                    <span className={item.isPublished ? 'status-text published' : 'status-text unpublished'}>
                                                        {item.isPublished ? '已发布' : '未发布'}
                                                    </span>
                                                </Space>
                                            ) : (
                                                <Space>
                                                    {item.submissionStatus === 2 ? (
                                                        <>
                                                            <span className="status-text completed">已完成</span>
                                                            <span className="status-text graded">已批改</span>
                                                        </>
                                                    ) : item.submissionStatus === 1 ? (
                                                        <>
                                                            <span className="status-text completed">已提交</span>
                                                            <span className="status-text graded">待批改</span>
                                                        </>
                                                    ) : (
                                                        <span className="status-text uncompleted">未提交</span>
                                                    )}
                                                </Space>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="homework-item-right">
                                    <Text type="secondary" className="time-range">
                                        {item.startTime} - {item.endTime}
                                    </Text>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

export default Homework;
