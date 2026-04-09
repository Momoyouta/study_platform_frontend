export type Role = {
    id: string;
    nameEN: string;
    nameCN: string;
    level: number;
};

export type ActorType = 1 | 2;

export type AuthSchoolOptionDto = {
    school_id: string;
    school_name: string;
    actor_type: ActorType;
    actor_id: string;
};

export type AuthSchoolOptionWireDto = AuthSchoolOptionDto | {
    schoolId: string;
    schoolName: string;
    actorType: ActorType;
    actorId: string;
};

export type PendingBaseUserInfoDto = {
    userId: string;
    userRoles?: string[];
    userName?: string;
    collegeId?: string;
    collegeName?: string;
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
    college_id?: string;
    college_name?: string;
    collegeId?: string;
    collegeName?: string;
};

export type CurrentTeacherInfoDto = {
    teacher_id?: string;
    teacher_number?: string;
    college?: string;
    user_id?: string;
    school_id?: string;
    school_name?: string;
    college_id?: string;
    college_name?: string;
    collegeName?: string;
};

export type CurrentStudentInfoDto = {
    student_id?: string;
    student_number?: string;
    class_id?: string;
    college?: string;
    user_id?: string;
    school_id?: string;
    school_name?: string;
    college_id?: string;
    college_name?: string;
    collegeName?: string;
    grade?: string;
};

export type CurrentRoleInfoDto = {
    teacherInfo?: CurrentTeacherInfoDto | null;
    studentInfo?: CurrentStudentInfoDto | null;
};

export type CurrentUserProfile = {
    user: CurrentUserInfoDto;
    roles: Role[];
    roleInfo?: CurrentRoleInfoDto | null;
    teacherInfo?: CurrentTeacherInfoDto | null;
    studentInfo?: CurrentStudentInfoDto | null;
    school_name: string;
    college_id?: string;
    college_name?: string;
    collegeId?: string;
    collegeName?: string;
};

export type BusinessUserProfile = {
    id: string;
    name: string;
    account: string;
    role_id: string;
    current_school_id: string;
    actor_type: ActorType;
    actor_id: string;
    school_name?: string;
};

export type AuthUserProfile = CurrentUserProfile | BusinessUserProfile;

export type UserPendingAuthResponseDto = {
    pendingToken?: string;
    token?: string;
    schools?: AuthSchoolOptionWireDto[];
    selectableSchools?: AuthSchoolOptionWireDto[];
    baseUserInfo?: PendingBaseUserInfoDto;
};

export type UserSelectSchoolRequestDto = {
    schoolId?: string;
    school_id?: string;
    actorType?: ActorType;
    actor_type?: ActorType;
};

export type UserSelectSchoolResponseDto = {
    token: string;
    userProfile: AuthUserProfile;
};

export type UserLoginResponseDto = {
    pendingToken?: string;
    token?: string;
    schools?: AuthSchoolOptionWireDto[];
    selectableSchools?: AuthSchoolOptionWireDto[];
    baseUserInfo?: PendingBaseUserInfoDto;
};

export type UserRegisterResponseDto = {
    pendingToken?: string;
    token?: string;
    schools?: AuthSchoolOptionWireDto[];
    selectableSchools?: AuthSchoolOptionWireDto[];
    baseUserInfo?: PendingBaseUserInfoDto;
};

export type UserJwtAuthResponseDto = {
    valid: boolean;
    userProfile: CurrentUserProfile;
};