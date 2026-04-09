import { makeAutoObservable } from "mobx";
import { CurrentStudentInfoDto } from "@/type/user";
import { leaveCourseStudent } from "@/http/api";
import { message } from "antd";

const STUDENT_INFO_STORAGE_KEY = 'student_info';

export class Student {
    // 学生角色 ID
    studentId: string = '';
    // 学号
    studentNumber: string = '';
    // 班级 ID
    classId: string = '';
    // 学院
    college: string = '';
    // 学校 ID
    schoolId: string = '';
    // 学校名称
    schoolName: string = '';
    // 学院 ID
    collegeId: string = '';
    // 学院名称
    collegeName: string = '';
    // 年级
    grade: string = '';

    // 初始化响应式能力并从本地缓存恢复数据
    constructor() {
        makeAutoObservable(this);
        this.hydrateFromStorage();
    }

    // 是否已有学生档案
    get hasProfile() {
        return !!this.studentId;
    }

    // 从 localStorage 恢复学生信息（兼容旧 snake_case 缓存）
    hydrateFromStorage() {
        const raw = localStorage.getItem(STUDENT_INFO_STORAGE_KEY);
        if (!raw) {
            this.clearFields();
            return;
        }

        try {
            const profile = JSON.parse(raw) || {};
            this.studentId = profile.studentId || profile.student_id || profile.userId || profile.user_id || '';
            this.studentNumber = profile.studentNumber || profile.student_number || '';
            this.classId = profile.classId || profile.class_id || '';
            this.college = profile.college || '';
            this.schoolId = profile.schoolId || profile.school_id || '';
            this.schoolName = profile.schoolName || profile.school_name || '';
            this.collegeId = profile.collegeId || profile.college_id || '';
            this.collegeName = profile.collegeName || profile.college_name || '';
            this.grade = profile.grade || '';
        } catch (_error) {
            this.clearFields();
            localStorage.removeItem(STUDENT_INFO_STORAGE_KEY);
        }
    }

    // 清空内存中的学生字段
    private clearFields() {
        this.studentId = '';
        this.studentNumber = '';
        this.classId = '';
        this.college = '';
        this.schoolId = '';
        this.schoolName = '';
        this.collegeId = '';
        this.collegeName = '';
        this.grade = '';
    }

    // 将后端 DTO（snake_case）映射为 store 驼峰字段并持久化
    setFromDto(dto: CurrentStudentInfoDto | null) {
        if (!dto) {
            this.clearProfile();
            return;
        }

        this.studentId = dto.student_id || dto.user_id || '';
        this.studentNumber = dto.student_number || '';
        this.classId = dto.class_id || '';
        this.college = dto.college || '';
        this.schoolId = dto.school_id || '';
        this.schoolName = dto.school_name || '';
        this.collegeId = dto.college_id || '';
        this.collegeName = dto.collegeName || '';
        this.grade = dto.grade || '';

        localStorage.setItem(STUDENT_INFO_STORAGE_KEY, JSON.stringify({
            studentId: this.studentId,
            studentNumber: this.studentNumber,
            classId: this.classId,
            college: this.college,
            schoolId: this.schoolId,
            schoolName: this.schoolName,
            collegeId: this.collegeId,
            collegeName: this.collegeName,
            grade: this.grade,
        }));
    }

    // 清空学生档案并删除本地缓存
    clearProfile() {
        this.clearFields();
        localStorage.removeItem(STUDENT_INFO_STORAGE_KEY);
    }

    async leaveCourse(courseId: string) {
        await leaveCourseStudent(courseId)
            .then(() => {
                message.success('退课成功');
                window.location.href = '/courses'
            });
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
