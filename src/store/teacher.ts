import { makeAutoObservable } from "mobx";
import { CurrentTeacherInfoDto } from "@/type/user";

const TEACHER_INFO_STORAGE_KEY = 'teacher_info';

export class Teacher {
    // 教师角色 ID
    teacherId: string = '';
    // 工号
    teacherNumber: string = '';
    // 学院
    college: string = '';
    // 学校 ID
    schoolId: string = '';
    // 学校名称
    schoolName: string = '';

    // 初始化响应式能力并从本地缓存恢复数据
    constructor() {
        makeAutoObservable(this);
        this.hydrateFromStorage();
    }

    // 是否已有教师档案
    get hasProfile() {
        return !!this.teacherId;
    }

    // 从 localStorage 恢复教师信息（兼容旧 snake_case 缓存）
    hydrateFromStorage() {
        const raw = localStorage.getItem(TEACHER_INFO_STORAGE_KEY);
        if (!raw) {
            this.clearFields();
            return;
        }

        try {
            const profile = JSON.parse(raw) || {};
            this.teacherId = profile.teacherId || profile.teacher_id || profile.userId || profile.user_id || '';
            this.teacherNumber = profile.teacherNumber || profile.teacher_number || '';
            this.college = profile.college || '';
            this.schoolId = profile.schoolId || profile.school_id || '';
            this.schoolName = profile.schoolName || profile.school_name || '';
        } catch (_error) {
            this.clearFields();
            localStorage.removeItem(TEACHER_INFO_STORAGE_KEY);
        }
    }

    // 清空内存中的教师字段
    private clearFields() {
        this.teacherId = '';
        this.teacherNumber = '';
        this.college = '';
        this.schoolId = '';
        this.schoolName = '';
    }

    // 将后端 DTO（snake_case）映射为 store 驼峰字段并持久化
    setFromDto(dto: CurrentTeacherInfoDto | null) {
        if (!dto) {
            this.clearProfile();
            return;
        }

        this.teacherId = dto.teacher_id || dto.user_id || '';
        this.teacherNumber = dto.teacher_number || '';
        this.college = dto.college || '';
        this.schoolId = dto.school_id || '';
        this.schoolName = dto.school_name || '';

        localStorage.setItem(TEACHER_INFO_STORAGE_KEY, JSON.stringify({
            teacherId: this.teacherId,
            teacherNumber: this.teacherNumber,
            college: this.college,
            schoolId: this.schoolId,
            schoolName: this.schoolName,
        }));
    }

    // 清空教师档案并删除本地缓存
    clearProfile() {
        this.clearFields();
        localStorage.removeItem(TEACHER_INFO_STORAGE_KEY);
    }

    // 兼容旧调用方的方法别名
    clearInfo() {
        this.clearProfile();
    }

    // store 重置入口（仅清内存，不操作本地缓存）
    reset() {
        this.clearFields();
    }
}
