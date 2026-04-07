import type { ChangeEvent } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { Button, Empty, Flex, Grid, Input, List, message, Modal, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/index';
import { ROLE_MAP } from '../../type/map.js';
import { joinCourseByInviteCode, createCourse } from '../../http/api';
import CourseCard from '../../components/CourseCard/CourseCard.jsx';
import './MyCoursesTabContent.less';
import { toViewFileUrl } from '@/utils/fileUrl';

const { useBreakpoint } = Grid;

interface MyCoursesTabContentProps {
	mode?: 'teaching' | 'created';
}

const MyCoursesTabContent = observer(({ mode = 'teaching' }: MyCoursesTabContentProps) => {
	const { CourseStore, UserStore, StudentStore, TeacherStore } = useStore();
	const [keyword, setKeyword] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [form] = Form.useForm();
	const [createForm] = Form.useForm();
	const screens = useBreakpoint();
	const navigate = useNavigate();

	const isTeacher = UserStore.role === ROLE_MAP.TEACHER;
	const isStudent = UserStore.role === ROLE_MAP.STUDENT;

	const refreshList = (searchVal?: string) => {
		const currentKeyword = searchVal !== undefined ? searchVal : keyword;
		if (isTeacher) {
			if (mode === 'created') {
				CourseStore.fetchMyCreatedCourses({
					page: 1,
					pageSize: 10,
					school_id: TeacherStore.schoolId,
					keyword: currentKeyword
				});
			} else {
				CourseStore.fetchTeacherCourses({
					page: 1,
					pageSize: 10,
					teacher_id: TeacherStore.teacherId,
					school_id: TeacherStore.schoolId,
					keyword: currentKeyword
				});
			}
		} else {
			CourseStore.fetchStudentCourses({
				page: 1,
				pageSize: 10,
				student_id: StudentStore.studentId,
				school_id: StudentStore.schoolId,
				keyword: currentKeyword
			});
		}
	};

	useEffect(() => {
		refreshList();
	}, [CourseStore, UserStore.role, StudentStore.studentId, TeacherStore.teacherId, StudentStore.schoolId, TeacherStore.schoolId, mode]);

	const courseColumns = useMemo(() => {
		if (screens.xxl) return 4;
		if (screens.lg) return 3;
		if (screens.md) return 2;
		return 1;
	}, [screens.xxl, screens.lg, screens.md]);

	const handleSearch = (value: string) => {
		setKeyword(value);
		refreshList(value);
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value;
		setKeyword(val);
		// fetchCourseList only searches locally, refreshList searches from API
		// For consistency with other tabs, use refreshList if we want server-side search
	};

	const handleAction = () => {
		if (isTeacher) {
			setIsCreateModalOpen(true);
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

	const handleCreate = async (values: { name: string }) => {
		setSubmitting(true);
		try {
			const res: any = await createCourse(values);
			if (res?.code === 200) {
				message.success('创建课程成功');
				setIsCreateModalOpen(false);
				createForm.resetFields();
				const next = new URLSearchParams({
					courseId: String(res.data.course_id || ''),
					createId: String(TeacherStore.teacherId || ''),
					schoolId: String(TeacherStore.schoolId || ''),
				});

				CourseStore.resolveCourseParams({
					courseId: String(res.data.course_id || ''),
					createId: String(TeacherStore.teacherId || ''),
					schoolId: String(TeacherStore.schoolId || ''),
					teachingGroupId: '',
				});

				// 直接跳转到详情页的 task (默认) 页，并带上创建者 ID，方便权限判断
				navigate(`/courseDetail?${next.toString()}`);
			}
		} catch (error) {
			console.error('Failed to create course', error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenCourseDetail = (course: any) => {
		const cid = course.create_id || course.creator_id || '';
		const teachingGroupId = String(course.group_id || course.teaching_group_id || '');

		const next = new URLSearchParams({
			courseId: String(course.course_id || ''),
			createId: String(cid || ''),
			schoolId: String(course.school_id || ''),
		});

		if (teachingGroupId) {
			next.set('teachingGroupId', teachingGroupId);
		}

		CourseStore.resolveCourseParams({
			courseId: String(course.course_id || ''),
			createId: String(cid || ''),
			schoolId: String(course.school_id || ''),
			teachingGroupId,
		});

		navigate(`/courseDetail?${next.toString()}`);
	};

	const dataSource = useMemo(() => {
		if (isTeacher) {
			return mode === 'created' ? CourseStore.createdList : CourseStore.teachingList;
		}
		return CourseStore.studentList;
	}, [isTeacher, mode, CourseStore.createdList, CourseStore.teachingList, CourseStore.studentList]);

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
				dataSource={dataSource}
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
							teacher={course.teacher_names?.map((t: any) => t.name || t).join(', ') || '未知教师'} 
							status={course.status}
							onClick={() => handleOpenCourseDetail(course)} 
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
					destroyOnHidden
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

			{isTeacher && (
				<Modal
					title="创建课程"
					open={isCreateModalOpen}
					onCancel={() => setIsCreateModalOpen(false)}
					onOk={() => createForm.submit()}
					confirmLoading={submitting}
					destroyOnClose
				>
					<Form form={createForm} onFinish={handleCreate} layout="vertical">
						<Form.Item
							name="name"
							label="课程名称"
							rules={[{ required: true, message: '请输入课程名称' }]}
						>
							<Input placeholder="请输入待创建的课程名称" />
						</Form.Item>
					</Form>
				</Modal>
			)}
		</>
	);
});

export default MyCoursesTabContent;
