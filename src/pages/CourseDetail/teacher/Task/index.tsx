import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import TaskEditor from '../TaskEditor';
import StudentTask from '../../student/Task';

type TeacherTaskProps = {
    courseId: string | null;
    creatorId?: string | null;
};

/**
 * 教师端 Task 路由容器
 * - 创建者 → 渲染 TaskEditor（Markdown 编辑 + 保存）
 * - 非创建者 → 渲染学生只读任务说明
 */
const TeacherTask = observer(({ courseId }: TeacherTaskProps) => {
    const { CourseStore } = useStore();
    const isCreator = CourseStore.isCourseCreator;

    if (isCreator) {
        return <TaskEditor courseId={courseId} />;
    }

    return <StudentTask courseId={courseId} />;
});

export default TeacherTask;
