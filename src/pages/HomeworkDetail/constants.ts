import type { QuestionType } from '@/store/homework';

export const TYPE_NAMES: Record<QuestionType, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    fill: '填空题',
    short: '简答题',
};

const CHOICE_TYPES: QuestionType[] = ['single', 'multiple', 'judge'];
const EDITABLE_OPTION_TYPES: QuestionType[] = ['single', 'multiple'];

export const DEFAULT_ADD_OPTIONS = ['选项1', '选项2', '选项3', '选项4'];
export const JUDGE_OPTIONS = ['正确', '错误'];
export const MAX_CHOICE_OPTIONS = 7;
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const isChoiceQuestion = (type?: QuestionType) => {
    if (!type) {
        return false;
    }
    return CHOICE_TYPES.includes(type);
};

export const isEditableOptionQuestion = (type?: QuestionType) => {
    if (!type) {
        return false;
    }
    return EDITABLE_OPTION_TYPES.includes(type);
};

export const getOptionLabel = (index: number) => {
    return OPTION_LABELS[index] || String(index + 1);
};

export const toDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result || '') as string);
        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(file);
    });
};
