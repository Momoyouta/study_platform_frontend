import { Card, Typography } from 'antd';
import './CourseCard.less';

const { Text } = Typography;

const CourseCard = ({ title, teacher, onClick, imgSrc, status }) => (
  <Card className="course-card" 
    hoverable 
    onClick={onClick}
    cover={
      <div className="course-card-cover-wrapper">
        <img className="course-card-media" src={imgSrc} alt="课程图片" />
        {status === 0 && <div className="course-card-mask">未发布</div>}
      </div>
    }
  >
    <div className="course-card-title">{title}</div>
    <Text className="course-card-teacher">{teacher}</Text>
  </Card>
);

export default CourseCard;