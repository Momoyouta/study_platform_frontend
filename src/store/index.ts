import { createContext, useContext } from "react";
import { User } from "./user";
import { Student } from "./student";
import { Teacher } from "./teacher";
import { Course } from "./course";

class RootStore {
    // 学生信息 store
    StudentStore: Student;
    // 教师信息 store
    TeacherStore: Teacher;
    // 认证与用户基础信息 store
    UserStore: User;
    // 课程管理 store
    CourseStore: Course;

    // 初始化所有 store，并注入跨 store 依赖
    constructor() {
        this.StudentStore = new Student();
        this.TeacherStore = new Teacher();
        this.UserStore = new User(this);
        this.CourseStore = new Course(this);
    }
}

// 全局 store 单例
const Store = new RootStore();

// 重置所有 store 的内存状态
export const resetStores = () => {
    Object.values(Store).forEach((storeItem: any) => {
        if (typeof storeItem.reset === 'function') {
            storeItem.reset();
        }
    });
};

// React Context，用于在组件树中注入 store
const StoreContext = createContext(Store);

// 读取全局 store 的 hook
export const useStore = () => useContext(StoreContext);
// Context Provider 导出
export const StoreProvider = StoreContext.Provider;

export default Store;