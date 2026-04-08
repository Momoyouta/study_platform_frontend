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

export type ActorType = 1 | 2;

export type AuthSchoolOption = {
    school_id: string;
    school_name: string;
    actor_type: ActorType;
    actor_id: string;
};

export type PendingAuthResponseData = {
    pendingToken: string;
    schools: AuthSchoolOption[];
};

export type SelectSchoolRequest = {
    schoolId?: string;
    school_id?: string;
    actorType?: ActorType;
    actor_type?: ActorType;
};

export type JoinSchoolRequest = {
    code: string;
};

export type JoinSchoolResponse = {
    school_id: string;
    actor_type: ActorType;
    actor_id: string;
    joined: boolean;
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

export type StatisticsQueryParams = {
    courseId?: string;
    teachingGroupId?: string;
    assignmentId?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
};

export type TeacherTodoDto = {
    pendingReviewCount: number;
};

export type LessonFunnelItemDto = {
    lessonId: string;
    lessonName: string;
    avgProgressPercent: number;
    learnCount: number;
};

export type ScoreBucketDto = {
    key: string;
    label: string;
    count: number;
};

export type ScoreDistributionDto = {
    avgScore: number;
    maxScore: number;
    minScore: number;
    buckets: ScoreBucketDto[];
};

export type QuestionAccuracyItemDto = {
    questionId: string;
    questionNo: number;
    correctRate: number;
};

export type QuestionScoreRateItemDto = {
    questionId: string;
    questionNo: number;
    scoreRate: number;
};

export type PagedQuestionAccuracyDto = {
    page: number;
    pageSize: number;
    total: number;
    list: QuestionAccuracyItemDto[];
};

export type PagedQuestionScoreRateDto = {
    page: number;
    pageSize: number;
    total: number;
    list: QuestionScoreRateItemDto[];
};

export type SubmissionStatusStudentDto = {
    studentId: string;
    studentName: string;
};

export type SubmissionStatusDto = {
    unsubmitted: SubmissionStatusStudentDto[];
    submittedPendingReview: SubmissionStatusStudentDto[];
    reviewed: SubmissionStatusStudentDto[];
};

export type StudentCourseProgressItemDto = {
    courseId: string;
    courseName: string;
    progressPercent: number;
};

export type ContinueLearningDto = {
    lessonId: string;
    lessonName: string;
    courseId: string;
    courseName: string;
    lastLearnTime: string;
};

export type TodoAssignmentItemDto = {
    assignmentId: string;
    title: string;
    courseId: string;
    courseName: string;
    deadline?: string;
    remainSeconds: number;
};

export type GradeHistoryItemDto = {
    assignmentId: string;
    title: string;
    totalScore: number;
    teacherComment?: string;
};

export type GroupLearningSummaryDto = {
    courseId: string;
    teachingGroupId: string;
    assignmentAvgScore: number;
    avgScoreRank: number;
    courseLearnCount: number;
};

export type TeacherCourseGroupProgressSortBy = 'progressPercent' | 'studentName';
export type TeacherCourseGroupProgressSortOrder = 'ASC' | 'DESC';

export type TeacherCourseGroupProgressQueryParams = StatisticsQueryParams & {
    courseId: string;
    teachingGroupId: string;
    page?: number;
    pageSize?: number;
    sortBy?: TeacherCourseGroupProgressSortBy;
    sortOrder?: TeacherCourseGroupProgressSortOrder;
    completedOnly?: 0 | 1;
};

export type TeacherCourseGroupProgressItemDto = {
    studentId: string;
    studentName: string;
    avatarPath: string;
    progressPercent: number;
};

export type TeacherCourseGroupProgressDto = {
    page: number;
    pageSize: number;
    total: number;
    totalStudents: number;
    completedStudents: number;
    list: TeacherCourseGroupProgressItemDto[];
};
