import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Layout, Button, Tooltip, Image, Descriptions, Modal } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { MdPreview } from 'md-editor-rt';
import { toObject, toText, normalizeImageList, findStudentResultDetailByQuestion } from '../../utils';
import StudentQuestionContent from '../../components/StudentQuestionContent';
import QuestionIndexSider from '../../components/QuestionIndexSider';

const { Content, Sider } = Layout;

interface StudentResultViewProps {
    courseId: string;
    assignmentId: string;
    teachingGroupId: string;
    questionNoParam: string;
    handleBack: () => void;
    setDetailQuery: (assignmentId: string, questionNo: string, options?: { replace?: boolean }) => void;
}

const StudentResultView = observer(({
    courseId,
    assignmentId,
    teachingGroupId,
    questionNoParam,
    handleBack,
    setDetailQuery
}: StudentResultViewProps) => {
    const { HomeworkStore } = useStore();
    const isTeacherMode = false;
    const detail = HomeworkStore.detail;
    const questions = detail?.questions || [];
    const currentAnswerMap = HomeworkStore.userAnswers;
    const currentQuestion = questions[HomeworkStore.activeQuestionIndex];

    const studentResult = HomeworkStore.studentResult;
    const isStudentReviewedView = true;
    const studentResultDetails = Array.isArray(studentResult?.details)
        ? (studentResult.details as Array<Record<string, any>>)
        : [];

    const studentReviewedStatusMap = useMemo(() => {
        return questions.reduce((acc, question) => {
            const detailItem = findStudentResultDetailByQuestion(studentResultDetails, question);
            if (!detailItem) {
                return acc;
            }

            if (question.type === 'fill' || question.type === 'short') {
                const earnedScore = Number(detailItem?.score_earned);
                const fullScore = Number(question.score);
                const isFullScore = !Number.isNaN(earnedScore) && !Number.isNaN(fullScore) && earnedScore >= fullScore;

                acc[question.id] = isFullScore ? 'correct' : 'partial';
                return acc;
            }

            const isCorrect = Number(detailItem?.is_correct);
            if (isCorrect === 1) {
                acc[question.id] = 'correct';
            } else if (isCorrect === 0) {
                acc[question.id] = 'wrong';
            }

            return acc;
        }, {} as Record<string, 'correct' | 'wrong' | 'partial'>);
    }, [questions, studentResultDetails]);

    const currentStudentResultDetail = findStudentResultDetailByQuestion(studentResultDetails, currentQuestion);

    const currentStudentQuestionScore = currentStudentResultDetail?.score_earned;
    const currentStudentQuestionScoreText = currentStudentQuestionScore === null || currentStudentQuestionScore === undefined || currentStudentQuestionScore === ''
        ? '待批改'
        : `${currentStudentQuestionScore}分`;

    const currentStandardAnswerText = toText(currentStudentResultDetail?.standard_answer);
    const currentAnalysisPayload = toObject(currentStudentResultDetail?.analysis);
    const currentAnalysisText = toText(
        currentAnalysisPayload.text
        ?? currentAnalysisPayload.answer
        ?? currentAnalysisPayload.content
        ?? currentStudentResultDetail?.analysis,
    );
    const currentAnalysisImages = normalizeImageList(
        currentAnalysisPayload.images
        ?? currentAnalysisPayload.analysis_images
        ?? currentStudentResultDetail?.analysis_images,
    );

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

    return (
        <>
            <Sider width={80} className="homework-action-sider" theme="light">
                <div className="action-buttons-group">
                    <Tooltip title="返回课程作业页" placement="right">
                        <Button icon={<RollbackOutlined />} size="large" onClick={handleBack} className="action-btn" />
                    </Tooltip>
                </div>
                {isStudentReviewedView && (
                    <div className="action-score-card">
                        <div className="score-label">本题得分</div>
                        <div className="score-value">{currentStudentQuestionScoreText}</div>
                    </div>
                )}
            </Sider>

            <Content className="homework-content">
                <div className="question-card">
                    <div className="question-header">
                        <span className="question-no">{HomeworkStore.activeQuestionIndex + 1}. </span>
                        <span className="question-title">{currentQuestion?.title || '暂无题目'}</span>
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
                            onAnswerChange={() => {}}
                            onUploadImg={async () => {}}
                            readonly={true}
                        />
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
                    </div>
                </div>
            </Content>

            <Sider width={280} className="homework-student-result-sider" theme="light">
                <Descriptions size="small" column={2} className="student-result-desc">
                    <Descriptions.Item label="总分">
                        {HomeworkStore.studentResult?.total_score}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">已批改</Descriptions.Item>
                </Descriptions>
            </Sider>

            <QuestionIndexSider
                questions={questions}
                activeQuestionIndex={HomeworkStore.activeQuestionIndex}
                isTeacherMode={isTeacherMode}
                isPublished={false} // Only false to prevent weird effects in QuestionIndexSider. it does not matter much here
                withStudentResultSummary={true}
                studentReviewedStatusMap={studentReviewedStatusMap}
                userAnswers={currentAnswerMap}
                onQuestionSelect={handleQuestionSelect}
            />
        </>
    );
});

export default StudentResultView;
