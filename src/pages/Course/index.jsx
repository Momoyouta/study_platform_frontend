import { Tabs } from 'antd';
import MyCoursesTabContent from './MyCoursesTabContent.tsx';
import './index.less';

const Course = () => {
	const tabItems = [
		{
			key: 'my-courses',
			label: '我学的课',
			children: <MyCoursesTabContent />,
		},
	];

	return (
		<section className="course-panel">
			<Tabs className="course-tabs" 
        defaultActiveKey="my-courses" 
        size='large' 
        items={tabItems}
        indicator={{ size: 32, align: 'center' }}
      />
		</section>
	);
};

export default Course;
