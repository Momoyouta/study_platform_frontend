import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Input, InputNumber } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { MdEditor } from 'md-editor-rt';
import type { Question } from '@/store/homework';
import {
    JUDGE_OPTIONS,
    MAX_CHOICE_OPTIONS,
    getOptionLabel,
    isChoiceQuestion,
    isEditableOptionQuestion,
} from '../constants';

type ImageField = 'questionImages' | 'analysisImages';

type TeacherQuestionContentProps = {
    question?: Question;
    isPublished: boolean;
    onQuestionChange: (questionId: string, patch: Partial<Question>) => void;
    onOptionChange: (questionId: string, optionIndex: number, value: string) => void;
    onAddOption: (questionId: string) => void;
    onUploadImages: (questionId: string, field: ImageField, files: File[]) => Promise<void>;
    onRemoveImage: (questionId: string, field: ImageField, index: number) => void;
    onMarkdownUploadImg: (files: Array<File>, callback: (urls: Array<string>) => void) => Promise<void>;
};

const TeacherQuestionContent = ({
    question,
    isPublished,
    onQuestionChange,
    onOptionChange,
    onAddOption,
    onUploadImages,
    onRemoveImage,
    onMarkdownUploadImg,
}: TeacherQuestionContentProps) => {
    const questionImageInputRef = useRef<HTMLInputElement | null>(null);
    const analysisImageInputRef = useRef<HTMLInputElement | null>(null);

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>, field: ImageField) => {
        const files = Array.from(event.target.files || []);
        if (!question || files.length === 0) {
            return;
        }

        await onUploadImages(question.id, field, files);
        event.target.value = '';
    };

    if (!question) {
        return <div className="teacher-empty-question">暂无题目，请先使用左侧按钮添加题目。</div>;
    }

    const isChoiceType = isChoiceQuestion(question.type);
    const isOptionEditable = isEditableOptionQuestion(question.type);
    const isMultipleAnswer = question.type === 'multiple';

    const answerOptions = (() => {
        if (question.type === 'judge') {
            return [...JUDGE_OPTIONS];
        }
        if (isChoiceType) {
            return [...(question.options || [])];
        }
        return [];
    })();

    const parseAnswerTokens = (value?: string) => {
        if (!value) {
            return [] as string[];
        }
        return value
            .split(/[，,\s]+/)
            .map((item) => item.trim())
            .map((item) => {
                const normalized = item.toUpperCase();
                if (question.type !== 'judge') {
                    return normalized;
                }

                if (['A', '1', '正确', '对', 'TRUE', 'T'].includes(normalized)) {
                    return 'A';
                }
                if (['B', '0', '错误', '错', 'FALSE', 'F'].includes(normalized)) {
                    return 'B';
                }
                return normalized;
            })
            .filter(Boolean);
    };

    const sortAnswerTokens = (tokens: string[]) => {
        return [...tokens].sort((a, b) => {
            const aIndex = answerOptions.findIndex((_item, index) => getOptionLabel(index) === a);
            const bIndex = answerOptions.findIndex((_item, index) => getOptionLabel(index) === b);
            return aIndex - bIndex;
        });
    };

    const selectedAnswerTokens = parseAnswerTokens(question.referenceAnswer);

    const handleAnswerBoxClick = (optionIndex: number) => {
        if (isPublished) {
            return;
        }

        const optionLabel = getOptionLabel(optionIndex);
        if (isMultipleAnswer) {
            const tokenSet = new Set(selectedAnswerTokens);
            if (tokenSet.has(optionLabel)) {
                tokenSet.delete(optionLabel);
            } else {
                tokenSet.add(optionLabel);
            }

            const nextTokens = sortAnswerTokens(Array.from(tokenSet));
            onQuestionChange(question.id, { referenceAnswer: nextTokens.join(', ') });
            return;
        }

        onQuestionChange(question.id, { referenceAnswer: optionLabel });
    };

    return (
        <div className="teacher-editor-wrapper">
            <div className="teacher-editor-field">
                <div className="field-label">题目内容</div>
                <Input.TextArea
                    value={question.title}
                    disabled={isPublished}
                    rows={4}
                    placeholder="请输入题目内容"
                    onChange={(event) => onQuestionChange(question.id, { title: event.target.value })}
                />
            </div>

            <div className="teacher-editor-meta-row">
                <div className="field-label">分值</div>
                <InputNumber
                    min={0}
                    value={question.score}
                    disabled={isPublished}
                    onChange={(value) => onQuestionChange(question.id, { score: Number(value || 0) })}
                />
            </div>

            {isChoiceType && (
                <div className="teacher-editor-field">
                    <div className="field-label">选项</div>
                    <div className="teacher-option-list">
                        {answerOptions.map((option, index) => (
                            <div className="teacher-option-item" key={`${question.id}-option-${index}`}>
                                <span className="option-label">{getOptionLabel(index)}.</span>
                                {isOptionEditable ? (
                                    <Input
                                        value={option}
                                        disabled={isPublished}
                                        placeholder={`请输入选项${getOptionLabel(index)}内容`}
                                        onChange={(event) => onOptionChange(question.id, index, event.target.value)}
                                    />
                                ) : (
                                    <Input value={option} disabled />
                                )}
                            </div>
                        ))}
                        {isOptionEditable && answerOptions.length < MAX_CHOICE_OPTIONS && !isPublished && (
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                className="add-option-btn"
                                onClick={() => onAddOption(question.id)}
                            >
                                添加选项
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="teacher-editor-field">
                <div className="field-label">参考答案</div>
                {isChoiceType ? (
                    <>
                        <div className="answer-box-row">
                            {answerOptions.map((_option, index) => {
                                const optionLabel = getOptionLabel(index);
                                const isSelected = selectedAnswerTokens.includes(optionLabel);

                                return (
                                    <button
                                        key={`${question.id}-answer-${optionLabel}`}
                                        type="button"
                                        className={`answer-box ${isSelected ? 'active' : ''}`}
                                        onClick={() => handleAnswerBoxClick(index)}
                                        disabled={isPublished}
                                    >
                                        {optionLabel}
                                    </button>
                                );
                            })}
                        </div>
                        <Input
                            value={question.referenceAnswer || ''}
                            disabled={isPublished}
                            placeholder={isMultipleAnswer ? '可输入 A,C 或点击方框选择' : '可输入 A 或点击方框选择'}
                            onChange={(event) =>
                                onQuestionChange(question.id, {
                                    referenceAnswer: event.target.value.toUpperCase(),
                                })
                            }
                        />
                    </>
                ) : (
                    <Input.TextArea
                        value={question.referenceAnswer || ''}
                        rows={3}
                        disabled={isPublished}
                        placeholder="请输入参考答案"
                        onChange={(event) => onQuestionChange(question.id, { referenceAnswer: event.target.value })}
                    />
                )}
            </div>

            <div className="teacher-upload-row">
                <Button
                    icon={<UploadOutlined />}
                    onClick={() => questionImageInputRef.current?.click()}
                    disabled={isPublished}
                >
                    上传题目图片
                </Button>
                <Button
                    icon={<UploadOutlined />}
                    onClick={() => analysisImageInputRef.current?.click()}
                    disabled={isPublished}
                >
                    上传答案解析图片
                </Button>
            </div>

            <input
                ref={questionImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden-file-input"
                onChange={(event) => handleImageChange(event, 'questionImages')}
            />
            <input
                ref={analysisImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden-file-input"
                onChange={(event) => handleImageChange(event, 'analysisImages')}
            />

            {!!question.questionImages?.length && (
                <div className="teacher-editor-field">
                    <div className="field-label">题目图片</div>
                    <div className="teacher-image-list">
                        {question.questionImages.map((url, index) => (
                            <div className="teacher-image-item" key={`${question.id}-question-image-${index}`}>
                                <img src={url} alt="question" />
                                {!isPublished && (
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => onRemoveImage(question.id, 'questionImages', index)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="teacher-editor-field">
                <div className="field-label">答案解析（可选）</div>
                <MdEditor
                    modelValue={question.analysis || ''}
                    onChange={(value) => onQuestionChange(question.id, { analysis: value })}
                    onUploadImg={onMarkdownUploadImg}
                    preview={false}
                    readOnly={isPublished}
                />
            </div>

            {!!question.analysisImages?.length && (
                <div className="teacher-editor-field">
                    <div className="field-label">答案解析图片</div>
                    <div className="teacher-image-list">
                        {question.analysisImages.map((url, index) => (
                            <div className="teacher-image-item" key={`${question.id}-analysis-image-${index}`}>
                                <img src={url} alt="analysis" />
                                {!isPublished && (
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => onRemoveImage(question.id, 'analysisImages', index)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuestionContent;
