import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import MDEditor from '@uiw/react-md-editor';

import './Task.less';
import Title from 'antd/es/typography/Title';

type TaskProps = {
    courseId: string | null;
};

const Task = observer(({ courseId }: TaskProps) => {
    const { CourseStore } = useStore();

    useEffect(() => {
        if (courseId) {
            CourseStore.fetchCourseDescription(courseId);
        }
    }, [courseId, CourseStore]);

    return (
        <div className="task-container">
            <Title level={2} className="group-title">课程任务</Title>
            <div data-color-mode="light">
                <MDEditor.Markdown
                    className="task-markdown"
                    source={CourseStore.description || ''}
                />
            </div>
        </div>
    );
});

export default Task;
