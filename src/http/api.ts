import http from "./http.js";

type UpdateBasicPayload = {
    sex: boolean;
};

type UpdatePhonePayload = {
    newPhone: string;
    code?: string;
};

type UpdateAvatarPayload = {
    tempAvatarPath: string;
};

type UpdatePasswordPayload = {
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

export const login = (account: string, pwd: string) => {
    return http.post('/auth/login', {
        account,
        pwd
    });
}

export const register = (data: any) => {
    return http.post('/auth/register', data);
}

export const jwtAuth = (accessToken: string) => {
    return http.post('/auth/jwtAuth', {
        accessToken
    });
}

export const getUserProfile = (id: string) => {
    return http.get(`/user/profile/${id}`);
}

export const applySchool = (data: any) => {
    return http.post('/school/applySchool', data);
}

export const uploadImageTemp = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return http.post('/file/upload/imageTemp', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

export const updateBasic = (data: UpdateBasicPayload) => {
    return http.put('/user/profile/updateBasic', data);
}

export const updatePhone = (data: UpdatePhonePayload) => {
    return http.put('/user/profile/updatePhone', data);
}

export const updateAvatar = (data: UpdateAvatarPayload) => {
    return http.put('/user/profile/updateAvatar', data);
}

export const updatePassword = (data: UpdatePasswordPayload) => {
    return http.put('/user/profile/updatePassword', data);
}

export const listTeacherCoursesUser = (params: { page: number, pageSize: number, teacher_id: string, school_id?: string, keyword?: string }) => {
    return http.get('/course/listTeacherCoursesUser', { params });
}

export const listStudentCoursesUser = (params: { page: number, pageSize: number, student_id: string, school_id?: string, keyword?: string }) => {
    return http.get('/course/listStudentCoursesUser', { params });
}

export const joinCourseByInviteCode = (data: { code: string }) => {
    return http.post('/student/joinCourseByInviteCode', data);
}

export const leaveCourseStudent = (courseId: string) => {
    return http.post('/student/leaveCourse', { courseId });
}

export const getCourseLessonOutline = (id: string, source?: 'draft' | 'published') => {
    return http.get(`/course/getCourseLessonOutline/${id}`, { params: { source } });
}

// ===== 分片上传 =====

export const initChunkUpload = (data: {
    fileHash: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
}) => {
    return http.post('/file/upload/initChunk', data);
}

export const uploadChunk = (formData: FormData) => {
    return http.post('/file/upload/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export const mergeChunks = (data: {
    uploadId: string;
    fileHash: string;
    fileName: string;
    scenario: string;
    [key: string]: any;
}) => {
    return http.post('/file/upload/merge', data);
}

export enum ChunkUploadType {
    VIDEO = 1,
    NORMAL = 2,
}

// ===== 分片上传 (用户端/带权限校验) =====

export const initChunkUploadUser = (data: {
    fileHash: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    courseId: string;
    schoolId?: string | number;
    type: ChunkUploadType;
}) => {
    return http.post('/file/chunk/user/init', data);
}

export const uploadChunkUser = (formData: FormData) => {
    return http.post('/file/chunk/user/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export const getChunkProgressUser = (fileHash: string) => {
    return http.get(`/file/chunk/user/progress/${fileHash}`);
}

export const mergeChunksUser = (data: {
    uploadId: string;
    fileHash: string;
    fileName: string;
    scenario: string;
    courseId: string;
    schoolId?: string;
    homeworkId?: string;
}) => {
    return http.post('/file/chunk/user/merge', data);
}


// ===== 课程大纲（教师端） =====

export const saveCourseDraft = (data: { course_id: string; draft_content: any }) => {
    return http.post('/course/saveCourseDraft', data);
}

export const publishCourseOutline = (data: { course_id: string; draft_content: any }) => {
    return http.post('/course/publishCourseOutline', data);
}

export const updateChapterTitleQuick = (data: {
    course_id: string;
    draft_content: any;
    chapter: { chapter_id: string; title: string };
}) => {
    return http.put('/course/updateChapterTitleQuick', data);
}

export const updateLessonQuick = (data: {
    course_id: string;
    draft_content: any;
    lesson: {
        lesson_id: string;
        chapter_id: string;
        title: string;
        description?: string;
        video_path?: string | null;
        duration?: number;
        sort_order?: number;
    };
}) => {
    return http.put('/course/updateLessonQuick', data);
}

// ===== 课程任务描述（教师端） =====

export const getCourseDescription = (id: string) => {
    return http.get(`/course/getCourseDescription/${id}`);
}

export const updateCourseDescription = (data: { id: string; description: string }) => {
    return http.put('/course/updateCourse', data);
}

export const updateCourseBasicInfo = (data: { id: string; name: string; status: number; cover_img?: string }) => {
    return http.put('/course/updateCourse', data);
}

// ===== 教学组管理（教师端） =====

export const getCourseBaseInfo = (id: string, teacher_id: string) => {
    return http.get(`/course/getCourseBaseInfo/${id}`, { params: { teacher_id } });
}

export const listTeachingGroup = (params: {
    course_id: string;
    page?: number;
    pageSize?: number;
    name?: string;
}) => {
    return http.get('/teacher/listTeachingGroup', { params });
}

export const getTeachingGroup = (id: string) => {
    return http.get(`/teacher/getTeachingGroup/${id}`);
}

export const createTeachingGroup = (data: { course_id: string; name: string }) => {
    return http.post('/teacher/createTeachingGroup', data);
}

export const updateTeachingGroup = (data: { teaching_group_id: string; name: string }) => {
    return http.put('/teacher/updateTeachingGroup', data);
}

export const deleteTeachingGroup = (id: string) => {
    return http.delete(`/teacher/deleteTeachingGroup/${id}`);
}

export const bindTeachingGroupTeachers = (data: {
    course_id: string;
    teaching_group_id: string;
    teacher_ids: string[];
}) => {
    return http.put('/teacher/bindTeachingGroupTeachers', data);
}

export const createCourseInvite = (data: {
    course_id: string;
    teaching_group_id: string;
    school_id?: string;
    ttl?: number;
}) => {
    return http.post('/course/createInvite', data);
}

export const querySchoolTeacherByName = (params: {
    school_id: string;
    name: string;
    page?: number;
    pageSize?: number;
}) => {
    return http.get('/teacher/querySchoolTeacherByName', { params });
}

export const getMyTeachingGroupsInCourse = (courseId: string) => {
    return http.get('/teacher/myGroups', { params: { course_id: courseId } });
}

export const listMyCreatedCourses = (params: { page: number, pageSize: number, keyword?: string, school_id?: string }) => {
    return http.get('/teacher/myCreatedCourses', { params });
}

export const createCourse = (data: { name: string }) => {
    return http.post('/teacher/createCourse', data);
}

export const syncProgress = (data: {
    courseId: string;
    chapterId: string;
    lessonId: string;
    progress_percent: number;
    schoolId?: string;
}) => {
    return http.post('/course/sync-progress', data);
}

export const getLearningProgress = (data: {
    schoolId: string;
    courseId: string;
}) => {
    return http.post('/course/getLearningProgress', data);
}

// ===== 教师端作业概览 =====

export const getTeacherAssignmentOverview = (data: { assignment_id: string }) => {
    return http.post('/teacher/assignment/overview', data);
}

// ===== 作业管理（教师端） =====

export const saveTeacherAssignment = (data: TeacherAssignmentSaveRequest) => {
    return http.post('/teacher/assignment/save', data);
}

export const updateTeacherAssignment = (data: TeacherAssignmentUpdateRequest) => {
    return http.post('/teacher/assignment/update', data);
}

export const publishTeacherAssignment = (data: { assignment_id: string }) => {
    return http.post('/teacher/assignment/publish', data);
}

export const extendTeacherAssignmentDeadline = (data: {
    assignment_id: string;
    start_time: string;
    deadline: string;
}) => {
    return http.post('/teacher/assignment/deadline/extend', data);
}

export const listTeacherAssignments = (data: {
    course_id: string;
    teaching_group_id?: string;
}) => {
    return http.post('/teacher/assignment/list', data);
}

export const getTeacherAssignmentDetail = (data: { assignment_id: string }) => {
    return http.post('/teacher/assignment/detail', data);
}

export const getTeacherAssignmentStatistics = (data: {
    assignment_id: string;
    teaching_group_id?: string;
}) => {
    return http.post('/teacher/assignment/statistics', data);
}

export const listTeacherAssignmentSubmissions = (data: {
    assignment_id: string;
    teaching_group_id?: string;
}) => {
    return http.post('/teacher/assignment/submissions', data);
}

export const gradeTeacherAssignmentSubmission = (data: {
    submission_id: string;
    question_id: string;
    score: number;
    teacher_comment?: string;
    overall_comment?: string;
}) => {
    return http.post('/teacher/assignment/grade', data);
}

export const uploadTeacherAssignmentQuestionImage = (data: {
    file: File;
    question_id: string;
    course_id: string;
    resource_type: 1 | 2;
}) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('question_id', data.question_id);
    formData.append('course_id', data.course_id);
    formData.append('resource_type', String(data.resource_type));

    return http.post('/teacher/assignment/question/image/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// ===== 作业管理（学生端） =====

export const listStudentAssignments = (data: { course_id: string }) => {
    return http.post('/student/assignment/list', data);
}

export const getStudentAssignmentDetail = (data: { assignment_id: string }) => {
    return http.post('/student/assignment/detail', data);
}

export const saveStudentAssignmentDraft = (data: {
    assignment_id: string;
    answers: StudentAssignmentAnswerPayload[];
}) => {
    return http.post('/student/assignment/draft/save', data);
}

export const submitStudentAssignment = (data: {
    assignment_id: string;
    answers: StudentAssignmentAnswerPayload[];
}) => {
    return http.post('/student/assignment/submit', data);
}

export const getStudentAssignmentResult = (data: { assignment_id: string }) => {
    return http.post('/student/assignment/result', data);
}

export const uploadStudentAssignmentAnswerImage = (data: {
    file: File;
    assignment_id: string;
    question_id: string;
}) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('assignment_id', data.assignment_id);
    formData.append('question_id', data.question_id);

    return http.post('/student/assignment/answer/image/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// ===== 课程资料管理 =====

export const listCourseMaterials = (params: {
    course_id: string;
    file_name?: string;
    page?: number;
    pageSize?: number;
}) => {
    return http.get('/course/material/list', { params });
}

export const bindCourseMaterial = (data: {
    course_id: string;
    file_id: string;
}) => {
    return http.post('/course/material/bind', data);
}

export const updateCourseMaterial = (data: {
    material_id: string;
    file_name: string;
}) => {
    return http.post('/course/material/update', data);
}

export const deleteCourseMaterial = (data: {
    material_id: string;
    mode: number; // 1: 仅解绑, 2: 彻底删除
}) => {
    return http.post('/course/material/delete', data);
}

// ===== 文件管理 =====

export const queryFiles = (params: {
    page?: number;
    pageSize?: number;
    filename?: string;
    schoolId: string | number;
}) => {
    return http.get('/file/query', { params });
}
