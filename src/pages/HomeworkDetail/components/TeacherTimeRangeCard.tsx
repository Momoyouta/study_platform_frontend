import { DatePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

type TeacherTimeRangeCardProps = {
    isPublished: boolean;
    startTime: string;
    endTime: string;
    onRangeChange: (startTime: string, endTime: string) => void | Promise<void>;
};

const TeacherTimeRangeCard = ({
    isPublished,
    startTime,
    endTime,
    onRangeChange,
}: TeacherTimeRangeCardProps) => {
    return (
        <div className="teacher-time-range-card">
            <div className="time-range-header">
                <ClockCircleOutlined />
                <span>作业时间</span>
            </div>
            <DatePicker.RangePicker
                showTime
                disabled={isPublished}
                onChange={(values) => {
                    if (!values || !values[0] || !values[1]) {
                        onRangeChange('', '');
                        return;
                    }

                    onRangeChange(
                        values[0].format('YYYY-MM-DD HH:mm:ss'),
                        values[1].format('YYYY-MM-DD HH:mm:ss'),
                    );
                }}
            />
            <div className="time-range-text">
                {startTime && endTime ? `${startTime} 至 ${endTime}` : '尚未设置开始与结束时间'}
            </div>
        </div>
    );
};

export default TeacherTimeRangeCard;
