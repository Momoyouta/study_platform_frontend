import { Tabs } from 'antd';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import { ROLE_MAP } from '../../type/map.js';
import MyCoursesTabContent from './MyCoursesTabContent.tsx';
import './index.less';

const Course = observer(() => {
	const { UserStore } = useStore();
	
	const isTeacher = UserStore.role === ROLE_MAP.TEACHER;

	const tabItems = [
		{
			key: 'my-courses',
			label: isTeacher ? '我教的课' : '我学的课',
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
});

export default Course;
