import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import TeachingGroupManage from '../TeachingGroupManage';
import ReadonlyTeachingGroup from './ReadonlyTeachingGroup';

type TeacherTeachingGroupProps = {
    courseId: string | null;
    creatorId?: string | null;
    schoolId?: string | null;
};

/**
 * 教师端 TeachingGroup 路由容器
 * - 创建者 → 渲染完整 TeachingGroupManage（CRUD + 邀请码 + 成员管理）
 * - 非创建者 → 渲染只读视图（查看自己所在组 + 生成邀请码）
 */
const TeacherTeachingGroup = observer(({ courseId, schoolId }: TeacherTeachingGroupProps) => {
    const { CourseStore } = useStore();
    const isCreator = CourseStore.isCourseCreator;

    if (isCreator) {
        return <TeachingGroupManage courseId={courseId} schoolId={schoolId} />;
    }

    return <ReadonlyTeachingGroup courseId={courseId} schoolId={schoolId} />;
});

export default TeacherTeachingGroup;
