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
