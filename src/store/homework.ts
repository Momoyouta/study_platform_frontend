import { makeAutoObservable, runInAction } from "mobx";
import { ROLE_MAP } from "@/type/map.js";
import {
    type AssignmentQuestionTypeCode,
    type TeacherAssignmentQuestionPayload,
    type StudentAssignmentAnswerPayload,
    type StudentAssignmentResultDto,
    type TeacherAssignmentSaveRequest,
} from "@/type/api";
import { toViewFileUrl } from "@/utils/fileUrl";
import {
    listStudentAssignments,
    listTeacherAssignments,
    getStudentAssignmentDetail,
    getStudentAssignmentResult,
    getTeacherAssignmentDetail,
    publishTeacherAssignment,
    saveStudentAssignmentDraft,
    saveTeacherAssignment,
    submitStudentAssignment,
    extendTeacherAssignmentDeadline,
    uploadTeacherAssignmentQuestionImage,
} from "@/http/api";

export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill' | 'short';

type RoleMode = 'teacher' | 'student';

type ImageField = 'questionImages' | 'analysisImages';

type DraftResult = {
    success: boolean;
    assignmentId?: string;
    message?: string;
};

type PublishResult = {
    success: boolean;
    assignmentId?: string;
    message?: string;
};

type DeadlineResult = {
    success: boolean;
    message?: string;
};

type UploadResult = {
    success: boolean;
    uploaded?: number;
    message?: string;
};

type PublishWindowValidation = {
    valid: boolean;
    message?: string;
};

type ReorderResult = {
    moved: boolean;
    reason?: 'not-found' | 'cross-type';
    activeIndex?: number;
};

export interface Question {
    id: string;
    backendQuestionId?: string;
    type: QuestionType;
    title: string;
    score: number;
    options?: string[];
    answer?: any;
    referenceAnswer?: string;
    analysis?: string;
    questionImages?: string[];
    analysisImages?: string[];
    sortOrder?: number;
}

export interface HomeworkListItem {
    id: string;
    title: string;
    status: 'ongoing' | 'ended' | 'not_started';
    startTime: string;
    endTime: string;
    startTimestamp?: string;
    endTimestamp?: string;
    questionCount?: number;
    submissionStatus?: number | null;
    // student specific
    isCompleted?: boolean;
    isGraded?: boolean;
    // teacher specific
    isPublished?: boolean;
    gradedCount?: number;
    submittedCount?: number;
    totalCount?: number;
}

export interface HomeworkDetail {
    id: string;
    courseId?: string;
    title: string;
    status?: number;
    startTime?: string;
    endTime?: string;
    startTimestamp?: string;
    endTimestamp?: string;
    questions: Question[];
}

const CHOICE_TYPES: QuestionType[] = ['single', 'multiple', 'judge'];
const EDITABLE_OPTION_TYPES: QuestionType[] = ['single', 'multiple'];
const DEFAULT_CHOICE_OPTIONS = ['选项1', '选项2', '选项3', '选项4'];
const JUDGE_OPTIONS = ['正确', '错误'];
const MAX_CHOICE_OPTIONS = 7;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const TYPE_CODE_TO_KEY: Record<AssignmentQuestionTypeCode, QuestionType> = {
    1: 'single',
    2: 'multiple',
    3: 'judge',
    4: 'fill',
    5: 'short',
};

const TYPE_KEY_TO_CODE: Record<QuestionType, AssignmentQuestionTypeCode> = {
    single: 1,
    multiple: 2,
    judge: 3,
    fill: 4,
    short: 5,
};

const isChoiceQuestion = (type: QuestionType) => CHOICE_TYPES.includes(type);
const isEditableOptionQuestion = (type: QuestionType) => EDITABLE_OPTION_TYPES.includes(type);

const safeArray = <T,>(value: any): T[] => {
    return Array.isArray(value) ? value : [];
};

const toObject = (value: any): Record<string, any> => {
    if (!value) {
        return {};
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, any>;
            }
        } catch (_error) {
            return {};
        }
        return {};
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
    }

    return {};
};

const sanitizeOptionText = (option: string) => {
    return String(option || '').replace(/^\s*[A-Ga-g][\.、\)]\s*/, '').trim();
};

const normalizeChoiceOptions = (type: QuestionType, options?: string[]) => {
    if (!isChoiceQuestion(type)) {
        return undefined;
    }

    if (type === 'judge') {
        return [...JUDGE_OPTIONS];
    }

    const normalized = (options || [])
        .map((item) => sanitizeOptionText(item))
        .filter(Boolean)
        .slice(0, MAX_CHOICE_OPTIONS);

    if (normalized.length === 0) {
        return [...DEFAULT_CHOICE_OPTIONS];
    }

    return normalized;
};

const toOptionLabel = (index: number) => OPTION_LABELS[index] || String(index + 1);

const toOptionIndex = (token: string, type: QuestionType) => {
    const normalized = String(token || '').trim().toUpperCase();
    if (!normalized) {
        return -1;
    }

    if (type === 'judge') {
        if (['A', '1', '正确', '对', 'TRUE', 'T'].includes(normalized)) {
            return 0;
        }
        if (['B', '0', '错误', '错', 'FALSE', 'F'].includes(normalized)) {
            return 1;
        }
    }

    const letterIndex = OPTION_LABELS.indexOf(normalized);
    if (letterIndex !== -1) {
        return letterIndex;
    }

    const numeric = Number(normalized);
    if (!Number.isNaN(numeric) && numeric >= 0) {
        return numeric;
    }

    return -1;
};

