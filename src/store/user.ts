import { makeAutoObservable } from "mobx";
import { ROLE_MAP } from "@/type/map.js";
import {
    ActorType,
    AuthSchoolOptionDto,
    AuthUserProfile,
    BusinessUserProfile,
    CurrentUserInfoDto,
    CurrentUserProfile,
    Role,
    UserSelectSchoolRequestDto,
} from "@/type/user";

type RootStoreLike = {
    StudentStore: {
        setFromDto: (dto: any) => void;
        clearProfile: () => void;
    };
    TeacherStore: {
        setFromDto: (dto: any) => void;
        clearProfile: () => void;
    };
};

type ApiEnvelope<T> = {
    code?: string | number;
    msg?: string;
    data?: T;
};

type AuthSchoolOptionLike = AuthSchoolOptionDto | {
    schoolId?: string;
    schoolName?: string;
    actorType?: number;
    actorId?: string;
};

type AuthPayload = {
    pendingToken?: string;
    schools?: AuthSchoolOptionLike[];
    selectableSchools?: AuthSchoolOptionLike[];
    token?: string;
    valid?: boolean;
    userProfile?: AuthUserProfile;
};

type StoredActorContext = {
    actorType: ActorType | null;
    actorId: string;
};

type ApplyAuthOptions = {
    keepToken?: boolean;
    schoolNameHint?: string;
};

const BUSINESS_TOKEN_STORAGE_KEY = 'access_token';
const PENDING_TOKEN_STORAGE_KEY = 'pending_token';
const ROLE_STORAGE_KEY = 'user_role';
const USER_INFO_STORAGE_KEY = 'user_info';
const USER_ROLES_STORAGE_KEY = 'user_roles';
const SCHOOL_NAME_STORAGE_KEY = 'school_name';
const SCHOOL_ID_STORAGE_KEY = 'school_id';
const SCHOOL_OPTIONS_STORAGE_KEY = 'school_options';
const ACTOR_CONTEXT_STORAGE_KEY = 'actor_context';
const LEGACY_USER_INFO_STORAGE_KEY = 'user_base_info';

export class User {
    private rootStore: RootStoreLike;

    userId: string = '';
    userName: string = '';
    roleId: string = '';
    sex: boolean | null = null;
    account: string = '';
    phone: string = '';
    avatar: string = '';
    createTime: string = '';
    updateTime: string = '';
    status: number | null = null;
    roles: Role[] = [];
    schoolName: string = '';
    schoolId: string = '';

    role: string | null = localStorage.getItem(ROLE_STORAGE_KEY);
    token: string | null = localStorage.getItem(BUSINESS_TOKEN_STORAGE_KEY);
    pendingToken: string | null = localStorage.getItem(PENDING_TOKEN_STORAGE_KEY);

    // actorId 仅在 UserStore 内部使用，不对业务模块透出。
    actorType: ActorType | null = null;
    actorId: string = '';
    availableSchools: AuthSchoolOptionDto[] = [];

