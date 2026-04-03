import { makeAutoObservable } from "mobx";

import { get } from '@/http/http';
import { listStudentCoursesUser, listTeacherCoursesUser } from "@/http/api";

export class Course {
    list: any[] = [];
    sourceList: any[] = [];
    total: number = 0;
    currentCourseId: string = '';
    description: string = '';
    loading: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    setList(list: any[]) {
        this.list = list;
        this.sourceList = list;
    }

    setTotal(total: number) {
        this.total = total;
    }

    /**
     * 用户端查询老师所教课程列表
     */
    async fetchTeacherCourses(params: { page: number; pageSize: number; teacher_id: string; school_id?: string }) {
        this.loading = true;
        try {
            const res: any = await listTeacherCoursesUser(params);
            if (res?.code === 200) {
                const nextList = res.data?.list || [];
                this.list = nextList;
                this.sourceList = nextList;
                this.total = res.data?.total || 0;
            }
        } catch (error) {
            console.error('Failed to fetch teacher courses', error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * 用户端查询学生所学课程列表
     */
    async fetchStudentCourses(params: { page: number; pageSize: number; student_id: string; school_id?: string }) {
        this.loading = true;
        try {
            const res: any = await listStudentCoursesUser(params);
            if (res?.code === 200) {
                const nextList = res.data?.list || [];
                this.list = nextList;
                this.sourceList = nextList;
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

    reset() {
        this.list = [];
        this.sourceList = [];
        this.total = 0;
        this.currentCourseId = '';
        this.description = '';
        this.loading = false;
    }
}
