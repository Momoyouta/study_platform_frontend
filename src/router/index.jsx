import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import routes from './route';
import { Suspense } from 'react';

/**
 * 递归转换路由配置以适配 createBrowserRouter
 * 支持嵌套子路由
 */
const formatRoutesForBrowser = (routes) => {
  return routes.map((route) => {
    const { path, component: Component, children, index } = route;
    const formatted = {
      element: (
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      ),
    };

    if (index) {
      formatted.index = true;
    } else {
      formatted.path = path;
    }

    if (children && children.length > 0) {
      formatted.children = formatRoutesForBrowser(children);
    }

    return formatted;
  });
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: formatRoutesForBrowser(routes),
  },
]);

export default router;