    constructor(rootStore: RootStoreLike) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
        this.hydrateFromStorage();
    }

    get displayName() {
        return this.userName || 'userName';
    }

    get hasBusinessSession() {
        return !!this.token && !!this.schoolId;
    }

    get hasPendingSession() {
        return !!this.pendingToken;
    }

    get isSchoolSelectionRequired() {
        return !!this.pendingToken && !this.hasBusinessSession;
    }

    private hydrateFromStorage() {
        this.removeLegacyStorage();

        const userStorage = this.parseStorage<any>(USER_INFO_STORAGE_KEY);
        this.userId = userStorage?.userId || userStorage?.id || '';
        this.userName = userStorage?.userName || userStorage?.name || '';
        this.roleId = userStorage?.roleId || userStorage?.role_id || '';
        this.sex = typeof userStorage?.sex === 'boolean' ? userStorage.sex : null;
        this.account = userStorage?.account || '';
        this.phone = userStorage?.phone || '';
        this.avatar = userStorage?.avatar || '';
        this.createTime = userStorage?.createTime || userStorage?.create_time || '';
        this.updateTime = userStorage?.updateTime || userStorage?.update_time || '';
        this.status = typeof userStorage?.status === 'number' ? userStorage.status : null;
        this.roles = this.parseStorage<Role[]>(USER_ROLES_STORAGE_KEY) || [];
        this.schoolName = localStorage.getItem(SCHOOL_NAME_STORAGE_KEY) || '';
        this.schoolId = localStorage.getItem(SCHOOL_ID_STORAGE_KEY) || '';
        this.availableSchools = this.parseStorage<AuthSchoolOptionDto[]>(SCHOOL_OPTIONS_STORAGE_KEY) || [];

        const actorContext = this.parseStorage<StoredActorContext>(ACTOR_CONTEXT_STORAGE_KEY);
        this.actorType = actorContext?.actorType === 1 || actorContext?.actorType === 2 ? actorContext.actorType : null;
        this.actorId = actorContext?.actorId || '';
    }

    private parseStorage<T>(storageKey: string): T | null {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as T;
        } catch (_error) {
            localStorage.removeItem(storageKey);
            return null;
        }
    }

    private removeLegacyStorage() {
        localStorage.removeItem(LEGACY_USER_INFO_STORAGE_KEY);
    }

    private resolvePrimaryRole(profile: CurrentUserProfile) {
        const fromRoles = profile.roles?.find((roleItem) => {
            return roleItem?.id === ROLE_MAP.STUDENT || roleItem?.id === ROLE_MAP.TEACHER;
        })?.id;

        if (fromRoles) {
            return fromRoles;
        }

        const roleCandidates = profile.user?.role_id?.split(',').map((item) => item.trim()) || [];
        return roleCandidates.find((item) => item === ROLE_MAP.STUDENT || item === ROLE_MAP.TEACHER) || null;
    }

    private resolveRoleProfiles(profile: CurrentUserProfile) {
        return {
            studentInfo: profile.roleInfo?.studentInfo ?? profile.studentInfo ?? null,
            teacherInfo: profile.roleInfo?.teacherInfo ?? profile.teacherInfo ?? null,
        };
    }

    private resolveRoleFromActorType(actorType: ActorType | null | undefined) {
        if (actorType === 1) {
            return ROLE_MAP.TEACHER;
        }
        if (actorType === 2) {
            return ROLE_MAP.STUDENT;
        }
        return null;
    }

    private resolveActorTypeFromRole(role: string | null | undefined): ActorType | null {
        if (role === ROLE_MAP.TEACHER) {
            return 1;
        }
        if (role === ROLE_MAP.STUDENT) {
            return 2;
        }
        return null;
    }

    private normalizeSchoolOption(rawSchool: AuthSchoolOptionLike | null | undefined): AuthSchoolOptionDto | null {
        if (!rawSchool) {
            return null;
        }

        const schoolId = (rawSchool as any).school_id || (rawSchool as any).schoolId || '';
        const schoolName = (rawSchool as any).school_name || (rawSchool as any).schoolName || '';
        const actorId = (rawSchool as any).actor_id || (rawSchool as any).actorId || '';
        const actorTypeRaw = (rawSchool as any).actor_type ?? (rawSchool as any).actorType;
        const actorTypeNum = Number(actorTypeRaw);

        if (!schoolId || !schoolName || !actorId || (actorTypeNum !== 1 && actorTypeNum !== 2)) {
            return null;
        }

        return {
            school_id: String(schoolId),
            school_name: String(schoolName),
            actor_type: actorTypeNum as ActorType,
            actor_id: String(actorId),
        };
    }

    private extractAuthPayload(response: ApiEnvelope<AuthPayload> | AuthPayload | undefined | null) {
        const payload = ((response as ApiEnvelope<AuthPayload>)?.data ?? response ?? {}) as AuthPayload;

        const hasPendingSchoolsField = Object.prototype.hasOwnProperty.call(payload, 'schools')
            || Object.prototype.hasOwnProperty.call(payload, 'selectableSchools');
        const pendingToken = payload.pendingToken || (hasPendingSchoolsField ? payload.token : undefined);
        const rawSchools = payload.schools || payload.selectableSchools || [];
        const schools = rawSchools
            .map((item) => this.normalizeSchoolOption(item))
            .filter((item): item is AuthSchoolOptionDto => !!item);

        return {
            pendingToken,
            schools,
            token: payload.token,
            valid: payload.valid,
            userProfile: payload.userProfile,
        };
    }

    private isBusinessProfile(profile: AuthUserProfile): profile is BusinessUserProfile {
        return !('user' in (profile as any));
    }

    private dedupeSchools(schools: AuthSchoolOptionDto[]) {
        const map = new Map<string, AuthSchoolOptionDto>();
        (schools || []).forEach((school) => {
            const key = `${school.school_id}_${school.actor_type}_${school.actor_id}`;
            if (!map.has(key)) {
                map.set(key, school);
            }
        });
        return Array.from(map.values());
    }

    private resolveSchoolNameById(schoolId: string, actorType?: ActorType | null) {
        const exact = this.availableSchools.find((item) => {
            if (actorType) {
                return item.school_id === schoolId && item.actor_type === actorType;
            }
            return item.school_id === schoolId;
        });

        return exact?.school_name || '';
    }

    private setActorContext(actorType: ActorType | null, actorId: string) {
        this.actorType = actorType;
        this.actorId = actorId || '';
        localStorage.setItem(ACTOR_CONTEXT_STORAGE_KEY, JSON.stringify({
            actorType: this.actorType,
            actorId: this.actorId,
        }));
    }

    private clearActorContext() {
        this.actorType = null;
        this.actorId = '';
        localStorage.removeItem(ACTOR_CONTEXT_STORAGE_KEY);
    }

    private clearUserFields() {
        this.userId = '';
        this.userName = '';
        this.roleId = '';
        this.sex = null;
        this.account = '';
        this.phone = '';
        this.avatar = '';
        this.createTime = '';
        this.updateTime = '';
        this.status = null;
    }

    private clearBusinessSession() {
        this.token = null;
        this.clearUserFields();
        this.roles = [];
        this.schoolName = '';
        this.schoolId = '';
        this.role = null;
        this.clearActorContext();

        localStorage.removeItem(BUSINESS_TOKEN_STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem(USER_INFO_STORAGE_KEY);
        localStorage.removeItem(USER_ROLES_STORAGE_KEY);
        localStorage.removeItem(SCHOOL_NAME_STORAGE_KEY);
        localStorage.removeItem(SCHOOL_ID_STORAGE_KEY);
        localStorage.removeItem(LEGACY_USER_INFO_STORAGE_KEY);

        this.rootStore.StudentStore.clearProfile();
        this.rootStore.TeacherStore.clearProfile();
    }

    setUserFromDto(dto: CurrentUserInfoDto | null) {
        if (!dto) {
            this.clearUserFields();
            localStorage.removeItem(USER_INFO_STORAGE_KEY);
            return;
        }

        this.userId = dto.id || '';
        this.userName = dto.name || '';
        this.roleId = dto.role_id || '';
        this.sex = dto.sex;
        this.account = dto.account || '';
        this.phone = dto.phone || '';
        this.avatar = dto.avatar || '';
        this.createTime = dto.create_time || '';
        this.updateTime = dto.update_time || '';
        this.status = dto.status ?? null;

        localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify({
            userId: this.userId,
            userName: this.userName,
            roleId: this.roleId,
            sex: this.sex,
            account: this.account,
            phone: this.phone,
            avatar: this.avatar,
            createTime: this.createTime,
            updateTime: this.updateTime,
            status: this.status,
        }));
    }

    setRoles(roles: Role[]) {
        this.roles = roles;
        localStorage.setItem(USER_ROLES_STORAGE_KEY, JSON.stringify(roles || []));
    }

    setSchoolName(schoolName: string) {
        this.schoolName = schoolName || '';
        localStorage.setItem(SCHOOL_NAME_STORAGE_KEY, this.schoolName);
    }

    setSchoolId(schoolId: string) {
        this.schoolId = schoolId || '';
        localStorage.setItem(SCHOOL_ID_STORAGE_KEY, this.schoolId);
    }

    setRole(role: string | null) {
        this.role = role;
        if (role) {
            localStorage.setItem(ROLE_STORAGE_KEY, role);
            return;
        }
        localStorage.removeItem(ROLE_STORAGE_KEY);
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem(BUSINESS_TOKEN_STORAGE_KEY, token);
    }

    setPendingToken(pendingToken: string | null) {
        this.pendingToken = pendingToken;
        if (pendingToken) {
            localStorage.setItem(PENDING_TOKEN_STORAGE_KEY, pendingToken);
            return;
        }
        localStorage.removeItem(PENDING_TOKEN_STORAGE_KEY);
    }

    setAvailableSchools(schools: AuthSchoolOptionDto[]) {
        this.availableSchools = this.dedupeSchools(schools || []);
        localStorage.setItem(SCHOOL_OPTIONS_STORAGE_KEY, JSON.stringify(this.availableSchools));
    }

    setPendingSession(pendingToken: string, schools: AuthSchoolOptionDto[]) {
        this.clearBusinessSession();
        this.setPendingToken(pendingToken);
        this.setAvailableSchools(schools || []);
    }

    private applyProfileFromLegacy(userProfile: CurrentUserProfile) {
        this.setUserFromDto(userProfile.user || null);
        this.setRoles(userProfile.roles || []);
        this.setSchoolName(userProfile.school_name || '');

        const primaryRole = this.resolvePrimaryRole(userProfile);
        this.setRole(primaryRole);

        const { studentInfo, teacherInfo } = this.resolveRoleProfiles(userProfile);
        const schoolId = teacherInfo?.school_id || studentInfo?.school_id || '';
        this.setSchoolId(schoolId);

        const actorType = teacherInfo ? 1 : (studentInfo ? 2 : this.resolveActorTypeFromRole(primaryRole));
        const actorId = teacherInfo?.teacher_id || studentInfo?.student_id || '';
        this.setActorContext(actorType, actorId);

        if (primaryRole === ROLE_MAP.STUDENT && studentInfo) {
            this.rootStore.StudentStore.setFromDto(studentInfo);
            this.rootStore.TeacherStore.clearProfile();
            return;
        }

        if (primaryRole === ROLE_MAP.TEACHER && teacherInfo) {
            this.rootStore.TeacherStore.setFromDto(teacherInfo);
            this.rootStore.StudentStore.clearProfile();
            return;
        }

        if (studentInfo) {
            this.rootStore.StudentStore.setFromDto(studentInfo);
            this.rootStore.TeacherStore.clearProfile();
            return;
        }

        if (teacherInfo) {
            this.rootStore.TeacherStore.setFromDto(teacherInfo);
            this.rootStore.StudentStore.clearProfile();
            return;
        }

        this.rootStore.StudentStore.clearProfile();
        this.rootStore.TeacherStore.clearProfile();
    }

    private applyProfileFromBusiness(userProfile: BusinessUserProfile, schoolNameHint?: string) {
        const roleFromActor = this.resolveRoleFromActorType(userProfile.actor_type);
        const primaryRole = roleFromActor || this.resolvePrimaryRole({
            user: {
                id: userProfile.id,
                name: userProfile.name,
                role_id: userProfile.role_id,
                sex: this.sex ?? true,
                account: userProfile.account,
                avatar: this.avatar,
            },
            roles: [],
            school_name: '',
        });

        const schoolName = userProfile.school_name
            || schoolNameHint
            || this.resolveSchoolNameById(userProfile.current_school_id, userProfile.actor_type);

        this.setUserFromDto({
            id: userProfile.id,
            name: userProfile.name,
            role_id: userProfile.role_id,
            sex: this.sex ?? true,
            account: userProfile.account,
            phone: this.phone,
            avatar: this.avatar,
            create_time: this.createTime,
            update_time: this.updateTime,
            status: this.status ?? undefined,
        });
        this.setRoles([]);
        this.setRole(primaryRole);
        this.setSchoolId(userProfile.current_school_id || '');
        this.setSchoolName(schoolName || '');
        this.setActorContext(userProfile.actor_type, userProfile.actor_id || '');

        if (userProfile.actor_type === 1) {
            this.rootStore.TeacherStore.setFromDto({
                teacher_id: userProfile.actor_id,
                school_id: userProfile.current_school_id,
                school_name: schoolName,
                user_id: userProfile.id,
            });
            this.rootStore.StudentStore.clearProfile();
            return;
        }

        this.rootStore.StudentStore.setFromDto({
            student_id: userProfile.actor_id,
            school_id: userProfile.current_school_id,
            school_name: schoolName,
            user_id: userProfile.id,
        });
        this.rootStore.TeacherStore.clearProfile();
    }

    applyAuthResponse(response: ApiEnvelope<AuthPayload> | AuthPayload | undefined | null, options?: ApplyAuthOptions) {
        const payload = this.extractAuthPayload(response);

        if (payload.pendingToken) {
            this.setPendingSession(payload.pendingToken, payload.schools || []);
            return;
        }

        if (payload.token && !options?.keepToken) {
            this.setToken(payload.token);
        }

        if (payload.valid === false) {
            this.clearAuth();
            return;
        }

        if (!payload.userProfile) {
            return;
        }

        this.setPendingToken(null);

        if (this.isBusinessProfile(payload.userProfile)) {
            this.applyProfileFromBusiness(payload.userProfile, options?.schoolNameHint);
            return;
        }

        this.applyProfileFromLegacy(payload.userProfile);
    }

    async fetchAuthSchools() {
        const { getAuthSchools } = await import('@/http/api');
        const res: any = await getAuthSchools();
        if (res?.code !== undefined && res.code !== 0 && res.code !== 200) {
            throw new Error(res?.msg || '获取学校列表失败');
        }

        const rawSchoolList = Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.data?.list) ? res.data.list : []);
        const nextSchools = rawSchoolList
            .map((item: AuthSchoolOptionLike) => this.normalizeSchoolOption(item))
            .filter((item: AuthSchoolOptionDto | null): item is AuthSchoolOptionDto => !!item);

        this.setAvailableSchools(nextSchools);
        return this.availableSchools;
    }

    async selectSchool(selection: UserSelectSchoolRequestDto, schoolNameHint?: string) {
        const { selectSchool } = await import('@/http/api');
        const schoolId = selection.schoolId || selection.school_id || '';
        const actorType = selection.actorType ?? selection.actor_type;
        const res: any = await selectSchool({
            schoolId,
            actorType,
        });
        if (res?.code !== undefined && res.code !== 0 && res.code !== 200) {
            throw new Error(res?.msg || '选校失败');
        }
        this.applyAuthResponse(res, { schoolNameHint });
        return res;
    }

    async switchSchool(selection: UserSelectSchoolRequestDto, schoolNameHint?: string) {
        const { switchSchool } = await import('@/http/api');
        const schoolId = selection.schoolId || selection.school_id || '';
        const actorType = selection.actorType ?? selection.actor_type;
        const res: any = await switchSchool({
            schoolId,
            actorType,
        });
        if (res?.code !== undefined && res.code !== 0 && res.code !== 200) {
            throw new Error(res?.msg || '切校失败');
        }
        this.applyAuthResponse(res, { schoolNameHint });
        return res;
    }

    clearAuth() {
        this.setPendingToken(null);
        this.availableSchools = [];
        localStorage.removeItem(SCHOOL_OPTIONS_STORAGE_KEY);
        this.clearBusinessSession();
    }

    clearToken() {
        this.clearAuth();
    }

    reset() {
        this.clearAuth();
    }
}
