import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { ROLE_MAP } from '@/type/map.js';
import { Card, Typography } from 'antd';

// 学生端组件
import StudentTask from './student/Task';
import StudentChapter from './student/Chapter';
import StudentStudyRecord from './student/StudyRecord';

// 公共组件 (根据角色内部判断)
import Materials from './Materials';
import Homework from './Homework';

// 教师端分发容器
import TeacherTask from './teacher/Task';
import TeacherChapter from './teacher/Chapter';
import TeacherTeachingGroup from './teacher/TeachingGroup';

import './index.less';

const { Paragraph, Title, Text } = Typography;

const sectionMap = {
	task: '任务',
	chapter: '章节',
	homework: '作业',
	materials: '资料',
	studyRecord: '学习记录',
	teachingGroup: '教学组',
};

const getSectionKey = (pathname: string) => {
	if (pathname === '/courseDetail' || pathname === '/courseDetail/') return 'task';
	const restPath = pathname.replace('/courseDetail/', '');
	const [firstSegment] = restPath.split('/');
	return sectionMap[firstSegment as keyof typeof sectionMap] ? firstSegment : 'task';
};

const CourseDetail = observer(() => {
	const location = useLocation();
	const { UserStore, CourseStore } = useStore();
	const searchParams = new URLSearchParams(location.search);
	const urlCourseId = searchParams.get('courseId') || '';
	const urlCreateId = searchParams.get('createId');
	const urlSchoolId = searchParams.get('schoolId');
    const urlTeachingGroupId = searchParams.get('teachingGroupId');

	useEffect(() => {
		if (!urlCourseId) return;

		// 1. 初始化基础参数
		CourseStore.resolveCourseParams({ 
			courseId: urlCourseId, 
			createId: urlCreateId, 
            schoolId: urlSchoolId,
            teachingGroupId: urlTeachingGroupId,
		});

		// 2. 只有在教师模式下才需要获取课程信息和权威判定
		if (UserStore.role === ROLE_MAP.TEACHER) {
			CourseStore.fetchCourseBaseInfo(urlCourseId);
		}
    }, [urlCourseId, urlCreateId, urlSchoolId, urlTeachingGroupId, UserStore.role, CourseStore]);

	const courseId = CourseStore.currentCourseId;
	const creatorId = CourseStore.currentCreateId;
	const schoolId = CourseStore.currentSchoolId;
	const sectionKey = getSectionKey(location.pathname);
	const sectionLabel = sectionMap[sectionKey as keyof typeof sectionMap];

	const isTeacher = UserStore.role === ROLE_MAP.TEACHER;

	const renderContent = () => {
		if (isTeacher) {
			// ==== 教师端视图 ====
			if (sectionKey === 'task') {
				return <TeacherTask courseId={courseId} creatorId={creatorId} />;
			}
			if (sectionKey === 'chapter') {
				return <TeacherChapter courseId={courseId} creatorId={creatorId} />;
			}
			if (sectionKey === 'teachingGroup') {
				return <TeacherTeachingGroup courseId={courseId} creatorId={creatorId} schoolId={schoolId} />;
			}
            if (sectionKey === 'materials') {
                return <Materials />;
            }
            if (sectionKey === 'homework') {
                return <Homework courseId={courseId} />;
            }
            // 其余路由暂用占位卡片
            return (
                <Card className="course-detail-card" bordered={false}>
                    <Title className="course-detail-title" level={3}>{sectionLabel}</Title>
                    <Paragraph className="course-detail-desc">
                        当前是课程详情的"{sectionLabel}"页面，后续可在这里接入真实业务模块。
                    </Paragraph>
                    <Text className="course-detail-course-id">
                        当前 courseId: {courseId || '未携带'}
                    </Text>
                </Card>
            );
        }

        // ==== 学生端视图 ====
        if (sectionKey === 'task') {
            return <StudentTask courseId={courseId} />;
        }
        if (sectionKey === 'chapter') {
            return <StudentChapter />;
        }
        if (sectionKey === 'studyRecord') {
            return <StudentStudyRecord courseId={courseId} />;
        }

        if (sectionKey === 'materials') {
            return <Materials />;
        }
        if (sectionKey === 'homework') {
            return <Homework courseId={courseId} />;
        }

        return (
            <Card className="course-detail-card" bordered={false}>
                <Title className="course-detail-title" level={3}>{sectionLabel}</Title>
                <Paragraph className="course-detail-desc">
                    当前是课程详情的"{sectionLabel}"页面，后续可在这里接入真实业务模块。
                </Paragraph>
                <Text className="course-detail-course-id">
                    当前 courseId: {courseId || '未携带'}
                </Text>
            </Card>
        );
    };

    return (
        <section className="course-detail-page">
            {renderContent()}
        </section>
    );
});

export default CourseDetail;