const normalizeQuestionType = (value: any): QuestionType => {
    const numericType = Number(value);
    if (numericType >= 1 && numericType <= 5) {
        return TYPE_CODE_TO_KEY[numericType as AssignmentQuestionTypeCode];
    }
    return 'single';
};

const toUnixSecondsString = (value: string) => {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    if (/^\d+$/.test(raw)) {
        return raw;
    }

    const timestamp = Date.parse(raw.replace(/-/g, '/'));
    if (Number.isNaN(timestamp)) {
        return '';
    }

    return String(Math.floor(timestamp / 1000));
};

const formatDateTime = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
};

const formatUnixSeconds = (value: any) => {
    const unix = Number(value);
    if (!unix || Number.isNaN(unix)) {
        return '';
    }

    const date = new Date(unix * 1000);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return formatDateTime(date);
};

const normalizeTeachingGroupId = (value?: string) => {
    const raw = String(value || '').trim();
    return raw || undefined;
};

const resolveStatusByWindow = (startTime: string, endTime: string): HomeworkListItem['status'] => {
    const start = Number(startTime || 0);
    const end = Number(endTime || 0);
    if (Number.isNaN(start) || Number.isNaN(end) || start <= 0 || end <= 0) {
        return 'not_started';
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < start) {
        return 'not_started';
    }
    if (now > end) {
        return 'ended';
    }
    return 'ongoing';
};

const moveArrayItem = <T,>(list: T[], fromIndex: number, toIndex: number) => {
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
};

const normalizeQuestionImageList = (value: any) => {
    return safeArray<any>(value)
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .map((item) => toViewFileUrl(item));
};

const extractIndexesFromAnswerObject = (value: any) => {
    const payload = toObject(value);

    const fromOptionIndexes = safeArray<any>(payload.option_indexes)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0);
    if (fromOptionIndexes.length > 0) {
        return fromOptionIndexes;
    }

    const optionIndex = Number(payload.option_index);
    if (Number.isInteger(optionIndex) && optionIndex >= 0) {
        return [optionIndex];
    }

    const fromAnswers = safeArray<any>(payload.answers)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0);
    if (fromAnswers.length > 0) {
        return fromAnswers;
    }

    const answer = payload.answer;
    if (Array.isArray(answer)) {
        return answer
            .map((item) => Number(item))
            .filter((item) => Number.isInteger(item) && item >= 0);
    }

    const singleAnswer = Number(answer);
    if (Number.isInteger(singleAnswer) && singleAnswer >= 0) {
        return [singleAnswer];
    }

    return [];
};

const normalizeReferenceAnswer = (type: QuestionType, answer: any) => {
    if (answer === null || answer === undefined) {
        return '';
    }

    if (isChoiceQuestion(type)) {
        const indexes = extractIndexesFromAnswerObject(answer);
        if (indexes.length === 0 && typeof answer === 'string') {
            const directIndex = toOptionIndex(answer, type);
            if (directIndex >= 0) {
                return toOptionLabel(directIndex);
            }
        }

        return indexes
            .map((index) => toOptionLabel(index))
            .join(', ');
    }

    if (typeof answer === 'string') {
        return answer;
    }

    const payload = toObject(answer);
    return String(payload.text ?? payload.value ?? '');
};

const parseReferenceTokens = (type: QuestionType, value?: string) => {
    if (!value) {
        return [] as number[];
    }

    const rawTokens = value
        .split(/[，,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);

    const indexes = rawTokens
        .map((token) => toOptionIndex(token, type))
        .filter((index) => index >= 0);

    if (type === 'single' || type === 'judge') {
        return indexes.length > 0 ? [indexes[0]] : [];
    }

    return Array.from(new Set(indexes));
};

const buildStandardAnswer = (type: QuestionType, referenceAnswer?: string) => {
    if (type === 'single' || type === 'judge') {
        const indexes = parseReferenceTokens(type, referenceAnswer);
        return {
            option_index: indexes.length > 0 ? indexes[0] : null,
        };
    }

    if (type === 'multiple') {
        return {
            option_indexes: parseReferenceTokens(type, referenceAnswer),
        };
    }

    return {
        text: String(referenceAnswer || ''),
    };
};

const parseStudentAnswer = (type: QuestionType, studentAnswer: any) => {
    if (studentAnswer === null || studentAnswer === undefined) {
        return undefined;
    }

    if (type === 'single' || type === 'judge') {
        const indexes = extractIndexesFromAnswerObject(studentAnswer);
        return indexes.length > 0 ? indexes[0] : undefined;
    }

    if (type === 'multiple') {
        return extractIndexesFromAnswerObject(studentAnswer);
    }

    if (typeof studentAnswer === 'string') {
        return studentAnswer;
    }

    const payload = toObject(studentAnswer);
    const pickTextValue = (value: any): string | undefined => {
        if (typeof value === 'string') {
            return value;
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nested = value as Record<string, any>;
            const nestedValue = nested.text
                ?? nested.value
                ?? nested.markdown
                ?? nested.md
                ?? nested.content
                ?? nested.answer;

            if (typeof nestedValue === 'string') {
                return nestedValue;
            }
        }

        return undefined;
    };

    const candidates = [
        payload.text,
        payload.value,
        payload.markdown,
        payload.md,
        payload.content,
        payload.answer,
        payload.student_answer,
        payload.studentAnswer,
    ];

    for (const candidate of candidates) {
        const parsed = pickTextValue(candidate);
        if (parsed !== undefined) {
            return parsed;
        }
    }

    return '';
};

const serializeStudentAnswer = (type: QuestionType, value: any) => {
    if (type === 'single' || type === 'judge') {
        return {
            option_index: Number(value),
        };
    }

    if (type === 'multiple') {
        const list = safeArray<any>(value)
            .map((item) => Number(item))
            .filter((item) => Number.isInteger(item) && item >= 0);
        return {
            option_indexes: list,
        };
    }

    return {
        text: String(value ?? ''),
    };
};

const hasStudentAnswerValue = (type: QuestionType, value: any) => {
    if (type === 'single' || type === 'judge') {
        return value !== undefined && value !== null && value !== '';
    }

    if (type === 'multiple') {
        return Array.isArray(value) && value.length > 0;
    }

    return String(value ?? '').trim().length > 0;
};

const normalizeOptionsFromContent = (type: QuestionType, content: Record<string, any>, fallbackOptions?: any) => {
    const rawOptions = safeArray<any>(content.options).length > 0 ? safeArray<any>(content.options) : safeArray<any>(fallbackOptions);

    const optionTextList = rawOptions
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }
            if (typeof item === 'object' && item) {
                return String(item.text ?? item.content ?? item.label ?? item.value ?? '');
            }
            return String(item ?? '');
        })
        .map((item) => item.trim())
        .filter(Boolean);

    return normalizeChoiceOptions(type, optionTextList);
};

