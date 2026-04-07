import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { updatePassword } from '@/http/api';
import './PasswordTabContent.less';

const ensureSuccess = (response: any, fallbackMsg: string) => {
    if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
        throw new Error(response?.msg || fallbackMsg);
    }
    return response?.data ?? response;
};

const PasswordTabContent = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
        if (values.oldPassword === values.newPassword) {
            message.warning('新密码不能与旧密码相同');
            return;
        }

        setLoading(true);
        try {
            const res = await updatePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            ensureSuccess(res, '修改密码失败');
            message.success('密码修改成功');
            form.resetFields();
        } catch (error: any) {
            console.error('Update password failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="account-password-tab">
            <Form
                form={form}
                layout="vertical"
                className="account-password-form"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label="旧密码"
                    name="oldPassword"
                    rules={[
                        { required: true, message: '请输入旧密码' },
                        { min: 6, message: '密码长度至少 6 位' },
                    ]}
                >
                    <Input.Password placeholder="请输入旧密码" />
                </Form.Item>

                <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码长度至少 6 位' },
                    ]}
                    extra="密码长度至少 6 位，建议使用数字与字母组合"
                >
                    <Input.Password placeholder="请输入新密码" />
                </Form.Item>

                <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: '请再次输入新密码' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('两次输入的新密码不一致'));
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="请再次输入新密码" />
                </Form.Item>

                <Form.Item className="account-password-submit-wrap">
                    <Button type="primary" htmlType="submit" loading={loading} className="account-password-submit">
                        确认修改
                    </Button>
                </Form.Item>
            </Form>
        </section>
    );
};

export default PasswordTabContent;
