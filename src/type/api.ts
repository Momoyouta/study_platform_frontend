export type UpdateBasicPayload = {
    sex: boolean;
};

export type UpdatePhonePayload = {
    newPhone: string;
    code?: string;
};

export type UpdateAvatarPayload = {
    tempAvatarPath: string;
};

export type UpdatePasswordPayload = {
    oldPassword: string;
    newPassword: string;
};

export type AssignmentQuestionTypeCode = 1 | 2 | 3 | 4 | 5;

export type TeacherAssignmentQuestionPayload = {
    question_id?: string;
    type: AssignmentQuestionTypeCode;
    score: number;
    content: Record<string, any>;
    standard_answer: Record<string, any>;
    sort_order: number;
    analysis?: Record<string, any>;
};

export type TeacherAssignmentSaveRequest = {
    assignment_id?: string;
    course_id: string;
    teaching_group_id?: string;
    title: string;
    description?: string;
    start_time: string;
    deadline: string;
    questions: TeacherAssignmentQuestionPayload[];
};

export type TeacherAssignmentUpdateRequest = {
    assignment_id: string;
    title: string;
};

export type TeacherAssignmentListItemDto = {
    id: string;
    title: string;
    status: number;
    start_time: string;
    deadline: string;
    question_count: number;
};

export type TeacherAssignmentDetailDto = {
    id: string;
    course_id: string;
    title: string;
    status: number;
    start_time: string;
    deadline: string;
    questions: Array<Record<string, any>>;
};

export type TeacherAssignmentStatisticsDto = {
    total_students: number;
    submitted_count: number;
    graded_count: number;
    questions: Array<{
        question_id: string;
        type: number;
        correct_rate: number | null;
        score_rate: number;
    }>;
};

export type StudentAssignmentListItemDto = {
    id: string;
    title: string;
    start_time: string;
    deadline: string;
    submission_status: number | null;
};

export type StudentAssignmentDetailQuestionDto = {
    id: string;
    type: number;
    score: number;
    content: Record<string, any>;
    sort_order: number;
    student_answer: Record<string, any> | null;
};

export type StudentAssignmentDetailDto = {
    assignment_id: string;
    title: string;
    start_time: string;
    deadline: string;
    status: 0 | 1 | 2;
    questions: StudentAssignmentDetailQuestionDto[];
};

export type StudentAssignmentAnswerPayload = {
    question_id: string;
    student_answer: Record<string, any>;
};

export type StudentAssignmentResultDto = {
    total_score: string;
    teacher_comment?: string;
    details: Array<{
        question_id: string;
        score_earned: string;
        is_correct: number | null;
        teacher_comment?: string;
        standard_answer: Record<string, any>;
        analysis: Record<string, any>;
    }>;
};

export enum ChunkUploadType {
    VIDEO = 1,
    NORMAL = 2,
}
