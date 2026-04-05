import { useState } from 'react';
import { Radio } from 'antd';
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
 * - 创建者 → 允许切换完整的 ChapterEditor（拖拽编辑）或 学生预览视图
 * - 非创建者 → 仅渲染学生只读章节视图
 */
const TeacherChapter = observer(({ courseId }: TeacherChapterProps) => {
    const { CourseStore } = useStore();
    const isCreator = CourseStore.isCourseCreator;
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    if (isCreator) {
        return (
            <div className="teacher-chapter-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ marginRight: 12, color: '#666', fontSize: 14 }}>大纲视图模式:</span>
                    <Radio.Group 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="edit">编辑模式</Radio.Button>
                        <Radio.Button value="preview">学生预览</Radio.Button>
                    </Radio.Group>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    {viewMode === 'edit' ? <ChapterEditor courseId={courseId} /> : <StudentChapter />}
                </div>
            </div>
        );
    }

    return <StudentChapter />;
});

export default TeacherChapter;
