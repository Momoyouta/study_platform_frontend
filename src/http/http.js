import axios from 'axios';
import { message } from 'antd';
import Store from '@/store/index.ts';
import router from '@/router/index.jsx';

// 创建 axios 实例
const instance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器：自动注入 token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器：统一处理错误
instance.interceptors.response.use(
    (response) => {
        // 直接返回 data，简化调用方代码
        return response.data;
    },
    (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.msg;

        if (status === 401) {
            // 未授权：清除 token 并跳转到登录页
            Store.UserStore.clearToken();
            router.navigate('/login');
            message.error(msg || '登录已过期，请重新登录');
        } else if (status === 403) {
            message.error(msg || '没有权限访问该资源');
        } else if (status === 404) {
            message.error(msg || '请求的资源不存在');
        } else if (status === 500) {
            message.error(msg || '服务器内部错误，请稍后重试');
        } else {
            message.error(msg || '请求失败，请稍后重试');
        }

        return Promise.reject(error);
    }
);

/**
 * GET 请求
 * @param {string} url
 * @param {object} params - 查询参数
 * @param {object} config - 额外 axios 配置
 */
export const get = (url, params = {}, config = {}) => {
    return instance.get(url, { params, ...config });
};

/**
 * POST 请求
 * @param {string} url
 * @param {object} data - 请求体
 * @param {object} config - 额外 axios 配置
 */
export const post = (url, data = {}, config = {}) => {
    return instance.post(url, data, config);
};

/**
 * PUT 请求
 * @param {string} url
 * @param {object} data - 请求体
 * @param {object} config - 额外 axios 配置
 */
export const put = (url, data = {}, config = {}) => {
    return instance.put(url, data, config);
};

/**
 * DELETE 请求
 * @param {string} url
 * @param {object} config - 额外 axios 配置
 */
export const del = (url, config = {}) => {
    return instance.delete(url, config);
};

export default instance;

