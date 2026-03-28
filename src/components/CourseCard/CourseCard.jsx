import { Card, Typography } from 'antd';
import './CourseCard.less';

const { Text } = Typography;

const CourseCard = ({ title, teacher }) => (
  <Card className="course-card" 
    hoverable 
    cover={
      <img className="course-card-media" src="src\assets\login\login-banner.png" alt="课程图片" />
    }
  >
    <div className="course-card-title">{title}</div>
    <Text className="course-card-teacher">{teacher}</Text>
  </Card>
);

export default CourseCard;