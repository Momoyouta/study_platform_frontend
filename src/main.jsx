import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.jsx'
import './index.css'
import { jwtAuth } from './http/api.ts'
import Store from './store/index.ts'
const init = async () => {
  const token = localStorage.getItem('access_token');
  const pathname = window.location.pathname;
  const publicPaths = ['/login', '/applySchool'];
  const isPublicPage = publicPaths.includes(pathname);
  const isLoginPage = pathname === '/login';

  if (!token) {
    // 无 token 且不在公开页，重定向到登录页
    if (!isPublicPage) {
      window.location.href = '/login';
      return;
    }
  } else {
    try {
      // 有 token，向后端校验
      const res = await jwtAuth(localStorage.getItem('access_token') || '');
      if (!(res.code === 200 || res.code === 0)) {
        throw new Error(res.msg || 'JWT 校验失败');
      }

      const valid = res?.data?.valid;
      if (valid === false) {
        throw new Error('JWT 已失效');
      }

      Store.UserStore.applyAuthResponse(res, { keepToken: true });
      // 校验成功：如果在登录页则跳转到首页
      if (isLoginPage) {
        window.location.href = '/';
        return;
      }
    } catch (error) {
      // 校验失败：清除 token
      Store.UserStore.clearAuth();
      // 如果不在公开页则跳转到登录页
      if (!isPublicPage) {
        window.location.href = '/login';
        return;
      }
    }
  }

  // 校验完成后（或无需跳转时）再渲染页面
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

init();