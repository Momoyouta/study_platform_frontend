import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { Button } from 'antd';

import './StudyRecord.less';

type StudyRecordProps = {
    courseId: string | null;
};

const StudyRecord = observer(({ courseId }: StudyRecordProps) => {
    const { StudentStore } = useStore();

    const leaveCourse = async (id: string) => {
        await StudentStore.leaveCourse(id);
    };

    return (
        <div className="study-record-container">
            <div data-color-mode="light">
                <Button type="primary" danger onClick={() => courseId && leaveCourse(courseId)}>
                    退课
                </Button>
            </div>
        </div>
    );
});

export default StudyRecord;
