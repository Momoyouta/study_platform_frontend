import { makeAutoObservable } from "mobx";

import { get } from '@/http/http';
import { getCourseBaseInfo, getCourseLessonOutline, listStudentCoursesUser, listTeacherCoursesUser, listMyCreatedCourses, getLearningProgress } from "@/http/api";


export class Course {
    list: any[] = [];
    sourceList: any[] = [];
    total: number = 0;

    teachingList: any[] = [];
    teachingTotal: number = 0;

    createdList: any[] = [];
    createdTotal: number = 0;

    studentList: any[] = [];
    studentTotal: number = 0;

    currentCourseId: string = '';
    currentCreateId: string = '';
    currentSchoolId: string = '';
    isCourseCreator: boolean = false;
    courseName: string = '';
    courseCover: string = '';
    publishStatus: number = 0;
    description: string = '';
    chapters: any[] = [];
    teachingGroups: any[] = [];
    learningProgress: any = null;
    loading: boolean = false;

    rootStore: any;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    /**
     * 初始化详情页所需的课程参数。
     * 优先解析 URL 传入的参数，解析失败时尝试从 Store 列表中寻找匹配项。
     */
    resolveCourseParams(params: { courseId: string; createId?: string | null; schoolId?: string | null }) {
        const { courseId, createId, schoolId } = params;
        this.currentCourseId = courseId;

        // 尝试从 TeacherStore 恢复/确保教师信息（从 localStorage）
        if (this.rootStore?.TeacherStore) {
            this.rootStore.TeacherStore.hydrateFromStorage();
        }

        // 如果直接传了参数，则直接使用
        if (createId) this.currentCreateId = createId;
        if (schoolId) this.currentSchoolId = schoolId;

        // 如果没有传参数，或者为了确保同步，尝试从列表中查找
        if (!createId || !schoolId) {
            const courseInList = this.list.find(c => String(c.course_id) === String(courseId));
            if (courseInList) {
                this.currentCreateId = courseInList.create_id || courseInList.creator_id || this.currentCreateId;
                this.currentSchoolId = courseInList.school_id || this.currentSchoolId;
            }
        }

        // 统一计算并存入响应式属性：是否为创建者
        const myTeacherId = this.rootStore?.TeacherStore?.teacherId;
        this.isCourseCreator = !!myTeacherId && !!this.currentCreateId && myTeacherId === this.currentCreateId;
    }

    /**
     * 从服务端获取真实的创作者 ID 及课程基础信息并更新权限状态
     */
    async fetchCourseBaseInfo(id: string) {
        const myTeacherId = this.rootStore?.TeacherStore?.teacherId;
        if (!id || !myTeacherId) return;

        try {
            const res: any = await getCourseBaseInfo(id, myTeacherId);
            if (res?.code === 200) {
                const info = res.data;
                if (info) {
                    this.currentCreateId = info.creator_id || '';
                    this.courseName = info.course_name || '';
                    this.courseCover = info.course_cover || '';
                    this.publishStatus = info.publish_status || 0;
                }
                // 再次判定身份
                this.isCourseCreator = !!myTeacherId && !!this.currentCreateId && myTeacherId === this.currentCreateId;
            }
        } catch (error) {
            console.error('Failed to fetch course base info', error);
        }
    }

    setList(list: any[]) {
        this.list = list;
        this.sourceList = list;
    }

    setTotal(total: number) {
        this.total = total;
    }

    setTeachingGroups(groups: any[]) {
        this.teachingGroups = groups;
    }

