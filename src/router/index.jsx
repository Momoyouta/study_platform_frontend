import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import routesConfig from '../config/route';
import { Suspense } from 'react';

// 转换路由配置以适配 createBrowserRouter
const formatRoutesForBrowser = (routes) => {
  return routes.map(({ path, component: Component }) => ({
    path,
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Component />
      </Suspense>
    ),
  }));
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: formatRoutesForBrowser(routesConfig),
  },
]);

export default router;
