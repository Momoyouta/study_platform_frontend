import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.jsx'
import './index.css'
import { jwtAuth } from './http/api.ts'
import Store from './store/index.ts'
import { message } from 'antd';
const init = async () => {
  const businessToken = localStorage.getItem('access_token');
  const pendingToken = localStorage.getItem('pending_token');
  const pathname = window.location.pathname;
  const publicPaths = ['/login', '/applySchool'];
  const isPublicPage = publicPaths.includes(pathname);
  const isLoginPage = pathname === '/login';

  if (businessToken) {
    try {
      // 业务 token 按既有链路保留 jwtAuth 校验
      const res = await jwtAuth(businessToken);
      if (!(res.code === 200 || res.code === 0)) {
        throw new Error(res.msg || 'JWT 校验失败');
      }

      const valid = res?.data?.valid;
      if (valid === false) {
        throw new Error('JWT 已失效');
      }

      Store.UserStore.applyAuthResponse(res, { keepToken: true });
      // 已完成业务登录态时，访问登录页会重定向到首页
      if (isLoginPage && Store.UserStore.hasBusinessSession) {
        window.location.href = '/';
        return;
      }
    } catch (error) {
      message.error('登录已过期，请重新登录');
      Store.UserStore.clearAuth();
      if (!isPublicPage) {
        window.location.href = '/login';
        return;
      }
    }
  } else if (pendingToken) {
    // 待选校会话仅允许停留在登录页
    if (!isLoginPage) {
      window.location.href = '/login';
      return;
    }

    if (!Store.UserStore.hasPendingSession) {
      Store.UserStore.setPendingToken(pendingToken);
    }

    if ((Store.UserStore.availableSchools || []).length === 0) {
      try {
        await Store.UserStore.fetchAuthSchools();
      } catch (_error) {
        // 学校列表拉取失败不阻塞渲染，交由登录页重试
      }
    }
  } else {
    // 无任何会话，非公开页统一回登录
    if (!isPublicPage) {
      window.location.href = '/login';
      return;
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