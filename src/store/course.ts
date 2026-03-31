import { makeAutoObservable } from "mobx";

import { get } from '@/http/http';

export class Course {
    courseList: any[] = [];
    currentCourseId: string = '';
    description: string = '';
    loading: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    setCourseList(list: any[]) {
        this.courseList = list;
    }

    fetchCourseList(params?: { keyword?: string }) {
        // mock logic replacing what's in MyCoursesTabContent.tsx
        const mockCourses = [
            { id: 'e39839f0-72be-48b5-8d95-4fdb80aa0cfe', title: '课程名称123123123123123123123123123123', teacher: '教师名称' },
            { id: 2, title: '课程名称', teacher: '教师名称' },
            { id: 3, title: '课程名称', teacher: '教师名称' },
            { id: 4, title: '课程名称', teacher: '教师名称' },
            { id: 5, title: '课程名称', teacher: '教师名称' },
            { id: 6, title: '课程名称', teacher: '教师名称' },
            { id: 7, title: '课程名称', teacher: '教师名称' },
            { id: 8, title: '课程名称', teacher: '教师名称' },
            { id: 9, title: '课程名称', teacher: '教师名称' },
            { id: 10, title: '课程名称', teacher: '教师名称' },
            { id: 11, title: '课程名称', teacher: '教师名称' },
            { id: 12, title: '课程名称', teacher: '教师名称' },
            { id: 13, title: '课程名称', teacher: '教师名称' },
            { id: 14, title: '课程名称', teacher: '教师名称' },
            { id: 15, title: '课程名称', teacher: '教师名称' },
            { id: 16, title: '课程名称', teacher: '教师名称' },
            { id: 17, title: '课程名称', teacher: '教师名称' },
        ];

        let filtered = mockCourses;
        if (params?.keyword) {
            const normalized = params.keyword.trim();
            if (normalized) {
                filtered = mockCourses.filter((course) => course.title.includes(normalized));
            }
        }

        this.courseList = filtered;
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
        this.courseList = [];
        this.currentCourseId = '';
        this.description = '';
        this.loading = false;
    }
}