const mapTeacherQuestion = (item: Record<string, any>): Question => {
    const type = normalizeQuestionType(item.type);
    const content = toObject(item.content);
    const analysis = toObject(item.analysis);

    const backendQuestionId = String(item.question_id || item.id || '');
    const frontendQuestionId = backendQuestionId || `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const questionImages = normalizeQuestionImageList(content.images || content.question_images || item.question_images);
    const analysisImages = normalizeQuestionImageList(analysis.images || item.analysis_images);

    const referenceAnswer = normalizeReferenceAnswer(type, item.standard_answer ?? item.answer);

    return {
        id: frontendQuestionId,
        backendQuestionId: backendQuestionId || undefined,
        type,
        title: String(content.title ?? content.stem ?? item.title ?? ''),
        score: Number(item.score ?? 0),
        options: normalizeOptionsFromContent(type, content, item.options),
        answer: item.standard_answer,
        referenceAnswer,
        analysis: String(analysis.text ?? analysis.markdown ?? ''),
        questionImages,
        analysisImages,
        sortOrder: Number(item.sort_order ?? 0),
    };
};

const mapStudentQuestion = (item: Record<string, any>) => {
    const type = normalizeQuestionType(item.type);
    const content = toObject(item.content);

    const backendQuestionId = String(item.question_id || item.id || '');
    const frontendQuestionId = backendQuestionId || `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const parsedStudentAnswer = parseStudentAnswer(type, item.student_answer);

    const question: Question = {
        id: frontendQuestionId,
        backendQuestionId: backendQuestionId || undefined,
        type,
        title: String(content.title ?? content.stem ?? item.title ?? ''),
        score: Number(item.score ?? 0),
        options: normalizeOptionsFromContent(type, content, item.options),
        questionImages: normalizeQuestionImageList(content.images || content.question_images || item.question_images),
        sortOrder: Number(item.sort_order ?? 0),
    };

    return {
        question,
        studentAnswer: parsedStudentAnswer,
    };
};

export class Homework {
    list: HomeworkListItem[] = [];
    detail: HomeworkDetail | null = null;
    activeQuestionIndex = 0;
    userAnswers: Record<string, any> = {};

    listLoading = false;
    detailLoading = false;
    saveDraftLoading = false;
    submitLoading = false;
    publishLoading = false;
    resultLoading = false;
    imageUploading = false;

    currentAssignmentId = '';
    studentSubmissionStatus: number | null = null;
    studentSubmissionId = '';
    studentResult: StudentAssignmentResultDto | null = null;

    teacherSubmissions: Array<Record<string, any>> = [];

    // 教师编辑态
    teacherQuestions: Question[] = [];
    teacherPublishStatus: 'draft' | 'published' = 'draft';
    teacherPublishAt = '';
    teacherStartTime = '';
    teacherEndTime = '';

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get isTeacherPublished() {
        return this.teacherPublishStatus === 'published';
    }

    get teacherReadonly() {
        return this.isTeacherPublished;
    }

    private resolveRoleMode(mode?: RoleMode): RoleMode {
        if (mode) {
            return mode;
        }

        const role = localStorage.getItem('user_role');
        return role === ROLE_MAP.TEACHER ? 'teacher' : 'student';
    }

    setList(list: HomeworkListItem[]) {
        this.list = list;
    }

    setDetail(detail: HomeworkDetail | null, mode: RoleMode) {
        this.detail = detail;
        this.activeQuestionIndex = 0;

        if (mode === 'teacher') {
            this.initializeTeacherDraft(detail);
        }
    }

