import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore, resetStores } from '@/store';
import { Layout, Typography, Tag, Modal, Spin, message } from 'antd';
import { ROLE_MAP } from '@/type/map.js';
import { buildFileViewUrl } from '@/utils/fileUrl';
import UserProfileDropdown from '@/components/UserProfileDropdown';

import StudentAnswerView from './views/StudentAnswerView';
import StudentResultView from './views/StudentResultView';
import TeacherEditView from './views/TeacherEditView';
import TeacherReviewView from './views/TeacherReviewView';

import './index.less';

const { Header } = Layout;
const { Title } = Typography;

const HomeworkDetail = observer(() => {
    const { HomeworkStore, UserStore, CourseStore } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const courseIdFromQuery = searchParams.get('courseId') || '';
    const courseId = courseIdFromQuery || CourseStore.currentCourseId || '';
    
    const assignmentIdFromQuery = searchParams.get('assignmentId') || '';
    const legacyHomeworkId = searchParams.get('homeworkId') || '';
    const assignmentId = assignmentIdFromQuery || legacyHomeworkId;

    const teachingGroupIdFromQuery = searchParams.get('teachingGroupId') || '';
    const teachingGroupId = teachingGroupIdFromQuery || CourseStore.currentTeachingGroupId || '';

    const questionNoParam = searchParams.get('questionNo') || '1';
    
    const reviewMode = searchParams.get('reviewMode') || '';
    const reviewSubmissionId = searchParams.get('submissionId') || '';
    const reviewStudentNameFromQuery = searchParams.get('studentName') || '';
    const reviewAssignmentTitleFromQuery = searchParams.get('assignmentTitle') || '';

    const isTeacherMode = UserStore.role === ROLE_MAP.TEACHER;
    const isReviewRoute = reviewMode === 'teacherApproval' && !!reviewSubmissionId;
    const isTeacherReviewMode = isTeacherMode && isReviewRoute;

    const isPublished = isTeacherMode && HomeworkStore.isTeacherPublished;
    const studentSubmissionStatus = HomeworkStore.studentSubmissionStatus;
    const studentResult = HomeworkStore.studentResult;
    const isStudentReviewedView = !isTeacherMode && !isReviewRoute && studentSubmissionStatus === 2 && !!studentResult;
    const userName = UserStore.displayName || '未命名用户';
    const userAvatarSrc = UserStore.avatar ? buildFileViewUrl(UserStore.avatar) || undefined : undefined;

    const detail = HomeworkStore.detail;
    const titleText = isReviewRoute
        ? (reviewAssignmentTitleFromQuery || detail?.title || '作业主观批改')
        : (detail?.title || '');

    const setDetailQuery = (nextAssignmentId: string, nextQuestionNo: string, options?: { replace?: boolean }) => {
        const next: Record<string, string> = {
            courseId,
            questionNo: nextQuestionNo,
        };

        if (nextAssignmentId) {
            next.assignmentId = nextAssignmentId;
        }

        if (teachingGroupId) {
            next.teachingGroupId = teachingGroupId;
        }

        if (reviewMode) {
            next.reviewMode = reviewMode;
        }

        if (reviewSubmissionId) {
            next.submissionId = reviewSubmissionId;
        }

        if (reviewStudentNameFromQuery) {
            next.studentName = reviewStudentNameFromQuery;
        }

        if (reviewAssignmentTitleFromQuery) {
            next.assignmentTitle = reviewAssignmentTitleFromQuery;
        }

        setSearchParams(next, options);
    };

    useEffect(() => {
        if (
            (!courseIdFromQuery && courseId)
            || (!assignmentIdFromQuery && assignmentId)
            || (!teachingGroupIdFromQuery && teachingGroupId)
        ) {
            setDetailQuery(assignmentId, questionNoParam, { replace: true });
        }
    }, [
        courseIdFromQuery,
        courseId,
        assignmentIdFromQuery,
        assignmentId,
        questionNoParam,
        teachingGroupIdFromQuery,
        teachingGroupId,
        reviewMode,
        reviewSubmissionId,
        reviewStudentNameFromQuery,
        reviewAssignmentTitleFromQuery,
    ]);

    useEffect(() => {
        if (isReviewRoute) {
            return () => HomeworkStore.reset();
        }

        if (assignmentId) {
            HomeworkStore.fetchHomeworkDetail(assignmentId, isTeacherMode ? 'teacher' : 'student');
        } else if (isTeacherMode && courseId) {
            HomeworkStore.initializeTeacherCreateDraft(courseId);
        }

        return () => HomeworkStore.reset();
    }, [assignmentId, isTeacherMode, courseId, isReviewRoute]);

    const handleBack = () => {
        Modal.confirm({
            title: '确认返回',
            content: isTeacherReviewMode ? '确认返回作业概览吗？' : '返回前请确认已保存修改，是否继续？',
            onOk: () => {
                const next = new URLSearchParams({ courseId });
                if (isTeacherMode && assignmentId) {
                    next.set('assignmentId', assignmentId);
                }
                if (teachingGroupId) {
                    next.set('teachingGroupId', teachingGroupId);
                }
                navigate(`/courseDetail/homework?${next.toString()}`);
            }
        });
    };

    const handleLogout = () => {
        localStorage.clear();
        resetStores();
        message.success('已退出登录');
        navigate('/login', { replace: true });
    };

    if (!isTeacherReviewMode && !detail) {
        return (
            <div className="homework-detail-loading">
                <Spin size="large" />
            </div>
        );
    }

    let ViewComponent = null;
    if (isTeacherReviewMode) {
        ViewComponent = (
            <TeacherReviewView
                courseId={courseId}
                assignmentId={assignmentId}
                teachingGroupId={teachingGroupId}
                questionNoParam={questionNoParam}
                reviewSubmissionId={reviewSubmissionId}
                reviewStudentNameFromQuery={reviewStudentNameFromQuery}
                handleBack={handleBack}
                setDetailQuery={setDetailQuery}
            />
        );
    } else if (isTeacherMode) {
        ViewComponent = (
            <TeacherEditView
                courseId={courseId}
                assignmentId={assignmentId}
                teachingGroupId={teachingGroupId}
                questionNoParam={questionNoParam}
                handleBack={handleBack}
                setDetailQuery={setDetailQuery}
            />
        );
    } else if (isStudentReviewedView) {
        ViewComponent = (
            <StudentResultView
                courseId={courseId}
                assignmentId={assignmentId}
                teachingGroupId={teachingGroupId}
                questionNoParam={questionNoParam}
                handleBack={handleBack}
                setDetailQuery={setDetailQuery}
            />
        );
    } else {
        ViewComponent = (
            <StudentAnswerView
                courseId={courseId}
                assignmentId={assignmentId}
                teachingGroupId={teachingGroupId}
                questionNoParam={questionNoParam}
                handleBack={handleBack}
                setDetailQuery={setDetailQuery}
            />
        );
    }

    return (
        <Layout className="homework-detail-layout">
            <Header className="homework-detail-header">
                <div className="header-left">
                    <Title level={4} className="homework-title">{titleText}</Title>
                    {isTeacherMode && (
                        isTeacherReviewMode ? (
                            <Tag color="geekblue" className="publish-status-tag">
                                提交人{reviewStudentNameFromQuery ? ` · ${reviewStudentNameFromQuery}` : ''}
                            </Tag>
                        ) : (
                            <Tag color={isPublished ? 'success' : 'processing'} className="publish-status-tag">
                                {isPublished ? '已发布' : '编辑中'}
                            </Tag>
                        )
                    )}
                </div>
                <div className="header-right">
                    <UserProfileDropdown
                        userName={userName}
                        avatarSrc={userAvatarSrc}
                        className="homework-user-profile"
                        onAccount={() => navigate('/account')}
                        onLogout={handleLogout}
                    />
                </div>
            </Header>

            <Layout className="homework-detail-body">
                {ViewComponent}
            </Layout>
        </Layout>
    );
});

export default HomeworkDetail;
