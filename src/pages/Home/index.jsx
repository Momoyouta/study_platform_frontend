import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, List, Progress, Space, Tag, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ROLE_MAP } from '@/type/map.js';
import {
	getStudentStatisticsContinueLearning,
	getStudentStatisticsMyCourses,
	getStudentStatisticsTodoAssignments,
	getTeacherStatisticsTodo,
} from '@/http/api';
import StatsCard from '@/components/Statistics/StatsCard';
import {
	createLatestRequestGuard,
	formatRemainSeconds,
	formatUnixTime,
	mergeStatisticsQueryParams,
	normalizeArrayData,
	normalizeNullableData,
	parseStatisticsErrorMessage,
	readStatisticsQueryParamsFromSearch,
} from '@/utils/statistics';
import './index.less';

const { Paragraph, Text, Title } = Typography;

const Home = observer(() => {
	const { UserStore } = useStore();
	const location = useLocation();
	const navigate = useNavigate();
	const isTeacher = UserStore.role === ROLE_MAP.TEACHER;
	const queryFromUrl = useMemo(() => {
		return readStatisticsQueryParamsFromSearch(location.search);
	}, [location.search]);
	const statisticsQuery = useMemo(() => {
		return mergeStatisticsQueryParams(queryFromUrl);
	}, [queryFromUrl]);

	const teacherGuardRef = useRef(createLatestRequestGuard());
	const studentGuardRef = useRef(createLatestRequestGuard());

	const [teacherTodoLoading, setTeacherTodoLoading] = useState(false);
	const [teacherTodoError, setTeacherTodoError] = useState('');
	const [pendingReviewCount, setPendingReviewCount] = useState(0);

	const [studentLoading, setStudentLoading] = useState(false);
	const [studentError, setStudentError] = useState('');
	const [myCourses, setMyCourses] = useState([]);
	const [continueLearning, setContinueLearning] = useState(null);
	const [todoAssignments, setTodoAssignments] = useState([]);

	useEffect(() => {
		if (!isTeacher) {
			return;
		}

		const timer = window.setTimeout(async () => {
			const requestId = teacherGuardRef.current.next();
			setTeacherTodoLoading(true);
			setTeacherTodoError('');

			try {
				const response = await getTeacherStatisticsTodo(statisticsQuery);
				if (!teacherGuardRef.current.isLatest(requestId)) {
					return;
				}

				if (response?.code !== 200) {
					setTeacherTodoError(response?.msg || '获取教师待办失败');
					setPendingReviewCount(0);
					return;
				}

				const data = normalizeNullableData(response?.data, { pendingReviewCount: 0 });
				setPendingReviewCount(Number(data.pendingReviewCount || 0));
			} catch (error) {
				if (!teacherGuardRef.current.isLatest(requestId)) {
					return;
				}
				setTeacherTodoError(parseStatisticsErrorMessage(error, '获取教师待办失败'));
				setPendingReviewCount(0);
			} finally {
				if (teacherGuardRef.current.isLatest(requestId)) {
					setTeacherTodoLoading(false);
				}
			}
		}, 180);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isTeacher, statisticsQuery]);

	useEffect(() => {
		if (isTeacher) {
			return;
		}

		const timer = window.setTimeout(async () => {
			const requestId = studentGuardRef.current.next();
			setStudentLoading(true);
			setStudentError('');

			try {
				const [myCoursesRes, continueRes, todoRes] = await Promise.all([
					getStudentStatisticsMyCourses(statisticsQuery),
					getStudentStatisticsContinueLearning(statisticsQuery),
					getStudentStatisticsTodoAssignments(statisticsQuery),
				]);

				if (!studentGuardRef.current.isLatest(requestId)) {
					return;
				}

				if (myCoursesRes?.code !== 200 || continueRes?.code !== 200 || todoRes?.code !== 200) {
					setStudentError(
						myCoursesRes?.msg
						|| continueRes?.msg
						|| todoRes?.msg
						|| '获取学生统计失败',
					);
					setMyCourses([]);
					setContinueLearning(null);
					setTodoAssignments([]);
					return;
				}

				setMyCourses(normalizeArrayData(myCoursesRes?.data));
				setContinueLearning(normalizeNullableData(continueRes?.data, null));
				setTodoAssignments(normalizeArrayData(todoRes?.data));
			} catch (error) {
				if (!studentGuardRef.current.isLatest(requestId)) {
					return;
				}
				setStudentError(parseStatisticsErrorMessage(error, '获取学生统计失败'));
				setMyCourses([]);
				setContinueLearning(null);
				setTodoAssignments([]);
			} finally {
				if (studentGuardRef.current.isLatest(requestId)) {
					setStudentLoading(false);
				}
			}
		}, 180);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isTeacher, statisticsQuery]);

	if (isTeacher) {
		return (
			<section className="home-statistics-page">
				<Title level={4} className="home-statistics-title">待办工作台</Title>
				<div className="home-card-grid single">
					<StatsCard
						title="待批改作业/试卷"
						loading={teacherTodoLoading}
						error={teacherTodoError}
						empty={!teacherTodoLoading && !teacherTodoError && pendingReviewCount <= 0}
						emptyDescription="当前没有待批改任务"
					>
						<div className="todo-highlight-card">
							<div className="todo-highlight-value">{pendingReviewCount}</div>
							<Paragraph className="todo-highlight-desc">
								当前待批改数量，已按教学权限过滤。
							</Paragraph>
							<Button type="primary" onClick={() => navigate('/course')}>去课程处理</Button>
						</div>
					</StatsCard>
				</div>
			</section>
		);
	}

	const openCourse = (courseId) => {
		const next = new URLSearchParams();
		if (courseId) {
			next.set('courseId', String(courseId));
		}
		const query = next.toString();
		navigate(query ? `/courseDetail/chapter?${query}` : '/course');
	};

	return (
		<section className="home-statistics-page">
			<Title level={4} className="home-statistics-title">个人学习中心</Title>

			{studentError ? (
				<div className="home-global-error">{studentError}</div>
			) : null}

			<div className="home-card-grid">
				<StatsCard
					title="我的课程"
					loading={studentLoading}
					empty={!studentLoading && myCourses.length === 0}
					emptyDescription="暂无课程进度数据"
				>
					<List
						dataSource={myCourses}
						renderItem={(course) => {
							const progress = Math.round(Number(course.progressPercent || 0));
							return (
								<List.Item key={course.courseId} className="home-list-item">
									<div className="home-list-main">
										<Text strong>{course.courseName || '未命名课程'}</Text>
										<Progress percent={progress} size="small" />
									</div>
									<Button type="link" onClick={() => openCourse(course.courseId)}>
										进入课程
									</Button>
								</List.Item>
							);
						}}
					/>
				</StatsCard>

				<StatsCard
					title="继续学习"
					loading={studentLoading}
					empty={!studentLoading && !continueLearning}
					emptyDescription="暂无最近学习记录"
				>
					<div className="continue-learning-card">
						<Text strong className="continue-course-name">{continueLearning?.courseName || '未命名课程'}</Text>
						<Text type="secondary" className="continue-lesson-name">{continueLearning?.lessonName || '-'}</Text>
						<Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>最近学习：{formatUnixTime(continueLearning?.lastLearnTime)}</Text>
						<Button
							type="primary"
							disabled={!continueLearning}
							style={{ marginTop: '16px' }}
							onClick={() => openCourse(continueLearning?.courseId || statisticsQuery.courseId || myCourses[0]?.courseId)}
						>
							继续学习
						</Button>
					</div>
				</StatsCard>

				<StatsCard
					title="待办作业与截止日期"
					loading={studentLoading}
					empty={!studentLoading && todoAssignments.length === 0}
					emptyDescription="当前没有待办作业"
				>
					<List
						dataSource={todoAssignments}
						renderItem={(item) => {
							return (
								<List.Item key={item.assignmentId} className="home-list-item">
									<div className="home-list-main">
										<Space split={<Text type="secondary">|</Text>} wrap>
											<Text strong>{item.title || '未命名作业'}</Text>
											<Text type="secondary" style={{ fontSize: '12px' }}>{item.courseName || '-'}</Text>
										</Space>
										<Space style={{ marginTop: '4px' }}>
											<Tag color="processing">{formatRemainSeconds(Number(item.remainSeconds || 0))}</Tag>
											<Text type="secondary">截止：{formatUnixTime(item.deadline)}</Text>
										</Space>
									</div>
								</List.Item>
							);
						}}
					/>
				</StatsCard>
			</div>
		</section>
	);
});

export default Home;
