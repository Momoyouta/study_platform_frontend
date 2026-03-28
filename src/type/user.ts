export type Role = {
    id: string;
    nameEN: string;
    nameCN: string;
    level: number;
};

export type CurrentUserInfoDto = {
    id: string;
    name: string;
    role_id: string;
    sex: boolean;
    account: string;
    phone?: string;
    avatar: string;
    create_time?: string;
    update_time?: string;
    status?: number;
};

export type CurrentTeacherInfoDto = {
    teacher_number?: string;
    college?: string;
    user_id: string;
    school_id?: string;
    school_name?: string;
};

export type CurrentStudentInfoDto = {
    student_number?: string;
    class_id?: string;
    college?: string;
    user_id: string;
    school_id?: string;
    school_name?: string;
};

export type CurrentUserProfile = {
    user: CurrentUserInfoDto;
    roles: Role[];
    teacherInfo?: CurrentTeacherInfoDto | null;
    studentInfo?: CurrentStudentInfoDto | null;
    school_name: string;
};

export type UserLoginResponseDto = {
    token: string;
    userProfile: CurrentUserProfile;
};

export type UserRegisterResponseDto = {
    token: string;
    userProfile: CurrentUserProfile;
};

export type UserJwtAuthResponseDto = {
    valid: boolean;
    userProfile: CurrentUserProfile;
};