import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Layout, Button, Tooltip, message, Image, Alert, Descriptions, Spin, Modal, Form, Input, InputNumber } from 'antd';
import { RollbackOutlined, FormOutlined, CheckOutlined } from '@ant-design/icons';
import { MdPreview } from 'md-editor-rt';
import type { Question } from '@/store/homework';
import {
    getTeacherAssignmentSubjectiveSubmission,
    gradeTeacherAssignmentSubmission,
    finishTeacherAssignmentSubmissionGrading,
} from '@/http/api';
import { buildSubjectiveReviewData, toText, normalizeImageList } from '../../utils';
import StudentQuestionContent from '../../components/StudentQuestionContent';
import QuestionIndexSider from '../../components/QuestionIndexSider';

const { Content, Sider } = Layout;

interface TeacherReviewViewProps {
    courseId: string;
    assignmentId: string;
    teachingGroupId: string;
    questionNoParam: string;
    reviewSubmissionId: string;
    reviewStudentNameFromQuery: string;
    handleBack: () => void;
    setDetailQuery: (assignmentId: string, questionNo: string, options?: { replace?: boolean }) => void;
}

const TeacherReviewView = observer(({
    courseId,
    assignmentId,
    teachingGroupId,
    questionNoParam,
    reviewSubmissionId,
    reviewStudentNameFromQuery,
    handleBack,
    setDetailQuery
}: TeacherReviewViewProps) => {
    const { HomeworkStore } = useStore();
    const isTeacherMode = true;

    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
    const [reviewAnswers, setReviewAnswers] = useState<Record<string, any>>({});
    const [reviewQuestionScores, setReviewQuestionScores] = useState<Record<string, number>>({});
    const [reviewQuestionComments, setReviewQuestionComments] = useState<Record<string, string>>({});
    const [reviewOverallComment, setReviewOverallComment] = useState('');
    
    // UI state
    const [scoreModalVisible, setScoreModalVisible] = useState(false);
    const [scoreSubmitting, setScoreSubmitting] = useState(false);
    const [finishSubmitting, setFinishSubmitting] = useState(false);
    const [scoreTargetQuestionId, setScoreTargetQuestionId] = useState('');
    const [scoreForm] = Form.useForm<{ score: number; teacherComment?: string }>();

    useEffect(() => {
        if (!assignmentId || !reviewSubmissionId) {
            return;
        }

        let cancelled = false;

        const fetchReviewSubmission = async () => {
            setReviewLoading(true);

            try {
                const response: any = await getTeacherAssignmentSubjectiveSubmission({
                    assignment_id: assignmentId,
                    submission_id: reviewSubmissionId,
                    ...(teachingGroupId ? { teaching_group_id: teachingGroupId } : {}),
                });

                if (cancelled) {
                    return;
                }

                if (response?.code !== 200 || !response?.data) {
                    setReviewQuestions([]);
                    setReviewAnswers({});
                    setReviewQuestionScores({});
                    setReviewQuestionComments({});
                    setReviewOverallComment('');
                    message.warning(response?.msg || '主观题作答加载失败');
                    return;
                }

                const data = response.data;
                const parsed = buildSubjectiveReviewData(Array.isArray(data?.questions) ? data.questions : []);

                setReviewQuestions(parsed.questions);
                setReviewAnswers(parsed.answers);
                setReviewQuestionScores(parsed.scores);
                setReviewQuestionComments(parsed.comments);
                setReviewOverallComment(String(data?.overall_comment || ''));
            } catch (_error) {
                if (!cancelled) {
                    setReviewQuestions([]);
                    setReviewAnswers({});
                    setReviewQuestionScores({});
                    setReviewQuestionComments({});
                    setReviewOverallComment('');
                    message.warning('主观题作答加载失败，请稍后重试');
                }
            } finally {
                if (!cancelled) {
                    setReviewLoading(false);
                }
            }
        };

        fetchReviewSubmission();

        return () => {
            cancelled = true;
        };
    }, [assignmentId, reviewSubmissionId, teachingGroupId]);

    useEffect(() => {
        const no = parseInt(questionNoParam, 10);
        if (no > 0) {
            HomeworkStore.setActiveQuestionIndex(no - 1);
        }
        HomeworkStore.syncActiveQuestionIndex(reviewQuestions.length);

        if (reviewQuestions.length === 0) {
            return;
        }

        const expected = (HomeworkStore.activeQuestionIndex + 1).toString();
        if (expected !== questionNoParam) {
            setDetailQuery(assignmentId, expected, { replace: true });
        }
    }, [questionNoParam, reviewQuestions.length, assignmentId, setDetailQuery]);

    const handleQuestionSelect = (index: number) => {
        HomeworkStore.setActiveQuestionIndex(index);
        setDetailQuery(assignmentId, (index + 1).toString());
    };

    const currentQuestion = reviewQuestions[HomeworkStore.activeQuestionIndex];
    const scoreTargetQuestion = reviewQuestions.find((item) => item.id === scoreTargetQuestionId) || currentQuestion;

    const currentStandardAnswerText = toText(currentQuestion?.referenceAnswer);
    const currentAnalysisText = toText(currentQuestion?.analysis);
    const currentAnalysisImages = normalizeImageList(currentQuestion?.analysisImages);

    const openScoreModal = () => {
        if (!currentQuestion) {
            message.info('暂无可评分题目');
            return;
        }

        const existedScore = reviewQuestionScores[currentQuestion.id];
        const existedComment = reviewQuestionComments[currentQuestion.id] || '';

        scoreForm.setFieldsValue({
            score: existedScore !== undefined ? existedScore : Number(currentQuestion.score || 0),
            teacherComment: existedComment,
        });

        setScoreTargetQuestionId(currentQuestion.id);
        setScoreModalVisible(true);
    };

    const handleGradeQuestion = async () => {
        const targetQuestion = scoreTargetQuestion;
        if (!targetQuestion) {
            message.warning('未找到待评分题目');
            return;
        }

        const backendQuestionId = String(targetQuestion.backendQuestionId || targetQuestion.id || '');
        if (!backendQuestionId) {
            message.warning('题目ID缺失，无法评分');
            return;
        }

        const values = await scoreForm.validateFields();
        const nextScore = Number(values.score);
        if (Number.isNaN(nextScore)) {
            message.warning('请输入合法分数');
            return;
        }

        const fullScore = Number(targetQuestion.score || 0);
        if (nextScore < 0 || nextScore > fullScore) {
            message.warning(`得分需在 0-${fullScore} 分之间`);
            return;
        }

        const teacherComment = String(values.teacherComment || '').trim();

        setScoreSubmitting(true);

        try {
            const response: any = await gradeTeacherAssignmentSubmission({
                submission_id: reviewSubmissionId,
                question_id: backendQuestionId,
                score: nextScore,
                ...(teacherComment ? { teacher_comment: teacherComment } : {}),
            });

            if (response?.code !== 200) {
                message.warning(response?.msg || '评分失败，请稍后重试');
                return;
            }

            setReviewQuestionScores((prev) => ({
                ...prev,
                [targetQuestion.id]: nextScore,
            }));

            setReviewQuestionComments((prev) => {
                const next = { ...prev };
                if (teacherComment) {
                    next[targetQuestion.id] = teacherComment;
                } else {
                    delete next[targetQuestion.id];
                }
                return next;
            });

            setScoreModalVisible(false);
            message.success('评分成功');
        } catch (_error) {
            message.warning('评分失败，请稍后重试');
        } finally {
            setScoreSubmitting(false);
        }
    };

    const handleFinishGrading = () => {
        if (!reviewSubmissionId) {
            message.warning('提交记录ID缺失，无法完成批卷');
            return;
        }

        Modal.confirm({
            title: '确认完成批卷',
            content: '完成后该提交记录将标记为已批改，是否继续？',
            okText: '确认完成',
            cancelText: '取消',
            onOk: async () => {
                setFinishSubmitting(true);
                try {
                    const response: any = await finishTeacherAssignmentSubmissionGrading({
                        submission_id: reviewSubmissionId,
                    });

                    if (response?.code !== 200) {
                        message.warning(response?.msg || '完成批卷失败，请稍后重试');
                        return;
                    }

                    message.success('已完成批卷');
                    handleBack();
                } finally {
                    setFinishSubmitting(false);
                }
            },
        });
    };

    if (reviewLoading) {
        return (
            <div className="homework-detail-loading" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <Sider width={80} className="homework-action-sider" theme="light">
                <div className="action-buttons-group">
                    <Tooltip title="打分" placement="right">
                        <Button
                            icon={<FormOutlined />}
                            size="large"
                            onClick={openScoreModal}
                            className="action-btn"
                            loading={scoreSubmitting}
                            disabled={!currentQuestion || !reviewSubmissionId || finishSubmitting}
                        />
                    </Tooltip>
                    <Tooltip title="完成批卷" placement="right">
                        <Button
                            icon={<CheckOutlined />}
                            size="large"
                            onClick={handleFinishGrading}
                            className="action-btn"
                            loading={finishSubmitting}
                            disabled={!reviewSubmissionId || scoreSubmitting}
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
                        {currentQuestion && (
                            <span className="question-review-score">
                                {reviewQuestionScores[currentQuestion.id] !== undefined
                                    ? `已评分 ${reviewQuestionScores[currentQuestion.id]} 分`
                                    : '未评分'}
                            </span>
                        )}
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
                        {reviewQuestions.length === 0 ? (
                            <Alert type="info" showIcon message="暂无需主观批改的题目（填空题/简答题）" />
                        ) : (
                            <StudentQuestionContent
                                question={currentQuestion}
                                answer={currentQuestion ? reviewAnswers[currentQuestion.id] : undefined}
                                onAnswerChange={() => {}}
                                onUploadImg={async () => {}}
                                readonly={true}
                            />
                        )}
                        
                        {!!currentQuestion && (
                            <div className="student-result-extra-card">
                                <Descriptions size="small" column={1} bordered className="student-result-extra-desc">
                                    <Descriptions.Item label="参考答案">
                                        {currentStandardAnswerText ? (
                                            <MdPreview
                                                id={`question-standard-answer-${currentQuestion.id}`}
                                                modelValue={currentStandardAnswerText}
                                            />
                                        ) : '暂无参考答案'}
                                    </Descriptions.Item>
                                </Descriptions>

                                <div className="student-analysis-block">
                                    <div className="student-analysis-label">答案解析</div>
                                    {currentAnalysisText ? (
                                        <MdPreview
                                            id={`question-analysis-${currentQuestion.id}`}
                                            modelValue={currentAnalysisText}
                                        />
                                    ) : (
                                        <div className="student-analysis-empty">暂无解析</div>
                                    )}
                                    {!!currentAnalysisImages.length && (
                                        <div className="student-analysis-image-list">
                                            <Image.PreviewGroup>
                                                {currentAnalysisImages.map((url, index) => (
                                                    <Image
                                                        key={`${url}_${index}`}
                                                        src={url}
                                                        alt={`解析图片${index + 1}`}
                                                        style={{ maxWidth: 240, maxHeight: 180 }}
                                                        preview
                                                    />
                                                ))}
                                            </Image.PreviewGroup>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {!!currentQuestion && !!reviewQuestionComments[currentQuestion.id] && (
                            <Alert
                                className="teacher-review-comment"
                                type="info"
                                showIcon
                                message="评语"
                                description={reviewQuestionComments[currentQuestion.id]}
                            />
                        )}
                    </div>
                </div>
            </Content>

            <QuestionIndexSider
                questions={reviewQuestions}
                activeQuestionIndex={HomeworkStore.activeQuestionIndex}
                isTeacherMode={false} // So it behaves like student sider (no edit drag end)
                isPublished={true}
                withStudentResultSummary={false}
                userAnswers={reviewAnswers}
                onQuestionSelect={handleQuestionSelect}
            />

            <Modal
                title={`题目打分${scoreTargetQuestion ? `（满分 ${scoreTargetQuestion.score} 分）` : ''}`}
                open={scoreModalVisible}
                onCancel={() => setScoreModalVisible(false)}
                onOk={handleGradeQuestion}
                okText="确认"
                cancelText="取消"
                confirmLoading={scoreSubmitting}
                destroyOnClose
            >
                <Form form={scoreForm} layout="vertical" preserve={false}>
                    <Form.Item
                        label="得分"
                        name="score"
                        rules={[{ required: true, message: '请输入得分' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={Number(scoreTargetQuestion?.score || 0)}
                            precision={1}
                            placeholder="请输入得分"
                        />
                    </Form.Item>
                    <Form.Item label="评语（可选）" name="teacherComment">
                        <Input.TextArea rows={3} maxLength={300} placeholder="请输入评语" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
});

export default TeacherReviewView;