    initializeTeacherCreateDraft(courseId: string) {
        const now = new Date();
        const deadlineDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const draftDetail: HomeworkDetail = {
            id: '',
            courseId,
            title: '新建作业',
            status: 0,
            startTime: formatDateTime(now),
            endTime: formatDateTime(deadlineDate),
            startTimestamp: '',
            endTimestamp: '',
            questions: [],
        };

        this.setDetail(draftDetail, 'teacher');
        this.currentAssignmentId = '';
        this.userAnswers = {};
        this.studentResult = null;
        this.studentSubmissionStatus = null;
        this.studentSubmissionId = '';
    }

    setActiveQuestionIndex(index: number) {
        this.activeQuestionIndex = index;
    }

    setUserAnswer(questionId: string, answer: any) {
        this.userAnswers[questionId] = answer;
    }

    setTeacherTimeRange(startTime: string, endTime: string) {
        if (this.isTeacherPublished) {
            return;
        }
        this.teacherStartTime = startTime;
        this.teacherEndTime = endTime;
    }

    validateTeacherPublishWindow(): PublishWindowValidation {
        if (!this.teacherStartTime || !this.teacherEndTime) {
            return { valid: false, message: '请先设置开始时间与结束时间' };
        }

        const start = Date.parse(this.teacherStartTime.replace(/-/g, '/'));
        const end = Date.parse(this.teacherEndTime.replace(/-/g, '/'));

        if (Number.isNaN(start) || Number.isNaN(end)) {
            return { valid: false, message: '作业时间格式不正确' };
        }

        if (end <= start) {
            return { valid: false, message: '结束时间必须晚于开始时间' };
        }

        return { valid: true };
    }

    addTeacherQuestion(payload: {
        type: QuestionType;
        title?: string;
        score?: number;
        options?: string[];
        referenceAnswer?: string;
        analysis?: string;
    }) {
        if (this.isTeacherPublished) {
            return null;
        }

        const frontendQuestionId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const question: Question = {
            id: frontendQuestionId,
            backendQuestionId: undefined,
            type: payload.type,
            title: payload.title || '',
            score: payload.score ?? 5,
            options: normalizeChoiceOptions(payload.type, payload.options),
            referenceAnswer: payload.referenceAnswer || '',
            analysis: payload.analysis || '',
            questionImages: [],
            analysisImages: [],
            sortOrder: this.teacherQuestions.length + 1,
        };

        const sameTypeIndexes = this.teacherQuestions
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.type === payload.type)
            .map(({ index }) => index);

        if (sameTypeIndexes.length === 0) {
            this.teacherQuestions = [...this.teacherQuestions, question];
            this.activeQuestionIndex = this.teacherQuestions.length - 1;
            return question;
        }

