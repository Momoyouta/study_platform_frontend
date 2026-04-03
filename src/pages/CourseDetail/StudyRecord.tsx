import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

type StudyRecordProps = {
    courseId: string | null;
};

const StudyRecord = observer(({ courseId }: StudyRecordProps) => {
    const { CourseStore, StudentStore } = useStore();
    const navigate = useNavigate();
    const leaveCourse = async (courseId: string) => {
        console.log('abb')
        await StudentStore.leaveCourse(courseId);
    };
    return (
        <div style={{ padding: '0 16px' }}>
            <div data-color-mode="light">
                <Button type="primary" danger onClick={() => courseId && leaveCourse(courseId)}>
                    退课
                </Button>
            </div>
        </div>
    );
});

export default StudyRecord;
