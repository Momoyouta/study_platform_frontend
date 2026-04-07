import { useRef, useState } from 'react';
import { Button, Checkbox, Input, Radio, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { MdEditor, MdPreview } from 'md-editor-rt';
import type { Question } from '@/store/homework';
import { getOptionLabel } from '../constants';

type StudentQuestionContentProps = {
    question?: Question;
    answer: any;
    onAnswerChange: (questionId: string, value: any) => void;
    onUploadImg: (questionId: string, files: Array<File>, callback: (urls: Array<string>) => void) => Promise<void>;
    readonly?: boolean;
};

const StudentQuestionContent = ({
    question,
    answer,
    onAnswerChange,
    onUploadImg,
    readonly = false,
}: StudentQuestionContentProps) => {
    const shortAnswerImageInputRef = useRef<HTMLInputElement>(null);
    const [shortAnswerImageUploading, setShortAnswerImageUploading] = useState(false);

    if (!question) {
        return null;
    }

    const backendQuestionId = question.backendQuestionId || question.id;

    const handleEditorUpload = async (files: Array<File>, callback: (urls: Array<string>) => void) => {
        await onUploadImg(backendQuestionId, files, callback);
    };

    const handleShortAnswerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (files.length === 0 || readonly) {
            return;
        }

        setShortAnswerImageUploading(true);

        try {
            await onUploadImg(backendQuestionId, [files[0]], (urls) => {
                if (!urls || urls.length === 0) {
                    return;
                }

                const markdownImage = `![作答图片](${urls[0]})`;
                const currentValue = String(answer ?? '').trimEnd();
                const nextValue = currentValue ? `${currentValue}\n\n${markdownImage}` : markdownImage;
                onAnswerChange(question.id, nextValue);
            });
        } finally {
            setShortAnswerImageUploading(false);
        }
    };

    switch (question.type) {
        case 'single':
        case 'judge':
            return (
                <Radio.Group
                    onChange={(event) => onAnswerChange(question.id, event.target.value)}
                    value={answer}
                    className="question-options-group"
                    disabled={readonly}
                >
                    <Space direction="vertical">
                        {question.options?.map((option, index) => (
                            <Radio key={index} value={index}>
                                {question.type === 'judge' ? option : `${getOptionLabel(index)}. ${option}`}
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            );
        case 'multiple':
            return (
                <Checkbox.Group
                    onChange={(checkedValues) => onAnswerChange(question.id, checkedValues)}
                    value={answer || []}
                    className="question-options-group"
                    disabled={readonly}
                >
                    <Space direction="vertical">
                        {question.options?.map((option, index) => (
                            <Checkbox key={index} value={index}>
                                {`${getOptionLabel(index)}. ${option}`}
                            </Checkbox>
                        ))}
                    </Space>
                </Checkbox.Group>
            );
        case 'fill':
            return (
                <div className="fill-question-wrapper">
                    <Input
                        placeholder="请输入你的答案"
                        value={answer || ''}
                        disabled={readonly}
                        onChange={(event) => onAnswerChange(question.id, event.target.value)}
                    />
                </div>
            );
        case 'short':
            return (
                <div className="short-question-wrapper">
                    {readonly ? (
                        <MdPreview
                            key={question.id}
                            id={`student-short-preview-${question.id}`}
                            modelValue={String(answer ?? '')}
                            style={{padding: '0 8px'}}
                        />
                    ) : (
                        <>
                            <div className="student-short-toolbar">
                                <Button
                                    icon={<UploadOutlined />}
                                    loading={shortAnswerImageUploading}
                                    onClick={() => shortAnswerImageInputRef.current?.click()}
                                >
                                    上传作答图片
                                </Button>
                                <input
                                    ref={shortAnswerImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="student-short-hidden-input"
                                    onChange={handleShortAnswerImageUpload}
                                />
                            </div>
                            <MdEditor
                                key={question.id}
                                modelValue={String(answer ?? '')}
                                onChange={(value) => onAnswerChange(question.id, value)}
                                onUploadImg={handleEditorUpload}
                                noUploadImg
                                preview={false}
                            />
                        </>
                    )}
                </div>
            );
        default:
            return null;
    }
};

export default StudentQuestionContent;