        const insertIndex = sameTypeIndexes[sameTypeIndexes.length - 1] + 1;
        this.teacherQuestions = [
            ...this.teacherQuestions.slice(0, insertIndex),
            question,
            ...this.teacherQuestions.slice(insertIndex),
        ];
        this.activeQuestionIndex = insertIndex;
        return question;
    }

    updateTeacherQuestion(questionId: string, patch: Partial<Question>) {
        if (this.isTeacherPublished) {
            return false;
        }

        const index = this.teacherQuestions.findIndex((item) => item.id === questionId);
        if (index === -1) {
            return false;
        }

        const current = this.teacherQuestions[index];
        const nextType = patch.type ?? current.type;
        const nextQuestion: Question = {
            ...current,
            ...patch,
            type: nextType,
            options: normalizeChoiceOptions(nextType, patch.options ?? current.options),
            questionImages: [...(patch.questionImages ?? current.questionImages ?? [])],
            analysisImages: [...(patch.analysisImages ?? current.analysisImages ?? [])],
        };

        this.teacherQuestions = this.teacherQuestions.map((item, i) => (i === index ? nextQuestion : item));
        return true;
    }

    updateTeacherQuestionOption(questionId: string, optionIndex: number, value: string) {
        if (this.isTeacherPublished) {
            return false;
        }

        const question = this.teacherQuestions.find((item) => item.id === questionId);
        if (!question || !isEditableOptionQuestion(question.type)) {
            return false;
        }

        const options = normalizeChoiceOptions(question.type, question.options);
        if (!options) {
            return false;
        }

        options[optionIndex] = value;
        return this.updateTeacherQuestion(questionId, { options });
    }

    appendTeacherQuestionOption(questionId: string) {
        if (this.isTeacherPublished) {
            return false;
        }

        const question = this.teacherQuestions.find((item) => item.id === questionId);
        if (!question || !isEditableOptionQuestion(question.type)) {
            return false;
        }

        const options = normalizeChoiceOptions(question.type, question.options);
        if (!options || options.length >= MAX_CHOICE_OPTIONS) {
            return false;
        }

        options.push(`选项${options.length + 1}`);
        return this.updateTeacherQuestion(questionId, { options });
    }

    appendTeacherQuestionImages(questionId: string, field: ImageField, urls: string[]) {
        if (this.isTeacherPublished) {
            return false;
        }

        const question = this.teacherQuestions.find((item) => item.id === questionId);
        if (!question) {
            return false;
        }

        const imageList = [...(question[field] || []), ...urls];
        return this.updateTeacherQuestion(questionId, { [field]: imageList });
    }

    removeTeacherQuestionImage(questionId: string, field: ImageField, index: number) {
        if (this.isTeacherPublished) {
            return false;
        }

        const question = this.teacherQuestions.find((item) => item.id === questionId);
        if (!question) {
            return false;
        }

        const list = [...(question[field] || [])];
        list.splice(index, 1);
        return this.updateTeacherQuestion(questionId, { [field]: list });
    }

    reorderTeacherQuestionWithinType(activeId: string, overId: string): ReorderResult {
        const activeQuestion = this.teacherQuestions.find((item) => item.id === activeId);
        const overQuestion = this.teacherQuestions.find((item) => item.id === overId);

        if (!activeQuestion || !overQuestion) {
            return { moved: false, reason: 'not-found' };
        }

        if (activeQuestion.type !== overQuestion.type) {
            return { moved: false, reason: 'cross-type' };
        }

        const currentTypeIds = this.teacherQuestions
            .filter((item) => item.type === activeQuestion.type)
            .map((item) => item.id);
        const activeTypeIndex = currentTypeIds.indexOf(activeId);
        const overTypeIndex = currentTypeIds.indexOf(overId);

        if (activeTypeIndex === -1 || overTypeIndex === -1 || activeTypeIndex === overTypeIndex) {
            return { moved: false };
        }

        const reorderedIds = moveArrayItem(currentTypeIds, activeTypeIndex, overTypeIndex);
        const typeQuestionMap = new Map(
            this.teacherQuestions
                .filter((item) => item.type === activeQuestion.type)
                .map((item) => [item.id, item] as const),
        );

        let pointer = 0;
        this.teacherQuestions = this.teacherQuestions.map((item) => {
            if (item.type !== activeQuestion.type) {
                return item;
            }
            const reorderedId = reorderedIds[pointer++];
            return typeQuestionMap.get(reorderedId) || item;
        });

        const activeIndex = this.teacherQuestions.findIndex((item) => item.id === activeId);
        this.activeQuestionIndex = activeIndex === -1 ? 0 : activeIndex;

        return {
            moved: true,
            activeIndex: this.activeQuestionIndex,
        };
    }

    syncActiveQuestionIndex(total: number) {
        if (total <= 0) {
            this.activeQuestionIndex = 0;
            return;
        }
        if (this.activeQuestionIndex >= total) {
            this.activeQuestionIndex = total - 1;
        }
        if (this.activeQuestionIndex < 0) {
            this.activeQuestionIndex = 0;
        }
    }

    private initializeTeacherDraft(detail: HomeworkDetail | null) {
        if (!detail) {
            this.teacherQuestions = [];
            this.teacherPublishStatus = 'draft';
            this.teacherPublishAt = '';
            this.teacherStartTime = '';
            this.teacherEndTime = '';
            return;
        }

        const sourceFromList = this.list.find((item) => item.id === detail.id);

        this.teacherQuestions = detail.questions.map((question, index) => {
            return {
                ...question,
                options: normalizeChoiceOptions(question.type, question.options),
                referenceAnswer: question.referenceAnswer || normalizeReferenceAnswer(question.type, question.answer),
                analysis: question.analysis || '',
                questionImages: [...(question.questionImages || [])],
                analysisImages: [...(question.analysisImages || [])],
                sortOrder: question.sortOrder || index + 1,
            };
        });

        const publishFromDetail = detail.status === 1;
        this.teacherPublishStatus = publishFromDetail || sourceFromList?.isPublished ? 'published' : 'draft';
        this.teacherPublishAt = '';
        this.teacherStartTime = detail.startTime || sourceFromList?.startTime || '';
        this.teacherEndTime = detail.endTime || sourceFromList?.endTime || '';
        this.currentAssignmentId = detail.id;
    }

    private buildStudentAnswerPayload() {
        const questionMap = new Map<string, Question>();
        (this.detail?.questions || []).forEach((question) => {
            questionMap.set(question.id, question);
        });

        const answers: StudentAssignmentAnswerPayload[] = [];

        Object.entries(this.userAnswers).forEach(([questionId, answerValue]) => {
            const question = questionMap.get(questionId);
            if (!question) {
                return;
            }

            if (!hasStudentAnswerValue(question.type, answerValue)) {
                return;
            }

            const backendQuestionId = question.backendQuestionId || question.id;
            if (!backendQuestionId) {
                return;
            }

            answers.push({
                question_id: backendQuestionId,
                student_answer: serializeStudentAnswer(question.type, answerValue),
            });
        });

        return answers;
    }

    private buildTeacherSavePayload(courseId: string, assignmentId?: string, teachingGroupId?: string): TeacherAssignmentSaveRequest | null {
        const startTime = toUnixSecondsString(this.teacherStartTime);
        const endTime = toUnixSecondsString(this.teacherEndTime);

        if (!startTime || !endTime) {
            return null;
        }

        const title = String(this.detail?.title || '').trim();
        const normalizedTeachingGroupId = normalizeTeachingGroupId(teachingGroupId);
        const payload: TeacherAssignmentSaveRequest = {
            assignment_id: assignmentId || this.currentAssignmentId || undefined,
            course_id: courseId,
            ...(normalizedTeachingGroupId ? { teaching_group_id: normalizedTeachingGroupId } : {}),
            title: title || '未命名作业',
            start_time: startTime,
            deadline: endTime,
            questions: this.teacherQuestions.map((question, index) => {
                const backendQuestionId = question.backendQuestionId || (question.id.startsWith('tmp_') ? '' : question.id);
                const typeCode = TYPE_KEY_TO_CODE[question.type];

                const contentPayload: Record<string, any> = {
                    title: question.title,
                    images: question.questionImages || [],
                };

                if (isChoiceQuestion(question.type)) {
                    contentPayload.options = question.options || [];
                }

                const questionPayload: TeacherAssignmentQuestionPayload = {
                    type: typeCode,
                    score: Number(question.score || 0),
                    content: contentPayload,
                    standard_answer: buildStandardAnswer(question.type, question.referenceAnswer),
                    sort_order: index + 1,
                };

                if (backendQuestionId) {
                    questionPayload.question_id = backendQuestionId;
                }

                if (question.analysis || (question.analysisImages?.length || 0) > 0) {
                    questionPayload.analysis = {
                        text: question.analysis || '',
                        images: question.analysisImages || [],
                    };
                }

                return questionPayload;
            }),
        };

        return payload;
    }

    private async saveTeacherDraftInternal(
        courseId: string,
        assignmentId?: string,
        options?: { reloadDetail?: boolean; teachingGroupId?: string },
    ) {
        const payload = this.buildTeacherSavePayload(courseId, assignmentId, options?.teachingGroupId);
        if (!payload) {
            return {
                success: false,
                message: '请先设置合法的开始时间和结束时间',
            } as DraftResult;
        }

        const response: any = await saveTeacherAssignment(payload);
        if (response?.code !== 200) {
            return {
                success: false,
                message: response?.msg || '保存草稿失败',
            } as DraftResult;
        }

        const nextAssignmentId = String(response?.data?.assignment_id || payload.assignment_id || this.currentAssignmentId || '');
        if (!nextAssignmentId) {
            return {
                success: false,
                message: '保存成功但未返回 assignment_id',
            } as DraftResult;
        }

        runInAction(() => {
            this.currentAssignmentId = nextAssignmentId;
        });

        if (options?.reloadDetail !== false) {
            await this.fetchHomeworkDetail(nextAssignmentId, 'teacher');
        }

        return {
            success: true,
            assignmentId: nextAssignmentId,
        } as DraftResult;
    }

    async fetchHomeworkList(courseId: string, mode?: RoleMode) {
        if (!courseId) {
            runInAction(() => {
                this.list = [];
            });
            return;
        }

        const roleMode = this.resolveRoleMode(mode);

        runInAction(() => {
            this.listLoading = true;
        });

        try {
            if (roleMode === 'teacher') {
                const response: any = await listTeacherAssignments({ course_id: courseId });
                const rawList = safeArray<any>(response?.data);

                const mapped = rawList.map((item) => {
                    const assignmentId = String(item.id || item.assignment_id || '');
                    const startTimestamp = String(item.start_time || '');
                    const endTimestamp = String(item.deadline || '');
                    const isPublished = Number(item.status) === 1;

                    return {
                        id: assignmentId,
                        title: String(item.title || ''),
                        status: isPublished ? resolveStatusByWindow(startTimestamp, endTimestamp) : 'not_started',
                        startTime: formatUnixSeconds(startTimestamp),
                        endTime: formatUnixSeconds(endTimestamp),
                        startTimestamp,
                        endTimestamp,
                        questionCount: Number(item.question_count || 0),
                        isPublished,
                        gradedCount: Number(item.graded_count || 0),
                        submittedCount: Number(item.submitted_count || 0),
                        totalCount: Number(item.total_students || 0),
                    } as HomeworkListItem;
                });

                runInAction(() => {
                    this.list = mapped;
                });
                return;
            }

            const response: any = await listStudentAssignments({ course_id: courseId });
            const rawList = safeArray<any>(response?.data);

            const mapped = rawList.map((item) => {
                const assignmentId = String(item.id || item.assignment_id || '');
                const startTimestamp = String(item.start_time || '');
                const endTimestamp = String(item.deadline || '');
                const submissionStatus = item.submission_status === null || item.submission_status === undefined
                    ? null
                    : Number(item.submission_status);

                return {
                    id: assignmentId,
                    title: String(item.title || ''),
                    status: resolveStatusByWindow(startTimestamp, endTimestamp),
                    startTime: formatUnixSeconds(startTimestamp),
                    endTime: formatUnixSeconds(endTimestamp),
                    startTimestamp,
                    endTimestamp,
                    submissionStatus,
                    isCompleted: submissionStatus === 1 || submissionStatus === 2,
                    isGraded: submissionStatus === 2,
                } as HomeworkListItem;
            });

            runInAction(() => {
                this.list = mapped;
            });
        } catch (_error) {
            runInAction(() => {
                this.list = [];
            });
        } finally {
            runInAction(() => {
                this.listLoading = false;
            });
        }
    }

    async fetchHomeworkDetail(assignmentId: string, mode?: RoleMode) {
        if (!assignmentId) {
            return;
        }

        const roleMode = this.resolveRoleMode(mode);

        runInAction(() => {
            this.detailLoading = true;
            this.currentAssignmentId = assignmentId;
        });

        try {
            if (roleMode === 'teacher') {
                const response: any = await getTeacherAssignmentDetail({ assignment_id: assignmentId });
                const data = response?.data;

                if (response?.code !== 200 || !data) {
                    runInAction(() => {
                        this.detail = null;
                    });
                    return;
                }

                const questions = safeArray<any>(data.questions)
                    .map((item) => mapTeacherQuestion(item))
                    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

                const detail: HomeworkDetail = {
                    id: String(data.id || assignmentId),
                    courseId: String(data.course_id || ''),
                    title: String(data.title || ''),
                    status: Number(data.status ?? 0),
                    startTimestamp: String(data.start_time || ''),
                    endTimestamp: String(data.deadline || ''),
                    startTime: formatUnixSeconds(data.start_time),
                    endTime: formatUnixSeconds(data.deadline),
                    questions,
                };

                runInAction(() => {
                    this.setDetail(detail, 'teacher');
                    this.userAnswers = {};
                    this.studentResult = null;
                    this.studentSubmissionStatus = null;
                    this.studentSubmissionId = '';
                });
                return;
            }

            const response: any = await getStudentAssignmentDetail({ assignment_id: assignmentId });
            const data = response?.data;

            if (response?.code !== 200 || !data) {
                runInAction(() => {
                    this.detail = null;
                });
                return;
            }

            const answerMap: Record<string, any> = {};
            const questions = safeArray<any>(data.questions)
                .map((item) => mapStudentQuestion(item))
                .sort((a, b) => Number(a.question.sortOrder || 0) - Number(b.question.sortOrder || 0));

            questions.forEach(({ question, studentAnswer }) => {
                if (studentAnswer !== undefined) {
                    answerMap[question.id] = studentAnswer;
                }
            });

            const detail: HomeworkDetail = {
                id: String(data.assignment_id || assignmentId),
                title: String(data.title || ''),
                startTimestamp: String(data.start_time || ''),
                endTimestamp: String(data.deadline || ''),
                startTime: formatUnixSeconds(data.start_time),
                endTime: formatUnixSeconds(data.deadline),
                questions: questions.map((item) => item.question),
            };

            const listItem = this.list.find((item) => item.id === detail.id);
            const detailStatus = Number(data.status);
            const submissionStatus = Number.isInteger(detailStatus)
                ? detailStatus
                : (listItem?.submissionStatus ?? null);
            const isValidSubmissionStatus = submissionStatus === 0 || submissionStatus === 1 || submissionStatus === 2;

            detail.status = isValidSubmissionStatus ? submissionStatus : undefined;

            runInAction(() => {
                this.setDetail(detail, 'student');
                this.userAnswers = answerMap;
                this.studentSubmissionStatus = submissionStatus;
                this.studentSubmissionId = '';
            });

            if (submissionStatus === 2) {
                await this.fetchStudentResult(detail.id);
            } else {
                runInAction(() => {
                    this.studentResult = null;
                });
            }
        } finally {
            runInAction(() => {
                this.detailLoading = false;
            });
        }
    }

    async saveDraft(courseId: string, assignmentId: string, mode?: RoleMode, teachingGroupId?: string): Promise<DraftResult> {
        const roleMode = this.resolveRoleMode(mode);

        runInAction(() => {
            this.saveDraftLoading = true;
        });

        try {
            if (roleMode === 'teacher') {
                return await this.saveTeacherDraftInternal(courseId, assignmentId, {
                    reloadDetail: true,
                    teachingGroupId,
                });
            }

            if (!assignmentId) {
                return {
                    success: false,
                    message: '缺少 assignment_id，无法保存学生草稿',
                };
            }

            if (this.studentSubmissionStatus !== 0) {
                return {
                    success: false,
                    message: '当前作业非未提交状态，不允许保存草稿',
                };
            }

            const answers = this.buildStudentAnswerPayload();
            const response: any = await saveStudentAssignmentDraft({
                assignment_id: assignmentId,
                answers,
            });

            if (response?.code !== 200) {
                return {
                    success: false,
                    message: response?.msg || '保存草稿失败',
                };
            }

            return {
                success: true,
                assignmentId,
            };
        } catch (_error) {
            return {
                success: false,
                message: '保存草稿失败，请稍后重试',
            };
        } finally {
            runInAction(() => {
                this.saveDraftLoading = false;
            });
        }
    }

    async submitHomework(_courseId: string, assignmentId: string, mode?: RoleMode) {
        const roleMode = this.resolveRoleMode(mode);
        // if (roleMode !== 'student') {
        //     return false;
        // }

        // if (!assignmentId) {
        //     return false;
        // }

        // if (this.submitLoading) {
        //     return false;
        // }

        // if (this.studentSubmissionStatus !== 0) {
        //     return false;
        // }

        runInAction(() => {
            this.submitLoading = true;
        });

        try {
            const answers = this.buildStudentAnswerPayload();
            const response: any = await submitStudentAssignment({
                assignment_id: assignmentId,
                answers,
            });

            if (response?.code !== 200) {
                return false;
            }

            runInAction(() => {
                this.studentSubmissionId = String(response?.data?.submission_id || '');
                this.studentSubmissionStatus = 1;
                this.studentResult = null;
            });
            return true;
        } catch (_error) {
            return false;
        } finally {
            runInAction(() => {
                this.submitLoading = false;
            });
        }
    }

    async publishHomework(courseId: string, assignmentId: string, mode?: RoleMode, teachingGroupId?: string): Promise<PublishResult> {
        const roleMode = this.resolveRoleMode(mode);
        if (roleMode !== 'teacher') {
            return { success: false, message: '仅教师可发布作业' };
        }

        if (this.isTeacherPublished) {
            return { success: false, message: '作业已发布，不可重复发布' };
        }

        const validation = this.validateTeacherPublishWindow();
        if (!validation.valid) {
            return { success: false, message: validation.message || '发布时间校验失败' };
        }

        runInAction(() => {
            this.publishLoading = true;
        });

        try {
            const saveResult = await this.saveTeacherDraftInternal(courseId, assignmentId || this.currentAssignmentId, {
                reloadDetail: true,
                teachingGroupId,
            });
            if (!saveResult.success || !saveResult.assignmentId) {
                return {
                    success: false,
                    message: saveResult.message || '发布前保存草稿失败',
                };
            }

            const targetAssignmentId = saveResult.assignmentId;
            const normalizedTeachingGroupId = normalizeTeachingGroupId(teachingGroupId);
            const publishResponse: any = await publishTeacherAssignment({
                assignment_id: targetAssignmentId,
                ...(normalizedTeachingGroupId ? { teaching_group_id: normalizedTeachingGroupId } : {}),
            });

            if (publishResponse?.code !== 200) {
                return {
                    success: false,
                    message: publishResponse?.msg || '发布失败',
                };
            }

            await this.fetchHomeworkDetail(targetAssignmentId, 'teacher');

            runInAction(() => {
                this.teacherPublishStatus = 'published';
            });

            return {
                success: true,
                assignmentId: targetAssignmentId,
            };
        } catch (_error) {
            return {
                success: false,
                message: '发布失败，请稍后重试',
            };
        } finally {
            runInAction(() => {
                this.publishLoading = false;
            });
        }
    }

    async extendTeacherDeadline(assignmentId: string, startTime: string, endTime: string): Promise<DeadlineResult> {
        this.setTeacherTimeRange(startTime, endTime);

        if (!assignmentId) {
            return {
                success: false,
                message: '当前为未保存草稿，已先本地更新，保存后可同步到服务端',
            };
        }

        const startUnix = toUnixSecondsString(startTime);
        const endUnix = toUnixSecondsString(endTime);

        if (!startUnix || !endUnix) {
            return {
                success: false,
                message: '时间格式不正确',
            };
        }

        try {
            const response: any = await extendTeacherAssignmentDeadline({
                assignment_id: assignmentId,
                start_time: startUnix,
                deadline: endUnix,
            });

            if (response?.code !== 200) {
                return {
                    success: false,
                    message: response?.msg || '作业时间更新失败',
                };
            }

            await this.fetchHomeworkDetail(assignmentId, 'teacher');
            return {
                success: true,
            };
        } catch (_error) {
            return {
                success: false,
                message: '作业时间更新失败，请稍后重试',
            };
        }
    }

    async fetchStudentResult(assignmentId: string) {
        if (!assignmentId) {
            return false;
        }

        runInAction(() => {
            this.resultLoading = true;
        });

        try {
            const response: any = await getStudentAssignmentResult({ assignment_id: assignmentId });
            if (response?.code !== 200 || !response?.data) {
                return false;
            }

            runInAction(() => {
                this.studentResult = response.data as StudentAssignmentResultDto;
                this.studentSubmissionStatus = 2;
            });
            return true;
        } finally {
            runInAction(() => {
                this.resultLoading = false;
            });
        }
    }

    async uploadTeacherQuestionImages(payload: {
        courseId: string;
        frontendQuestionId: string;
        field: ImageField;
        files: File[];
    }): Promise<UploadResult> {
        if (payload.files.length === 0) {
            return { success: false, message: '请选择至少一张图片' };
        }

        const question = this.teacherQuestions.find((item) => item.id === payload.frontendQuestionId);
        if (!question) {
            return { success: false, message: '未找到题目，请刷新后重试' };
        }

        const backendQuestionId = question.backendQuestionId || (question.id.startsWith('tmp_') ? '' : question.id);
        if (!backendQuestionId) {
            return { success: false, message: '请先保存草稿，再上传图片' };
        }

        runInAction(() => {
            this.imageUploading = true;
        });

        try {
            const uploadedUrls: string[] = [];
            const resourceType = payload.field === 'questionImages' ? 1 : 2;

            for (const file of payload.files) {
                const response: any = await uploadTeacherAssignmentQuestionImage({
                    file,
                    question_id: backendQuestionId,
                    course_id: payload.courseId,
                    resource_type: resourceType,
                });

                if (response?.code === 200 && response?.data?.file_url) {
                    uploadedUrls.push(toViewFileUrl(String(response.data.file_url)));
                }
            }

            if (uploadedUrls.length === 0) {
                return {
                    success: false,
                    message: '图片上传失败，请稍后重试',
                };
            }

            this.appendTeacherQuestionImages(payload.frontendQuestionId, payload.field, uploadedUrls);

            return {
                success: true,
                uploaded: uploadedUrls.length,
            };
        } catch (_error) {
            return {
                success: false,
                message: '图片上传失败，请稍后重试',
            };
        } finally {
            runInAction(() => {
                this.imageUploading = false;
            });
        }
    }

    reset() {
        this.list = [];
        this.detail = null;
        this.activeQuestionIndex = 0;
        this.userAnswers = {};

        this.listLoading = false;
        this.detailLoading = false;
        this.saveDraftLoading = false;
        this.submitLoading = false;
        this.publishLoading = false;
        this.resultLoading = false;
        this.imageUploading = false;

        this.currentAssignmentId = '';
        this.studentSubmissionStatus = null;
        this.studentSubmissionId = '';
        this.studentResult = null;
        this.teacherSubmissions = [];

        this.teacherQuestions = [];
        this.teacherPublishStatus = 'draft';
        this.teacherPublishAt = '';
        this.teacherStartTime = '';
        this.teacherEndTime = '';
    }
}
