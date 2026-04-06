import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Layout, Button, Tooltip, message, Modal, Typography, Tag, Alert, Descriptions, Spin, Image } from 'antd';
import {
    SaveOutlined,
    UploadOutlined,
    RollbackOutlined,
    UserOutlined,
    PlusOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { ROLE_MAP } from '@/type/map.js';
import type { Question } from '@/store/homework';
import { uploadStudentAssignmentAnswerImage } from '@/http/api';
import { toViewFileUrl } from '@/utils/fileUrl';
import StudentQuestionContent from './components/StudentQuestionContent';
import TeacherQuestionContent from './components/TeacherQuestionContent';
import QuestionIndexSider from './components/QuestionIndexSider';
import AddQuestionModal, { type AddQuestionPayload } from './components/AddQuestionModal';
import TeacherTimeRangeCard from './components/TeacherTimeRangeCard';
import { toDataUrl } from './constants';
// @ts-ignore 由 Vite 处理样式副作用导入
import 'md-editor-rt/lib/style.css';
import './index.less';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

type ImageField = 'questionImages' | 'analysisImages';

const HomeworkDetail = observer(() => {
    const { HomeworkStore, UserStore, CourseStore } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const courseIdFromQuery = searchParams.get('courseId') || '';
    const courseId = courseIdFromQuery || CourseStore.currentCourseId || '';
    const assignmentIdFromQuery = searchParams.get('assignmentId') || '';
    const legacyHomeworkId = searchParams.get('homeworkId') || '';
    const assignmentId = assignmentIdFromQuery || legacyHomeworkId;
    const questionNoParam = searchParams.get('questionNo') || '1';

    const [addQuestionVisible, setAddQuestionVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);

    const isTeacherMode = UserStore.role === ROLE_MAP.TEACHER;
    const isPublished = isTeacherMode && HomeworkStore.isTeacherPublished;
    const studentReadonly = !isTeacherMode && [1, 2].includes(Number(HomeworkStore.studentSubmissionStatus));
    const isActionLoading = HomeworkStore.saveDraftLoading || HomeworkStore.submitLoading || HomeworkStore.publishLoading;
    const detail = HomeworkStore.detail;
    const questions = detail ? (isTeacherMode ? HomeworkStore.teacherQuestions : detail.questions) : [];
    const currentQuestion = questions[HomeworkStore.activeQuestionIndex];

    useEffect(() => {
        if ((!courseIdFromQuery && courseId) || (!assignmentIdFromQuery && assignmentId)) {
            setSearchParams({ courseId, assignmentId, questionNo: questionNoParam }, { replace: true });
        }
    }, [courseIdFromQuery, courseId, assignmentIdFromQuery, assignmentId, questionNoParam]);

    useEffect(() => {
        if (assignmentId) {
            HomeworkStore.fetchHomeworkDetail(assignmentId, isTeacherMode ? 'teacher' : 'student');
        } else if (isTeacherMode && courseId) {
            HomeworkStore.initializeTeacherCreateDraft(courseId);
        }
        return () => HomeworkStore.reset();
    }, [assignmentId, isTeacherMode, courseId]);

    useEffect(() => {
        if (!detail) {
            return;
        }

        const no = parseInt(questionNoParam, 10);
        if (no > 0) {
            HomeworkStore.setActiveQuestionIndex(no - 1);
        }
        HomeworkStore.syncActiveQuestionIndex(questions.length);

        if (questions.length === 0) {
            return;
        }

        const expected = (HomeworkStore.activeQuestionIndex + 1).toString();
        if (expected !== questionNoParam) {
            setSearchParams({ courseId, assignmentId, questionNo: expected }, { replace: true });
        }
    }, [questionNoParam, detail, questions.length]);

    const handleQuestionSelect = (index: number) => {
        HomeworkStore.setActiveQuestionIndex(index);
        setSearchParams({ courseId, assignmentId, questionNo: (index + 1).toString() });
    };

    const handleSaveDraft = async () => {
        const result = await HomeworkStore.saveDraft(courseId, assignmentId, isTeacherMode ? 'teacher' : 'student');
        if (!result.success) {
            message.warning(result.message || '草稿保存失败');
            return;
        }

        if (result.assignmentId && result.assignmentId !== assignmentId) {
            setSearchParams({ courseId, assignmentId: result.assignmentId, questionNo: questionNoParam }, { replace: true });
        }

        if (isTeacherMode) {
            message.success('草稿保存成功');
            return;
        }

        message.success('作答草稿保存成功');
    };

    const handleStudentSubmit = () => {
        Modal.confirm({
            title: '确认提交',
            content: '提交后将不可修改，确认要提交作业吗？',
            onOk: async () => {
                const success = await HomeworkStore.submitHomework(courseId, assignmentId);
                if (success) {
                    message.success('作业提交成功');
                    navigate(`/courseDetail/homework?courseId=${courseId}`);
                    return;
                }

                message.warning('作业提交失败，请稍后重试');
            }
        });
    };

    const handleTeacherPublish = () => {
        if (isPublished) {
            message.info('作业已发布，不可修改');
            return;
        }

        Modal.confirm({
            title: '确认发布',
            content: '发布后将不可修改，是否继续发布？',
            okText: '确认发布',
            onOk: async () => {
                const result = await HomeworkStore.publishHomework(courseId, assignmentId, 'teacher');
                if (result.success) {
                    if (result.assignmentId && result.assignmentId !== assignmentId) {
                        setSearchParams({ courseId, assignmentId: result.assignmentId, questionNo: questionNoParam }, { replace: true });
                    }
                    message.success('作业发布成功');
                    return;
                }
                message.warning(result.message || '发布失败');
            },
        });
    };

    const handleBack = () => {
        Modal.confirm({
            title: '确认返回',
            content: '返回前请确认已保存草稿，是否继续？',
            onOk: () => {
                const backUrl = isTeacherMode && assignmentId
                    ? `/courseDetail/homework?courseId=${courseId}&assignmentId=${assignmentId}`
                    : `/courseDetail/homework?courseId=${courseId}`;
                navigate(backUrl);
            }
        });
    };

    const handleStudentAnswerChange = (questionId: string, value: any) => {
        HomeworkStore.setUserAnswer(questionId, value);
    };

    const onTeacherMarkdownUploadImg = async (files: Array<File>, callback: (urls: Array<string>) => void) => {
        const imageUrls = await Promise.all(files.map((file) => toDataUrl(file)));
        callback(imageUrls);
    };

    const extractStudentUploadedImageUrl = (response: any) => {
        const payload = response?.data;
        const candidate = [
            typeof payload === 'string' ? payload : '',
            payload?.url,
            payload?.file_url,
            payload?.fileUrl,
            payload?.path,
            payload?.file_path,
            payload?.filePath,
            payload?.image_url,
            payload?.imageUrl,
        ].find((item) => typeof item === 'string' && item.trim().length > 0);

        return candidate ? toViewFileUrl(candidate) : '';
    };

    const onStudentMarkdownUploadImg = async (
        questionId: string,
        files: Array<File>,
        callback: (urls: Array<string>) => void,
    ) => {
        if (!assignmentId) {
            message.warning('缺少作业ID，暂无法上传图片');
            return;
        }

        if (!questionId) {
            message.warning('缺少题目ID，暂无法上传图片');
            return;
        }

        if (!files.length) {
            return;
        }

        if (files.length > 1) {
            message.info('每次仅支持上传 1 张图片，将使用第一张图片');
        }

        const file = files[0];

        try {
            const response: any = await uploadStudentAssignmentAnswerImage({
                file,
                assignment_id: assignmentId,
                question_id: questionId,
            });

            if (response?.code !== 200) {
                message.warning(response?.msg || '作答图片上传失败');
                return;
            }

            const imageUrl = extractStudentUploadedImageUrl(response);
            if (!imageUrl) {
                message.warning('上传成功但未返回图片地址');
                return;
            }

            callback([imageUrl]);
            message.success('作答图片上传成功');
        } catch (_error) {
            message.warning('作答图片上传失败，请稍后重试');
        }
    };

    const handleTeacherQuestionChange = (questionId: string, patch: Partial<Question>) => {
        if (isPublished) {
            return;
        }
        HomeworkStore.updateTeacherQuestion(questionId, patch);
    };

    const handleTeacherImageUpload = async (questionId: string, field: ImageField, files: File[]) => {
        if (isPublished || files.length === 0) {
            return;
        }

        const result = await HomeworkStore.uploadTeacherQuestionImages({
            courseId,
            frontendQuestionId: questionId,
            field,
            files,
        });

        if (!result.success) {
            message.warning(result.message || '图片上传失败，请重试');
            return;
        }

        message.success(`已上传${result.uploaded || 0}张图片`);
    };

    const handleTeacherRemoveImage = (questionId: string, field: ImageField, index: number) => {
        if (isPublished) {
            return;
        }

        HomeworkStore.removeTeacherQuestionImage(questionId, field, index);
    };

    const handleTeacherOptionChange = (questionId: string, optionIndex: number, value: string) => {
        if (isPublished) {
            return;
        }
        HomeworkStore.updateTeacherQuestionOption(questionId, optionIndex, value);
    };

    const handleTeacherAddOption = (questionId: string) => {
        if (isPublished) {
            return;
        }

        const success = HomeworkStore.appendTeacherQuestionOption(questionId);
        if (!success) {
            message.warning('最多支持 7 个选项');
        }
    };

    const openAddQuestionModal = () => {
        if (isPublished) {
            message.info('作业已发布，不可新增题目');
            return;
        }

        setAddQuestionVisible(true);
    };

    const handleAddQuestion = async (payload: AddQuestionPayload) => {
        let lastCreated = null;
        let createdCount = 0;
        for (let index = 0; index < payload.count; index += 1) {
            lastCreated = HomeworkStore.addTeacherQuestion({
                type: payload.type,
            });
            if (!lastCreated) {
                break;
            }
            createdCount += 1;
        }

        if (!lastCreated) {
            message.warning('作业已发布，不可新增题目');
            return false;
        }

        const activeNo = HomeworkStore.activeQuestionIndex + 1;
        setSearchParams({ courseId, assignmentId, questionNo: String(activeNo) });
        setAddQuestionVisible(false);
        message.success(`已新增 ${createdCount} 道题目`);
        return true;
    };

    const handleTeacherDragEnd = (event: DragEndEvent) => {
        if (!isTeacherMode || isPublished) {
            return;
        }

        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        const result = HomeworkStore.reorderTeacherQuestionWithinType(String(active.id), String(over.id));
        if (result.reason === 'cross-type') {
            message.warning('仅支持同题型内拖拽排序');
            return;
        }

        if (result.moved) {
            const activeNo = HomeworkStore.activeQuestionIndex + 1;
            setSearchParams({ courseId, assignmentId, questionNo: String(activeNo) });
        }
    };

    if (!detail) {
        return (
            <div className="homework-detail-loading">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Layout className="homework-detail-layout">
            <Header className="homework-detail-header">
                <div className="header-left">
                    <Title level={4} className="homework-title">{detail.title}</Title>
                    {isTeacherMode && (
                        <Tag color={isPublished ? 'success' : 'processing'} className="publish-status-tag">
                            {isPublished ? '已发布' : '编辑中'}
                        </Tag>
                    )}
                </div>
                <div className="header-right">
                    <UserOutlined className="user-icon" />
                    <span className="username">{UserStore.displayName}</span>
                </div>
            </Header>

            <Layout className="homework-detail-body">
                <Sider width={80} className="homework-action-sider" theme="light">
                    <div className="action-buttons-group">
                        <Tooltip title="保存草稿" placement="right">
                            <Button
                                icon={<SaveOutlined />}
                                size="large"
                                onClick={handleSaveDraft}
                                className="action-btn"
                                loading={HomeworkStore.saveDraftLoading}
                                disabled={isActionLoading || studentReadonly}
                            />
                        </Tooltip>
                        {isTeacherMode && (
                            <Tooltip title="添加题目" placement="right">
                                <Button
                                    icon={<PlusOutlined />}
                                    size="large"
                                    onClick={openAddQuestionModal}
                                    disabled={isPublished}
                                    className="action-btn"
                                />
                            </Tooltip>
                        )}
                        {isTeacherMode && (
                            <Tooltip title="作业时间设定" placement="right">
                                <Button
                                    icon={<ClockCircleOutlined />}
                                    size="large"
                                    onClick={() => setTimeModalVisible(true)}
                                    disabled={isActionLoading}
                                    className="action-btn"
                                />
                            </Tooltip>
                        )}
                        <Tooltip title={isTeacherMode ? '发布' : '提交'} placement="right">
                            <Button
                                icon={<UploadOutlined />}
                                size="large"
                                onClick={isTeacherMode ? handleTeacherPublish : handleStudentSubmit}
                                loading={isTeacherMode ? HomeworkStore.publishLoading : HomeworkStore.submitLoading}
                                disabled={(isTeacherMode && isPublished) || studentReadonly || HomeworkStore.detailLoading}
                                className="action-btn"
                            />
                        </Tooltip>
                        <Tooltip title={isTeacherMode ? '返回作业概览' : '返回课程作业页'} placement="right">
                            <Button icon={<RollbackOutlined />} size="large" onClick={handleBack} className="action-btn" />
                        </Tooltip>
                    </div>
                </Sider>

                <Content className="homework-content">
                    {!isTeacherMode && HomeworkStore.studentResult && (
                        <div className="student-result-summary">
                            <Alert
                                type="success"
                                showIcon
                                message="该作业已批改，结果由作业列表状态驱动展示"
                                description={HomeworkStore.studentResult.teacher_comment || '暂无整体评语'}
                            />
                            <Descriptions size="small" column={2} className="student-result-desc">
                                <Descriptions.Item label="总分">
                                    {HomeworkStore.studentResult.total_score}
                                </Descriptions.Item>
                                <Descriptions.Item label="状态">已批改</Descriptions.Item>
                            </Descriptions>
                        </div>
                    )}

                    <div className="question-card">
                        <div className="question-header">
                            <span className="question-no">{HomeworkStore.activeQuestionIndex + 1}. </span>
                            <span className="question-title">{currentQuestion?.title || '暂无题目'}</span>
                            {currentQuestion && <span className="question-score">({currentQuestion.score}分)</span>}
                        </div>
                        {!isTeacherMode && !!currentQuestion?.questionImages?.length && (
                            <div className="student-question-image-list">
                                <Image.PreviewGroup>
                                    {currentQuestion.questionImages.map((url, index) => (
                                        <Image
                                            key={`${url}_${index}`}
                                            src={url}
                                            alt={`题目图片${index + 1}`}
                                            style={{ maxWidth: 400, maxHeight: 300 }}
                                            preview
                                            className="student-question-image"
                                        />
                                    ))}
                                </Image.PreviewGroup>
                            </div>
                        )}
                        <div className="question-body">
                            {isTeacherMode ? (
                                <TeacherQuestionContent
                                    question={currentQuestion}
                                    isPublished={isPublished}
                                    onQuestionChange={handleTeacherQuestionChange}
                                    onOptionChange={handleTeacherOptionChange}
                                    onAddOption={handleTeacherAddOption}
                                    onUploadImages={handleTeacherImageUpload}
                                    onRemoveImage={handleTeacherRemoveImage}
                                    onMarkdownUploadImg={onTeacherMarkdownUploadImg}
                                />
                            ) : (
                                <StudentQuestionContent
                                    question={currentQuestion}
                                    answer={currentQuestion ? HomeworkStore.userAnswers[currentQuestion.id] : undefined}
                                    onAnswerChange={handleStudentAnswerChange}
                                    onUploadImg={onStudentMarkdownUploadImg}
                                    readonly={studentReadonly}
                                />
                            )}
                        </div>
                    </div>
                </Content>

                <QuestionIndexSider
                    questions={questions}
                    activeQuestionIndex={HomeworkStore.activeQuestionIndex}
                    isTeacherMode={isTeacherMode}
                    isPublished={isPublished}
                    userAnswers={HomeworkStore.userAnswers}
                    onQuestionSelect={handleQuestionSelect}
                    onTeacherDragEnd={handleTeacherDragEnd}
                />
            </Layout>

            <AddQuestionModal
                open={addQuestionVisible}
                onCancel={() => setAddQuestionVisible(false)}
                onConfirm={handleAddQuestion}
            />

            <Modal
                title="作业时间设定"
                open={timeModalVisible}
                onCancel={() => setTimeModalVisible(false)}
                footer={null}
                className="toolbar-time-modal"
                destroyOnClose
            >
                <TeacherTimeRangeCard
                    isPublished={isPublished}
                    startTime={HomeworkStore.teacherStartTime}
                    endTime={HomeworkStore.teacherEndTime}
                    onRangeChange={async (startTime, endTime) => {
                        const result = await HomeworkStore.extendTeacherDeadline(
                            assignmentId || HomeworkStore.currentAssignmentId,
                            startTime,
                            endTime,
                        );

                        if (result.success) {
                            message.success('作业时间更新成功');
                            return;
                        }

                        message.warning(result.message || '作业时间暂未同步到服务端');
                    }}
                />
            </Modal>
        </Layout>
    );
});

export default HomeworkDetail;
