import { lazy } from 'react';

const CourseDetailPage = lazy(() => import('../pages/CourseDetail/index.jsx'));

const routes = [
    {
        path: '/login',
        component: lazy(() => import('../pages/Login/index.jsx')),
    },
    {
        path: '/applySchool',
        component: lazy(() => import('../pages/Login/applySchool.tsx')),
    },
    {
        path: '/',
        component: lazy(() => import('../layouts/DashboardLayout/index.jsx')),
        children: [
            {
                index: true,
                component: lazy(() => import('../pages/Course/index.jsx')),
            },
            {
                path: 'course',
                component: lazy(() => import('../pages/Course/index.jsx')),
            },
            {
                path: 'courseDetail',
                component: CourseDetailPage,
            },
            {
                path: 'courseDetail/chapter',
                component: CourseDetailPage,
            },
            {
                path: 'courseDetail/homework',
                component: CourseDetailPage,
            },
            {
                path: 'courseDetail/materials',
                component: CourseDetailPage,
            },
            {
                path: 'courseDetail/studyRecord',
                component: CourseDetailPage,
            },
            {
                path: 'courseDetail/teachingGroup',
                component: CourseDetailPage,
            },
            {
                path: 'resource-plaza',
                component: lazy(() => import('../pages/ResourcePlaza/index.jsx')),
            },
            {
                path: 'stats',
                component: lazy(() => import('../pages/PersonalStats/index.jsx')),
            },
            {
                path: 'account',
                component: lazy(() => import('../pages/AccountManage/index.jsx')),
            },
        ],
    },
];

export default routes;
