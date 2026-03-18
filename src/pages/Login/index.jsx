import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Store from "@/store/index.ts";
import { login } from "@/http/api.ts";
import loginBanner from "@/assets/login/login-banner.png";
import 'animate.css';
import './index.less';

const Login = observer(() => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const { account, pwd } = values;
            const res = await login(account, pwd);

            if (res.code === 200 || res.code === 0) {
                message.success('登录成功');
                Store.UserStore.setUserInfo(res.data);

                if (res.token || res.data?.token) {
                    Store.UserStore.setToken(res.token || res.data.token);
                }

                navigate('/');
            } else {
                message.error(res.msg || '登录失败');
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-bg-mask"></div>
                <img src={loginBanner} alt="banner" className="login-banner-bg" />
                <div className="login-text-content">
                    <h1 className="animate__animated animate__fadeIn">欢迎来到</h1>
                    <h2 className="animate__animated animate__fadeInLeft">在线学习平台</h2>
                    <p className="animate__animated animate__fadeInRight">探索知识的无限可能，成就更好的自己。</p>
                </div>
            </div>
            <div className="login-right">
                <div className="login-form-wrapper">
                    <div className="login-header">
                        <h2>用户登录</h2>
                        <p>请输入您的账号和密码进行登录</p>
                    </div>
                    <Form
                        name="login"
                        onFinish={onFinish}
                        size="large"
                        layout="vertical"
                    >
                        <Form.Item
                            name="account"
                            rules={[{ required: true, message: '请输入账号!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="请输入账号" />
                        </Form.Item>
                        <Form.Item
                            name="pwd"
                            rules={[{ required: true, message: '请输入密码!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" className="login-button" loading={loading} block>
                                立即登录
                            </Button>
                        </Form.Item>
                        <div className="login-links">
                            <a href="#" onClick={(e) => e.preventDefault()}>忘记密码？</a>
                            <a href="#" onClick={(e) => e.preventDefault()}>注册账号</a>
                        </div>
                    </Form>
                </div>
                <div className="login-footer">
                    <p>© 2026 在线学习平台 版权所有</p>
                </div>
            </div>
        </div>
    );
});

export default Login;
