import type { ChangeEvent } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { Button, Empty, Flex, Grid, Input, List, message, Modal, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import { ROLE_MAP } from '../../type/map.js';
import { joinCourseByInviteCode } from '../../http/api';
import CourseCard from '../../components/CourseCard/CourseCard.jsx';
import './MyCoursesTabContent.less';
import { toViewFileUrl } from '@/utils/fileUrl';

const { useBreakpoint } = Grid;

const MyCoursesTabContent = observer(() => {
	const { CourseStore, UserStore, StudentStore, TeacherStore } = useStore();
	const [keyword, setKeyword] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [form] = Form.useForm();
	const screens = useBreakpoint();
	const navigate = useNavigate();

	const isTeacher = UserStore.role === ROLE_MAP.TEACHER;
	const isStudent = UserStore.role === ROLE_MAP.STUDENT;

	const refreshList = () => {
		if (isTeacher) {
			CourseStore.fetchTeacherCourses({
				page: 1,
				pageSize: 10,
				teacher_id: TeacherStore.teacherId,
				school_id: TeacherStore.schoolId
			});
		} else {
			CourseStore.fetchStudentCourses({
				page: 1,
				pageSize: 10,
				student_id: StudentStore.studentId,
				school_id: StudentStore.schoolId
			});
		}
	};

	useEffect(() => {
		refreshList();
	}, [CourseStore, UserStore.role, StudentStore.studentId, TeacherStore.teacherId, StudentStore.schoolId, TeacherStore.schoolId]);

	const courseColumns = useMemo(() => {
		if (screens.xxl) return 4;
		if (screens.lg) return 3;
		if (screens.md) return 2;
		return 1;
	}, [screens.xxl, screens.lg, screens.md]);

	const handleSearch = (value: string) => {
		setKeyword(value);
		CourseStore.fetchCourseList({ keyword: value });
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value;
		setKeyword(val);
		CourseStore.fetchCourseList({ keyword: val });
	};

	const handleAction = () => {
		if (isTeacher) {
			message.info('创建课程功能暂未开放');
		} else {
			setIsModalOpen(true);
		}
	};

	const handleJoin = async (values: { code: string }) => {
		setSubmitting(true);
		try {
			const res: any = await joinCourseByInviteCode(values);
			if (res?.code === 200) {
				message.success('加入课程成功');
				setIsModalOpen(false);
				form.resetFields();
				refreshList();
			}
		} catch (error) {
			console.error('Failed to join course', error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenCourseDetail = (courseId: string) => {
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
				<Button type="primary" shape="round" icon={<PlusOutlined />} onClick={handleAction}>
					{isTeacher ? '创建课程' : '添加课程'}
				</Button>
			</Flex>

			<List
				className="course-list"
				grid={{ gutter: 18, column: courseColumns }}
				dataSource={CourseStore.list}
				loading={CourseStore.loading}
				locale={{
					emptyText: (
						<div className="course-empty-wrap">
							<Empty description="暂无课程数据" />
						</div>
					),
				}}
				renderItem={(course: any) => (
					<List.Item>
						<CourseCard 
							title={course.name} 
							imgSrc={toViewFileUrl(course.cover_img)}
							teacher={course.teacher_names?.join(', ') || '未知教师'} 
							onClick={() => handleOpenCourseDetail(course.course_id)} 
						/>
					</List.Item>
				)}
			/>

			{isStudent && (
				<Modal
					title="添加课程"
					open={isModalOpen}
					onCancel={() => setIsModalOpen(false)}
					onOk={() => form.submit()}
					confirmLoading={submitting}
					destroyOnClose
				>
					<Form form={form} onFinish={handleJoin} layout="vertical">
						<Form.Item
							name="code"
							label="邀请码"
							rules={[{ required: true, message: '请输入邀请码' }]}
						>
							<Input placeholder="请输入课程邀请码" />
						</Form.Item>
					</Form>
				</Modal>
			)}
		</>
	);
});

export default MyCoursesTabContent;
