import type { Question } from '@/store/homework';
import { toViewFileUrl } from '@/utils/fileUrl';

export const SUBJECTIVE_TYPE_TO_KEY: Record<number, Question['type']> = {
    4: 'fill',
    5: 'short',
};

export const toObject = (value: any): Record<string, any> => {
    if (!value) {
        return {};
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
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
    }

    return {};
};

export const toText = (value: any) => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    const payload = toObject(value);
    const candidate = payload.user_answer
        ?? payload.userAnswer
        ?? payload.answer
        ?? payload.text
        ?? payload.value
        ?? payload.content
        ?? payload.markdown
        ?? payload.md;

    if (typeof candidate === 'string') {
        return candidate;
    }

    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
        return String(candidate);
    }

    return '';
};

export const normalizeImageList = (value: any) => {
    if (!Array.isArray(value)) {
        return [] as string[];
    }

    return value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .map((item) => toViewFileUrl(item));
};

export const findStudentResultDetailByQuestion = (
    details: Array<Record<string, any>>,
    question?: Question,
) => {
    if (!question || details.length === 0) {
        return null;
    }

    const questionId = String(question.id || '').trim();
    const backendQuestionId = String(question.backendQuestionId || '').trim();

    return details.find((item) => {
        const detailQuestionId = String(item?.question_id || '').trim();
        if (!detailQuestionId) {
            return false;
        }

        return detailQuestionId === backendQuestionId || detailQuestionId === questionId;
    }) || null;
};

export const buildSubjectiveReviewData = (rawQuestions: Array<Record<string, any>>) => {
    const questions: Question[] = [];
    const answers: Record<string, any> = {};
    const scores: Record<string, number> = {};
    const comments: Record<string, string> = {};

    rawQuestions.forEach((item, index) => {
        const typeCode = Number(item?.type || 0);
        const questionType = SUBJECTIVE_TYPE_TO_KEY[typeCode];
        if (!questionType) {
            return;
        }

        const questionId = String(item?.question_id || item?.id || '').trim();
        if (!questionId) {
            return;
        }

        const rawContent = item?.content;
        const content = toObject(rawContent);
        const analysis = toObject(item?.analysis);

        const stem = String(
            content.stem
            ?? content.title
            ?? (typeof rawContent === 'string' ? rawContent : '')
            ?? item?.stem
            ?? item?.title
            ?? '',
        ).trim();

        const questionImages = normalizeImageList(
            content.images
            ?? content.question_images
            ?? item?.images
            ?? item?.question_images,
        );

        const analysisText = toText(
            analysis.text
            ?? analysis.answer
            ?? analysis.content
            ?? item?.analysis,
        );

        const analysisImages = normalizeImageList(
            analysis.images
            ?? analysis.analysis_images
            ?? item?.analysis_images,
        );

        const score = Number(item?.score || 0);

        questions.push({
            id: questionId,
            backendQuestionId: questionId,
            type: questionType,
            title: stem,
            score: Number.isNaN(score) ? 0 : score,
            referenceAnswer: toText(item?.standard_answer),
            questionImages,
            analysis: analysisText,
            analysisImages,
            sortOrder: index + 1,
        });

        answers[questionId] = toText(item?.student_answer);

        const earnedScore = item?.earned_score;
        if (earnedScore !== null && earnedScore !== undefined && earnedScore !== '') {
            const numericScore = Number(earnedScore);
            if (!Number.isNaN(numericScore)) {
                scores[questionId] = numericScore;
            }
        }

        const teacherComment = String(item?.teacher_comment || '').trim();
        if (teacherComment) {
            comments[questionId] = teacherComment;
        }
    });

    return { questions, answers, scores, comments };
};
