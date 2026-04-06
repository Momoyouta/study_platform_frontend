import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Form, Input, Radio, message } from 'antd';
import Store from '@/store/index';
import { ROLE_MAP } from '@/type/map.js';
import { updateBasic, updatePhone } from '@/http/api';
import './BasicProfileTabContent.less';

const PHONE_REG = /^1\d{10}$/;
const CODE_REG = /^\d{6}$/;

const ensureSuccess = (response: any, fallbackMsg: string) => {
    if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
        throw new Error(response?.msg || fallbackMsg);
    }
    return response?.data ?? response;
};

const patchUser = (patch: { sex?: boolean; phone?: string }) => {
    const userStore = Store.UserStore;
    userStore.setUserFromDto({
        id: userStore.userId,
        name: userStore.userName,
        role_id: userStore.roleId,
        sex: typeof patch.sex === 'boolean' ? patch.sex : (userStore.sex ?? true),
        account: userStore.account,
        phone: patch.phone ?? userStore.phone,
        avatar: userStore.avatar,
        create_time: userStore.createTime,
        update_time: userStore.updateTime,
        status: userStore.status ?? undefined,
    });
};

const BasicProfileTabContent = observer(() => {
    const [form] = Form.useForm();
    const [sexLoading, setSexLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [updatingPhone, setUpdatingPhone] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const userStore = Store.UserStore;
    const studentStore = Store.StudentStore;
    const teacherStore = Store.TeacherStore;

    const roleLabel = useMemo(() => {
        if (userStore.role === ROLE_MAP.STUDENT) return '学生';
        if (userStore.role === ROLE_MAP.TEACHER) return '老师';
        return '未知角色';
    }, [userStore.role]);

    const numberInfo = useMemo(() => {
        if (userStore.role === ROLE_MAP.STUDENT) {
            return {
                label: '学号',
                value: studentStore.studentNumber || '-',
            };
        }

        if (userStore.role === ROLE_MAP.TEACHER) {
            return {
                label: '工号',
                value: teacherStore.teacherNumber || '-',
            };
        }

        return {
            label: '学号/工号',
            value: '-',
        };
    }, [userStore.role, studentStore.studentNumber, teacherStore.teacherNumber]);

    useEffect(() => {
        form.setFieldsValue({
            sex: userStore.sex ?? true,
            newPhone: userStore.phone,
            code: '',
        });
    }, [form, userStore.sex, userStore.phone]);

    useEffect(() => {
        if (countdown <= 0) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [countdown]);

    const handleSaveSex = async () => {
        try {
            const { sex } = await form.validateFields(['sex']);
            setSexLoading(true);
            const res = await updateBasic({ sex });
            ensureSuccess(res, '更新性别失败');
            patchUser({ sex });
            message.success('性别更新成功');
        } catch (error: any) {
            if (error?.errorFields) {
                return;
            }
        } finally {
            setSexLoading(false);
        }
    };

    const handleSendCode = async () => {
        try {
            const { newPhone } = await form.validateFields(['newPhone']);
            setSendingCode(true);
            const res = await updatePhone({ newPhone });
            const payload = ensureSuccess(res, '发送验证码失败');

            const expireInSeconds = Number(payload?.expireInSeconds) > 0 ? Number(payload.expireInSeconds) : 60;
            setCountdown(expireInSeconds);
            message.success('验证码已发送');
        } catch (error: any) {
            if (error?.errorFields) {
                return;
            }
        } finally {
            setSendingCode(false);
        }
    };

    const handleUpdatePhone = async () => {
        try {
            const { newPhone, code } = await form.validateFields(['newPhone', 'code']);
            setUpdatingPhone(true);
            const res = await updatePhone({ newPhone, code });
            const payload = ensureSuccess(res, '更新手机号失败');
            const latestPhone = payload?.phone || newPhone;

            patchUser({ phone: latestPhone });
            form.setFieldValue('newPhone', latestPhone);
            form.setFieldValue('code', '');
            setCountdown(0);
            message.success('手机号更新成功');
        } catch (error: any) {
            if (error?.errorFields) {
                return;
            }
        } finally {
            setUpdatingPhone(false);
        }
    };

    return (
        <section className="account-basic-tab">
            <div className="account-basic-grid">
                <div className="account-basic-item">
                    <span className="account-basic-label">姓名</span>
                    <span className="account-basic-value">{userStore.userName || '-'}</span>
                </div>
                <div className="account-basic-item">
                    <span className="account-basic-label">ID</span>
                    <span className="account-basic-value">{userStore.userId || '-'}</span>
                </div>
                <div className="account-basic-item">
                    <span className="account-basic-label">{numberInfo.label}</span>
                    <span className="account-basic-value">{numberInfo.value}</span>
                </div>
                <div className="account-basic-item">
                    <span className="account-basic-label">学校名</span>
                    <span className="account-basic-value">{userStore.schoolName || '-'}</span>
                </div>
                <div className="account-basic-item">
                    <span className="account-basic-label">角色</span>
                    <span className="account-basic-value">{roleLabel}</span>
                </div>
            </div>

            <Form form={form} layout="vertical" className="account-basic-editor">
                <div className="account-basic-row">
                    <Form.Item
                        label="性别"
                        name="sex"
                        className="account-basic-field"
                        rules={[{ required: true, message: '请选择性别' }]}
                    >
                        <Radio.Group>
                            <Radio value={true}>男</Radio>
                            <Radio value={false}>女</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Button onClick={handleSaveSex} loading={sexLoading} className="account-basic-btn">
                        保存性别
                    </Button>
                </div>

                <div className="account-basic-row">
                    <Form.Item
                        label="手机号"
                        name="newPhone"
                        className="account-basic-field"
                        rules={[
                            { required: true, message: '请输入手机号' },
                            {
                                validator: (_, value) => {
                                    if (!value || PHONE_REG.test(value)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('请输入有效的手机号'));
                                },
                            },
                        ]}
                    >
                        <Input maxLength={11} placeholder="请输入新手机号" />
                    </Form.Item>
                    <Button
                        onClick={handleSendCode}
                        loading={sendingCode}
                        disabled={countdown > 0}
                        className="account-basic-btn"
                    >
                        {countdown > 0 ? `${countdown}s后重发` : '发送验证码'}
                    </Button>
                </div>

                <div className="account-basic-row">
                    <Form.Item
                        label="验证码"
                        name="code"
                        className="account-basic-field"
                        rules={[
                            { required: true, message: '请输入验证码' },
                            {
                                validator: (_, value) => {
                                    if (!value || CODE_REG.test(value)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('验证码需为 6 位数字'));
                                },
                            },
                        ]}
                    >
                        <Input maxLength={6} placeholder="请输入 6 位验证码" />
                    </Form.Item>
                    <Button type="primary" onClick={handleUpdatePhone} loading={updatingPhone} className="account-basic-btn">
                        更新手机号
                    </Button>
                </div>
            </Form>
        </section>
    );
});

export default BasicProfileTabContent;
