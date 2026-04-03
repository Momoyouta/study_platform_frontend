import { Card, Typography } from 'antd';
import { useLocation } from 'react-router-dom';
import Task from './Task';
import Chapter from './Chapter';
import StudyRecord from './StudyRecord';
import './index.less';

const { Paragraph, Title, Text } = Typography;

const sectionMap = {
  task: '任务',
  chapter: '章节',
  homework: '作业',
  materials: '资料',
  studyRecord: '学习记录',
};

const getSectionKey = (pathname) => {
  if (pathname === '/courseDetail' || pathname === '/courseDetail/') return 'task';
  const restPath = pathname.replace('/courseDetail/', '');
  const [firstSegment] = restPath.split('/');
  return sectionMap[firstSegment] ? firstSegment : 'task';
};

const CourseDetail = () => {
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('courseId');
  const sectionKey = getSectionKey(location.pathname);
  const sectionLabel = sectionMap[sectionKey];

  return (
    <section className="course-detail-page">
      {sectionKey === 'task' ? (
        <Task courseId={courseId} />
      ) : sectionKey === 'chapter' ? (
        <Chapter />
      ) : sectionKey === 'studyRecord' ? (
        <StudyRecord courseId={courseId} />
      ) : (
        <Card className="course-detail-card" bordered={false}>
          <Title className="course-detail-title" level={3}>
            {sectionLabel}
          </Title>
          <Paragraph className="course-detail-desc">
            当前是课程详情的“{sectionLabel}”页面，后续可在这里接入真实业务模块。
          </Paragraph>
          <Text className="course-detail-course-id">
            当前 courseId: {courseId || '未携带'}
          </Text>
        </Card>
      )}
    </section>
  );
};

export default CourseDetail;
