import type { ChangeEvent } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { Button, Empty, Flex, Grid, Input, List, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import CourseCard from '../../components/CourseCard/CourseCard.jsx';
import './MyCoursesTabContent.less';

const { useBreakpoint } = Grid;

const MyCoursesTabContent = observer(() => {
	const { CourseStore } = useStore();
	const [keyword, setKeyword] = useState('');
	const screens = useBreakpoint();
	const navigate = useNavigate();

	useEffect(() => {
		CourseStore.fetchCourseList({ keyword: '' });
	}, [CourseStore]);

	const courseColumns = useMemo(() => {
		if (screens.xxl) return 4;
		if (screens.lg) return 3;
		if (screens.md) return 2;
		return 1;
	}, [screens.xxl, screens.lg, screens.md]);

	const handleSearch = (value: string) => {
		setKeyword(value);
		CourseStore.fetchCourseList({ keyword: value });
		message.info('当前使用 Store 中的模拟搜索');
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value;
		setKeyword(val);
		CourseStore.fetchCourseList({ keyword: val });
	};

	const handleAddCourse = () => {
		message.info('添加课程接口暂未实现，当前为占位交互。');
	};

	const handleOpenCourseDetail = (courseId: number) => {
		navigate(`/courseDetail/?courseId=${courseId}`);
	};

	return (
		<>
			<Flex className="course-panel-toolbar" align="center" gap={14} wrap>
				<Input.Search
					className="course-search"
					placeholder="搜索课程"
					allowClear
					value={keyword}
					onSearch={handleSearch}
					onChange={handleChange}
				/>
				<Button type="primary" shape="round" icon={<PlusOutlined />} onClick={handleAddCourse}>
					添加课程
				</Button>
			</Flex>

			<List
				className="course-list"
				grid={{ gutter: 18, column: courseColumns }}
				dataSource={CourseStore.courseList}
				locale={{
					emptyText: (
						<div className="course-empty-wrap">
							<Empty description="暂无课程数据" />
						</div>
					),
				}}
				renderItem={(course) => (
					<List.Item>
						<CourseCard title={course.title} teacher={course.teacher} onClick={() => handleOpenCourseDetail(course.id)} />
					</List.Item>
				)}
			/>
		</>
	);
});

export default MyCoursesTabContent;
