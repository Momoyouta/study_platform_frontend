import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Radio, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, ReadOutlined, TeamOutlined, SafetyCertificateOutlined, IdcardOutlined, SafetyOutlined, MobileOutlined } from '@ant-design/icons';
import Store from "@/store/index.ts";
import { login, register } from "@/http/api.ts";
import loginBanner from "@/assets/login/login-banner.png";
import 'animate.css';
import './index.less';
import { ROLE_MAP } from "@/type/map.js";

const Login = observer(() => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // 'login', 'roleSelect', 'register'
    const [viewMode, setViewMode] = useState('login');
    const [selectedRole, setSelectedRole] = useState(null);

    const onLoginFinish = async (values) => {
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

    const onRegisterFinish = async (values) => {
        try {
            setLoading(true);
            const { name, sex, account, password, code, inviteCode } = values;
            
            const payload = {
                name,
                role_id: selectedRole,
                sex,
                account,
                password,
                code,
                inviteCode
            };

            const res = await register(payload);

            if (res.code === 200 || res.code === 0) {
                message.success('注册成功');
                if (res.data) Store.UserStore.setUserInfo(res.data);

                if (res.token || res.data?.token) {
                    Store.UserStore.setToken(res.token || res.data.token);
                }

                navigate('/');
            } else {
                message.error(res.msg || '注册失败');
            }
        } catch (error) {
            console.error('Register error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSelect = (role) => {
        if (role === 'school') {
            navigate('/applySchool');
        } else {
            setSelectedRole(role);
            setViewMode('register');
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
            <div className={`login-right ${viewMode !== 'login' ? 'bg-base' : ''}`}>
                {viewMode === 'login' && (
                    <div className="login-form-wrapper animate__animated animate__fadeIn">
                        <div className="login-header">
                            <h2>用户登录</h2>
                            <p>请输入您的账号和密码进行登录</p>
                        </div>
                        <Form
                            name="login"
                            onFinish={onLoginFinish}
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
                                <a href="#" onClick={(e) => { e.preventDefault(); setViewMode('roleSelect'); }}>注册账号</a>
                            </div>
                        </Form>
                    </div>
                )}

                {viewMode === 'roleSelect' && (
                    <div className="role-select-wrapper">
                        <div className="login-header animate__animated animate__fadeInRight">
                            <h2>选择账号类型</h2>
                            <p>请选择您要注册的身份</p>
                        </div>
                        <div className="role-cards">
                            <div className="role-card animate__animated animate__fadeInRight" style={{ animationDelay: '0.1s' }} onClick={() => handleRoleSelect('school')}>
                                <div className="role-icon"><BankOutlined /></div>
                                <div className="role-info">
                                    <h3>学校申请</h3>
                                    <p>注册一个学校账号，统一管理师生，为他们提供独特的教学课程</p>
                                </div>
                            </div>
                            <div className="role-card animate__animated animate__fadeInRight" style={{ animationDelay: '0.2s' }} onClick={() => handleRoleSelect(ROLE_MAP.STUDENT)}>
                                <div className="role-icon"><ReadOutlined /></div>
                                <div className="role-info">
                                    <h3>我是学生</h3>
                                    <p>注册一个学生账号，通过邀请码加入你的学校，享受在线学习服务</p>
                                </div>
                            </div>
                            <div className="role-card animate__animated animate__fadeInRight" style={{ animationDelay: '0.3s' }} onClick={() => handleRoleSelect(ROLE_MAP.TEACHER)}>
                                <div className="role-icon"><TeamOutlined /></div>
                                <div className="role-info">
                                    <h3>我是老师</h3>
                                    <p>注册一个教师账号，通过邀请码加入你的学校，享受在线学习服务</p>
                                </div>
                            </div>
                        </div>
                        <div className="back-login animate__animated animate__fadeInRight" style={{ animationDelay: '0.4s' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setViewMode('login'); }}>返回登录</a>
                        </div>
                    </div>
                )}

                {viewMode === 'register' && (
                    <div className="register-form-wrapper animate__animated animate__fadeInRight">
                        <div className="login-header">
                            <h2>注册账号</h2>
                            <p>{selectedRole === ROLE_MAP.STUDENT ? '学生注册' : '教师注册'}</p>
                        </div>
                        <Form
                            name="register"
                            onFinish={onRegisterFinish}
                            size="large"
                            layout="vertical"
                            initialValues={{ sex: true }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="name"
                                        rules={[{ required: true, message: '请输入姓名!' }]}
                                    >
                                        <Input prefix={<IdcardOutlined />} placeholder="请输入姓名" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="sex"
                                        rules={[{ required: true, message: '请选择性别!' }]}
                                    >
                                        <Radio.Group style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
                                            <Radio value={true}>男</Radio>
                                            <Radio value={false}>女</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Form.Item
                                name="account"
                                rules={[{ required: true, message: '请输入手机号!' }]}
                            >
                                <Input prefix={<MobileOutlined />} placeholder="请输入手机号(作为账号)" />
                            </Form.Item>
                            
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: '请输入密码!' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: '请确认密码!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('两次输入的密码不一致!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
                            </Form.Item>

                            <Form.Item
                                name="code"
                                rules={[{ required: true, message: '请输入验证码!' }]}
                            >
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Input prefix={<SafetyOutlined />} placeholder="请输入验证码" />
                                    <Button>发送验证码</Button>
                                </div>
                            </Form.Item>

                            <Form.Item
                                name="inviteCode"
                                rules={[{ required: true, message: '请输入学校邀请码!' }]}
                            >
                                <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入学校邀请码" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" className="login-button" loading={loading} block>
                                    立即注册
                                </Button>
                            </Form.Item>
                            <div className="back-login">
                                <a href="#" onClick={(e) => { e.preventDefault(); setViewMode('roleSelect'); }}>返回上一步</a>
                            </div>
                        </Form>
                    </div>
                )}

                <div className="login-footer">
                    <p>© 2026 在线学习平台 版权所有</p>
                </div>
            </div>
        </div>
    );
});

export default Login;
