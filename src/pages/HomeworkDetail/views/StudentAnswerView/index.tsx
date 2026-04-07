import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Layout, Button, Tooltip, message, Modal, Image } from 'antd';
import { SaveOutlined, UploadOutlined, RollbackOutlined } from '@ant-design/icons';
import { uploadStudentAssignmentAnswerImage } from '@/http/api';
import { toViewFileUrl } from '@/utils/fileUrl';
import StudentQuestionContent from '../../components/StudentQuestionContent';
import QuestionIndexSider from '../../components/QuestionIndexSider';

const { Content, Sider } = Layout;

interface StudentAnswerViewProps {
    courseId: string;
    assignmentId: string;
    teachingGroupId: string;
    questionNoParam: string;
    handleBack: () => void;
    setDetailQuery: (assignmentId: string, questionNo: string, options?: { replace?: boolean }) => void;
}

const StudentAnswerView = observer(({
    courseId,
    assignmentId,
    teachingGroupId,
    questionNoParam,
    handleBack,
    setDetailQuery
}: StudentAnswerViewProps) => {
    const { HomeworkStore } = useStore();
    const isTeacherMode = false; // Always false in this view
    const canStudentAnswer = HomeworkStore.studentSubmissionStatus === 0;
    const isActionLoading = HomeworkStore.saveDraftLoading || HomeworkStore.submitLoading;

    const detail = HomeworkStore.detail;
    const questions = detail?.questions || [];
    const currentAnswerMap = HomeworkStore.userAnswers;
    const currentQuestion = questions[HomeworkStore.activeQuestionIndex];
    const studentReadonly = !canStudentAnswer;

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
            setDetailQuery(assignmentId, expected, { replace: true });
        }
    }, [questionNoParam, detail, questions.length, assignmentId, setDetailQuery]);

    const handleQuestionSelect = (index: number) => {
        HomeworkStore.setActiveQuestionIndex(index);
        setDetailQuery(assignmentId, (index + 1).toString());
    };

    const handleSaveDraft = async () => {
        if (!canStudentAnswer) {
            message.info('作业已提交，待批改期间不可修改');
            return;
        }

        const result = await HomeworkStore.saveDraft(
            courseId,
            assignmentId,
            'student',
            teachingGroupId,
        );
        if (!result.success) {
            message.warning(result.message || '草稿保存失败');
            return;
        }

        if (result.assignmentId && result.assignmentId !== assignmentId) {
            setDetailQuery(result.assignmentId, questionNoParam, { replace: true });
        }

        message.success('作答草稿保存成功');
    };

    const navigate = useNavigate();
    const handleStudentSubmit = () => {
        if (!canStudentAnswer) {
            message.info('作业已提交，待批改期间不可重复提交');
            return;
        }

        Modal.confirm({
            title: '确认提交',
            content: '提交后将不可修改，确认要提交作业吗？',
            onOk: async () => {
                const success = await HomeworkStore.submitHomework(courseId, assignmentId);
                if (success) {
                    message.success('作业提交成功');
                    const next = new URLSearchParams({ courseId });
                    if (teachingGroupId) {
                        next.set('teachingGroupId', teachingGroupId);
                    }
                    navigate(`/courseDetail/homework?${next.toString()}`);
                    return;
                }

                message.warning('作业提交失败，请稍后重试');
            }
        });
    };

    const handleStudentAnswerChange = (questionId: string, value: any) => {
        if (!canStudentAnswer) {
            return;
        }
        HomeworkStore.setUserAnswer(questionId, value);
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
        if (!canStudentAnswer) {
            message.info('当前作业状态不允许上传作答图片');
            return;
        }

        if (!assignmentId || !questionId) {
            message.warning('缺少作业或题目ID，暂无法上传图片');
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
        } catch (error) {
            console.error('Upload student answer image failed:', error);
        }
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
                            disabled={isActionLoading || !canStudentAnswer}
                        />
                    </Tooltip>
                    <Tooltip title="提交" placement="right">
                        <Button
                            icon={<UploadOutlined />}
                            size="large"
                            onClick={handleStudentSubmit}
                            loading={HomeworkStore.submitLoading}
                            disabled={isActionLoading || !canStudentAnswer}
                            className="action-btn"
                        />
                    </Tooltip>
                    <Tooltip title="返回课程作业页" placement="right">
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
                        <StudentQuestionContent
                            question={currentQuestion}
                            answer={currentQuestion ? currentAnswerMap[currentQuestion.id] : undefined}
                            onAnswerChange={handleStudentAnswerChange}
                            onUploadImg={onStudentMarkdownUploadImg}
                            readonly={studentReadonly}
                        />
                    </div>
                </div>
            </Content>

            <QuestionIndexSider
                questions={questions}
                activeQuestionIndex={HomeworkStore.activeQuestionIndex}
                isTeacherMode={isTeacherMode}
                isPublished={false}
                withStudentResultSummary={false}
                userAnswers={currentAnswerMap}
                onQuestionSelect={handleQuestionSelect}
            />
        </>
    );
});

export default StudentAnswerView;
