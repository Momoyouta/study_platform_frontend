import { Card, Typography } from 'antd';
import './CourseCard.less';

const { Text } = Typography;

const CourseCard = ({ title, teacher, onClick, imgSrc}) => (
  <Card className="course-card" 
    hoverable 
    onClick={onClick}
    cover={
      <img className="course-card-media" src={imgSrc} alt="课程图片" />
    }
  >
    <div className="course-card-title">{title}</div>
    <Text className="course-card-teacher">{teacher}</Text>
  </Card>
);

export default CourseCard;