    /**
     * 用户端查询老师所教课程列表
     */
    async fetchTeacherCourses(params: { page: number; pageSize: number; teacher_id: string; school_id?: string; keyword?: string }) {
        this.loading = true;
        try {
            const res: any = await listTeacherCoursesUser(params);
            if (res?.code === 200) {
                const nextList = res.data?.list || [];
                this.teachingList = nextList;
                this.teachingTotal = res.data?.total || 0;
                // 为了兼容旧组件，仍更新 list 和 total
                this.list = nextList;
                this.total = res.data?.total || 0;
            }
        } catch (error) {
            console.error('Failed to fetch teacher courses', error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * 查询老师创建的课程列表
     */
    async fetchMyCreatedCourses(params: { page: number; pageSize: number; keyword?: string; school_id?: string }) {
        this.loading = true;
        try {
            const res: any = await listMyCreatedCourses(params);
            if (res?.code === 200) {
                const nextList = res.data?.list || [];
                this.createdList = nextList;
                this.createdTotal = res.data?.total || 0;
                this.list = nextList;
                this.total = res.data?.total || 0;
            }
        } catch (error) {
            console.error('Failed to fetch my created courses', error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * 用户端查询学生所学课程列表
     */
    async fetchStudentCourses(params: { page: number; pageSize: number; student_id: string; school_id?: string; keyword?: string }) {
        this.loading = true;
        try {
            const res: any = await listStudentCoursesUser(params);
            if (res?.code === 200) {
                const nextList = res.data?.list || [];
                this.studentList = nextList;
                this.studentTotal = res.data?.total || 0;
                this.list = nextList;
                this.total = res.data?.total || 0;
            }
        } catch (error) {
            console.error('Failed to fetch student courses', error);
        } finally {
            this.loading = false;
        }
    }

    fetchCourseList(params?: { keyword?: string; fields?: string[] }) {
        const keyword = params?.keyword?.trim() || '';
        const fields = params?.fields?.length ? params.fields : ['title'];

        if (!this.sourceList.length && this.list.length) {
            this.sourceList = this.list;
        }

        const source = this.sourceList.length ? this.sourceList : this.list;
        if (!keyword) {
            this.list = source;
            return;
        }

        const normalizedKeyword = keyword.toLowerCase();
        const fieldResolvers: Record<string, (course: any) => any[]> = {
            title: (course) => [course?.title, course?.name],
        };

        this.list = source.filter((course) => {
            return fields.some((field) => {
                const resolver = fieldResolvers[field];
                const values = resolver ? resolver(course) : [course?.[field]];

                return values.some((value) => {
                    if (value === null || value === undefined) {
                        return false;
                    }

                    if (Array.isArray(value)) {
                        return value.some((item) => String(item).toLowerCase().includes(normalizedKeyword));
                    }

                    return String(value).toLowerCase().includes(normalizedKeyword);
                });
            });
        });
    }

    async fetchCourseDescription(id: string) {
        this.currentCourseId = id;
        this.loading = true;
        try {
            const res: any = await get(`/course/getCourseDescription/${id}`);
            if (res?.code === 200) {
                this.description = res.data?.description || '';
            } else {
                this.description = '';
            }
        } catch (error) {
            console.error('Failed to fetch course description', error);
            this.description = '';
        } finally {
            this.loading = false;
        }
    }
    async fetchCourseLessonOutline(id: string, source?: 'draft' | 'published') {
        this.currentCourseId = id;
        this.loading = true;
        try {
            const res: any = await getCourseLessonOutline(id, source);
            if (res?.code === 200) {
                this.chapters = res.data?.chapters || [];
            } else {
                this.chapters = [];
            }
        } catch (error) {
            console.error('Failed to fetch course lesson outline', error);
            this.chapters = [];
        } finally {
            this.loading = false;
        }
    }

    async fetchLearningProgress(params: { schoolId: string; courseId: string }) {
        try {
            const res: any = await getLearningProgress(params);
            if (res?.code === 200) {
                this.learningProgress = res.data;
            }
        } catch (error) {
            console.error('Failed to fetch learning progress', error);
        }
    }

    /**
     * 自动更新课时进度（仅从 0 变 1 时才进行状态变更）
     */
    updateLessonProgress(data: { chapter_id: string; lesson_id: string; is_completed: number; progress_percent: number }) {
        if (!this.learningProgress || !this.learningProgress.chapter_progress) return;

        const { chapter_id, lesson_id, is_completed, progress_percent } = data;
        const chapter = this.learningProgress.chapter_progress.find((c: any) => c.chapter_id === chapter_id);
        if (!chapter || !chapter.lessons) return;

        const lesson = chapter.lessons.find((l: any) => l.lesson_id === lesson_id);
        if (!lesson) return;

        // 仅当状态从 0 变为 1 时才更新 Store 中的计数值
        if (lesson.is_completed === 0 && is_completed === 1) {
            lesson.is_completed = 1;
            lesson.progress_percent = progress_percent || 100;
            
            // 更新章节内的完成计数
            chapter.completed_lessons = (chapter.completed_lessons || 0) + 1;
            // 更新全课的总完成计数
            this.learningProgress.total_completed = (this.learningProgress.total_completed || 0) + 1;
        }
    }

    reset() {
        this.list = [];
        this.sourceList = [];
        this.total = 0;
        this.teachingList = [];
        this.teachingTotal = 0;
        this.createdList = [];
        this.createdTotal = 0;
        this.studentList = [];
        this.studentTotal = 0;
        this.currentCreateId = '';
        this.currentSchoolId = '';
        this.isCourseCreator = false;
        this.courseName = '';
        this.courseCover = '';
        this.publishStatus = 0;
        this.description = '';
        this.chapters = [];
        this.learningProgress = null;
        this.loading = false;
    }
}

