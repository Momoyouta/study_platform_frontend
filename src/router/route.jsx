import { lazy } from 'react';

const routes = [
    {
        path: '/',
        component: lazy(() => import('../pages/Home/index.jsx')),
    },
    {
        path: '/login',
        component: lazy(() => import('../pages/Login/index.jsx')),
    },
    {
        path: '/applySchool',
        component: lazy(() => import('../pages/Login/applySchool.tsx')),
    },
];

export default routes;
