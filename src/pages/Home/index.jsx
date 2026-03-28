import { useMemo, useState } from 'react';
import { Button, Empty, Flex, Grid, Input, List, Tabs, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CourseCard from '../../components/CourseCard/CourseCard.jsx';
import './index.less';

const { useBreakpoint } = Grid;

const mockCourses = [
	{ id: 1, title: '课程名称', teacher: '教师名称' },
	{ id: 2, title: '课程名称', teacher: '教师名称' },
];

const Course = () => {
	const [keyword, setKeyword] = useState('');
	const screens = useBreakpoint();

	const filteredCourses = useMemo(() => {
		const normalized = keyword.trim();
		if (!normalized) return mockCourses;
		return mockCourses.filter((course) => course.title.includes(normalized));
	}, [keyword]);

	const courseColumns = useMemo(() => {
		if (screens.xxl) return 4;
		if (screens.lg) return 3;
		if (screens.md) return 2;
		return 1;
	}, [screens.xxl, screens.lg, screens.md]);

	const handleSearch = (value) => {
		setKeyword(value);
		message.info('查询接口暂未实现，当前为占位交互。');
	};

	const handleAddCourse = () => {
		message.info('添加课程接口暂未实现，当前为占位交互。');
	};

	const tabItems = [
		{
			key: 'my-courses',
			label: '我学的课',
			children: (
				<>
					<Flex className="course-panel-toolbar" align="center" gap={14} wrap>
						<Input.Search
							className="course-search"
							placeholder="搜索课程"
							allowClear
							onSearch={handleSearch}
							onChange={(event) => setKeyword(event.target.value)}
						/>
						<Button type="primary" shape="round" icon={<PlusOutlined />} onClick={handleAddCourse}>
							添加课程
						</Button>
					</Flex>

					<List
						className="course-list"
						grid={{ gutter: 18, column: courseColumns }}
						dataSource={filteredCourses}
						locale={{
							emptyText: (
								<div className="course-empty-wrap">
									<Empty description="暂无课程数据" />
								</div>
							),
						}}
						renderItem={(course) => (
							<List.Item>
								<CourseCard title={course.title} teacher={course.teacher} />
							</List.Item>
						)}
					/>
				</>
			),
		},
	];



	return (
		<section className="course-panel">
			<Tabs className="course-tabs" defaultActiveKey="my-courses" items={tabItems} />
		</section>
	);
};

export default Course;
