import { makeAutoObservable } from "mobx";
import { ROLE_MAP } from "@/type/map.js";
import {
    CurrentUserInfoDto,
    CurrentUserProfile,
    Role,
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

type AuthPayload = {
    token?: string;
    valid?: boolean;
    userProfile?: CurrentUserProfile;
};

const TOKEN_STORAGE_KEY = 'access_token';
const ROLE_STORAGE_KEY = 'user_role';
const USER_INFO_STORAGE_KEY = 'user_info';
const USER_ROLES_STORAGE_KEY = 'user_roles';
const SCHOOL_NAME_STORAGE_KEY = 'school_name';
const LEGACY_USER_INFO_STORAGE_KEY = 'user_base_info';

export class User {
    // 根 store 引用，用于跨 store 协同更新
    private rootStore: RootStoreLike;
    // 用户 ID
    userId: string = '';
    // 用户姓名
    userName: string = '';
    // 用户 role_id 原始字符串
    roleId: string = '';
    // 性别
    sex: boolean | null = null;
    // 账号
    account: string = '';
    // 手机号
    phone: string = '';
    // 头像地址
    avatar: string = '';
    // 创建时间
    createTime: string = '';
    // 更新时间
    updateTime: string = '';
    // 用户状态
    status: number | null = null;
    // 角色列表
    roles: Role[] = [];
    // 学校名称
    schoolName: string = '';
    // 当前主角色（学生/老师）
    role: string | null = localStorage.getItem(ROLE_STORAGE_KEY);
    // 访问令牌
    token: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);

    // 初始化响应式能力并从本地缓存恢复数据
    constructor(rootStore: RootStoreLike) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
        this.hydrateFromStorage();
    }

    // 页面展示名（无数据时回退默认值）
    get displayName() {
        return this.userName || 'userName';
    }

    // 从 localStorage 恢复用户相关数据
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
    }

    // 安全解析本地缓存，解析失败时自动清理脏数据
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

    // 清理遗留的旧版本缓存键
    private removeLegacyStorage() {
        localStorage.removeItem(LEGACY_USER_INFO_STORAGE_KEY);
    }

    // 从 userProfile 中推断当前主角色（优先 roles，其次 role_id）
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

    // 兼容 roleInfo.{studentInfo/teacherInfo} 与旧平铺字段
    private resolveRoleProfiles(profile: CurrentUserProfile) {
        return {
            studentInfo: profile.roleInfo?.studentInfo ?? profile.studentInfo ?? null,
            teacherInfo: profile.roleInfo?.teacherInfo ?? profile.teacherInfo ?? null,
        };
    }

    // 统一提取认证接口有效载荷（兼容 envelope 与直出两种格式）
    private extractAuthPayload(response: ApiEnvelope<AuthPayload> | AuthPayload | undefined | null) {
        const payload = ((response as ApiEnvelope<AuthPayload>)?.data ?? response ?? {}) as AuthPayload;
        return {
            token: payload.token,
            valid: payload.valid,
            userProfile: payload.userProfile,
        };
    }

    // 清空内存中的用户字段
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

    // 将后端 DTO（snake_case）映射为 store 驼峰字段并持久化
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

    // 更新角色列表并持久化
    setRoles(roles: Role[]) {
        this.roles = roles;
        localStorage.setItem(USER_ROLES_STORAGE_KEY, JSON.stringify(roles || []));
    }

    // 更新学校名称并持久化
    setSchoolName(schoolName: string) {
        this.schoolName = schoolName || '';
        localStorage.setItem(SCHOOL_NAME_STORAGE_KEY, this.schoolName);
    }

    // 更新当前主角色并持久化
    setRole(role: string | null) {
        this.role = role;
        if (role) {
            localStorage.setItem(ROLE_STORAGE_KEY, role);
            return;
        }
        localStorage.removeItem(ROLE_STORAGE_KEY);
    }

    // 更新 token 并持久化
    setToken(token: string) {
        this.token = token;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    // 统一处理登录/注册/jwtAuth 响应并分发到各 store
    applyAuthResponse(response: ApiEnvelope<AuthPayload> | AuthPayload | undefined | null, options?: { keepToken?: boolean }) {
        const payload = this.extractAuthPayload(response);

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

        const profile = payload.userProfile;
        this.setUserFromDto(profile.user || null);
        this.setRoles(profile.roles || []);
        this.setSchoolName(profile.school_name || '');

        const primaryRole = this.resolvePrimaryRole(profile);
        this.setRole(primaryRole);

        const { studentInfo, teacherInfo } = this.resolveRoleProfiles(profile);

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

    // 清理认证态（内存 + 本地缓存）并清空角色扩展信息
    clearAuth() {
        this.token = null;
        this.clearUserFields();
        this.roles = [];
        this.schoolName = '';
        this.role = null;

        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem(USER_INFO_STORAGE_KEY);
        localStorage.removeItem(USER_ROLES_STORAGE_KEY);
        localStorage.removeItem(SCHOOL_NAME_STORAGE_KEY);
        localStorage.removeItem(LEGACY_USER_INFO_STORAGE_KEY);

        this.rootStore.StudentStore.clearProfile();
        this.rootStore.TeacherStore.clearProfile();
    }

    // 兼容旧调用方的方法别名
    clearToken() {
        this.clearAuth();
    }

    // store 重置入口
    reset() {
        this.clearAuth();
    }
}