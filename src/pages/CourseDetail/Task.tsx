import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import MDEditor from '@uiw/react-md-editor';

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
        <div style={{ padding: '0 16px' }}>
            <div data-color-mode="light">
                <MDEditor.Markdown source={CourseStore.description || ''} style={{ whiteSpace: 'pre-wrap', backgroundColor: 'transparent' }} />
            </div>
        </div>
    );
});

export default Task;
