import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import ChapterEditor from '../ChapterEditor';
import StudentChapter from '../../student/Chapter';

type TeacherChapterProps = {
    courseId: string | null;
    creatorId?: string | null;
};

/**
 * 教师端 Chapter 路由容器
 * - 创建者 → 渲染完整 ChapterEditor（拖拽编辑）
 * - 非创建者 → 渲染学生只读章节视图
 */
const TeacherChapter = observer(({ courseId }: TeacherChapterProps) => {
    const { CourseStore } = useStore();
    const isCreator = CourseStore.isCourseCreator;

    if (isCreator) {
        return <ChapterEditor courseId={courseId} />;
    }

    return <StudentChapter />;
});

export default TeacherChapter;
