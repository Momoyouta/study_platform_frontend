import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Layout, Button, Tooltip, message, Modal, Image } from 'antd';
import { SaveOutlined, UploadOutlined, RollbackOutlined, PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Question } from '@/store/homework';
import { toDataUrl } from '../../constants';
import TeacherQuestionContent from '../../components/TeacherQuestionContent';
import QuestionIndexSider from '../../components/QuestionIndexSider';
import AddQuestionModal, { type AddQuestionPayload } from '../../components/AddQuestionModal';
import TeacherTimeRangeCard from '../../components/TeacherTimeRangeCard';

const { Content, Sider } = Layout;
type ImageField = 'questionImages' | 'analysisImages';

interface TeacherEditViewProps {
    courseId: string;
    assignmentId: string;
    teachingGroupId: string;
    questionNoParam: string;
    handleBack: () => void;
    setDetailQuery: (assignmentId: string, questionNo: string, options?: { replace?: boolean }) => void;
}

const TeacherEditView = observer(({
    courseId,
    assignmentId,
    teachingGroupId,
    questionNoParam,
    handleBack,
    setDetailQuery
}: TeacherEditViewProps) => {
    const { HomeworkStore } = useStore();
    const isTeacherMode = true;
    const isPublished = HomeworkStore.isTeacherPublished;
    const isActionLoading = HomeworkStore.saveDraftLoading || HomeworkStore.publishLoading;

    const [addQuestionVisible, setAddQuestionVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);

    const questions = HomeworkStore.teacherQuestions;
    const currentQuestion = questions[HomeworkStore.activeQuestionIndex];

    useEffect(() => {
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
            setDetailQuery(assignmentId, expected, { replace: true });
        }
    }, [questionNoParam, questions.length, assignmentId, setDetailQuery]);

    const handleQuestionSelect = (index: number) => {
        HomeworkStore.setActiveQuestionIndex(index);
        setDetailQuery(assignmentId, (index + 1).toString());
    };

    const handleSaveDraft = async () => {
        const result = await HomeworkStore.saveDraft(
            courseId,
            assignmentId,
            'teacher',
            teachingGroupId,
        );
        if (!result.success) {
            message.warning(result.message || '草稿保存失败');
            return;
        }

        if (result.assignmentId && result.assignmentId !== assignmentId) {
            setDetailQuery(result.assignmentId, questionNoParam, { replace: true });
        }

        message.success('草稿保存成功');
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
                const result = await HomeworkStore.publishHomework(courseId, assignmentId, 'teacher', teachingGroupId);
                if (result.success) {
                    if (result.assignmentId && result.assignmentId !== assignmentId) {
                        setDetailQuery(result.assignmentId, questionNoParam, { replace: true });
                    }
                    message.success('作业发布成功');
                    return;
                }
                message.warning(result.message || '发布失败');
            },
        });
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
        setDetailQuery(assignmentId, String(activeNo));
        setAddQuestionVisible(false);
        message.success(`已新增 ${createdCount} 道题目`);
        return true;
    };

    const handleTeacherDragEnd = (event: DragEndEvent) => {
        if (isPublished) {
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
            setDetailQuery(assignmentId, String(activeNo));
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

    const onTeacherMarkdownUploadImg = async (files: Array<File>, callback: (urls: Array<string>) => void) => {
        const imageUrls = await Promise.all(files.map((file) => toDataUrl(file)));
        callback(imageUrls);
    };

    return (
        <>
            <Sider width={80} className="homework-action-sider" theme="light">
                <div className="action-buttons-group">
                    <Tooltip title="保存草稿" placement="right">
                        <Button
                            icon={<SaveOutlined />}
                            size="large"
                            onClick={handleSaveDraft}
                            className="action-btn"
                            loading={HomeworkStore.saveDraftLoading}
                            disabled={isActionLoading}
                        />
                    </Tooltip>
                    <Tooltip title="添加题目" placement="right">
                        <Button
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={openAddQuestionModal}
                            disabled={isPublished}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="作业时间设定" placement="right">
                        <Button
                            icon={<ClockCircleOutlined />}
                            size="large"
                            onClick={() => setTimeModalVisible(true)}
                            disabled={isActionLoading}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="发布" placement="right">
                        <Button
                            icon={<UploadOutlined />}
                            size="large"
                            onClick={handleTeacherPublish}
                            loading={HomeworkStore.publishLoading}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="返回作业概览" placement="right">
                        <Button icon={<RollbackOutlined />} size="large" onClick={handleBack} className="action-btn" />
                    </Tooltip>
                </div>
            </Sider>

            <Content className="homework-content">
                <div className="question-card">
                    <div className="question-header">
                        <span className="question-main">
                            <span className="question-no">{HomeworkStore.activeQuestionIndex + 1}. </span>
                            <span className="question-title">{currentQuestion?.title || '暂无题目'}</span>
                        </span>
                        {currentQuestion && <span className="question-score">({currentQuestion.score}分)</span>}
                    </div>
                    {!!currentQuestion?.questionImages?.length && (
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
                    </div>
                </div>
            </Content>

            <QuestionIndexSider
                questions={questions}
                activeQuestionIndex={HomeworkStore.activeQuestionIndex}
                isTeacherMode={isTeacherMode}
                isPublished={isPublished}
                withStudentResultSummary={false}
                userAnswers={{}}
                onQuestionSelect={handleQuestionSelect}
                onTeacherDragEnd={handleTeacherDragEnd}
            />

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
        </>
    );
});

export default TeacherEditView;
