import { useEffect, useState } from 'react';
import { Form, InputNumber, Modal, Select, Space, message } from 'antd';
import { createCourseInvite } from '@/http/api';

import './InviteCodeModal.less';

type InviteCodeModalProps = {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    courseId: string | null;
    schoolId?: string | null;
    targetGroup: { id: string | number; name: string } | null;
    initialTtl?: number;
};

const unitMap: Record<string, number> = { minute: 60, hour: 3600, day: 86400 };

const convertSecondsToUnitValue = (seconds?: number) => {
    if (!seconds || seconds <= 0) {
        return { value: undefined as number | undefined, unit: 'hour' };
    }
    if (seconds % 86400 === 0) return { value: seconds / 86400, unit: 'day' };
    if (seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hour' };
    return { value: Math.max(1, Math.round(seconds / 60)), unit: 'minute' };
};

/**
 * 通用教学组邀请码生成/更新弹窗
 * - 自动处理时间单位转换
 * - 内部封装 API 调用逻辑
 */
const InviteCodeModal = ({
    open,
    onCancel,
    onSuccess,
    courseId,
    schoolId,
    targetGroup,
    initialTtl,
}: InviteCodeModalProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [unit, setUnit] = useState('hour');

    useEffect(() => {
        if (open) {
            const { value, unit: initialUnit } = convertSecondsToUnitValue(initialTtl);
            form.setFieldsValue({ expire_value: value });
            setUnit(initialUnit);
        }
    }, [open, initialTtl, form]);

    const handleOk = async () => {
        if (!courseId || !targetGroup?.id) {
            message.error('缺少必要参数');
            return;
        }

        try {
            const values = await form.validateFields();
            setLoading(true);

            const expireValue = values.expire_value;
            const expireMultiplier = unitMap[unit] || 3600;
            const expireSeconds = Number.isFinite(Number(expireValue)) && Number(expireValue) > 0
                ? Math.round(Number(expireValue) * expireMultiplier)
                : undefined;

            const payload: any = {
                course_id: String(courseId),
                teaching_group_id: String(targetGroup.id),
            };

            if (expireSeconds) payload.ttl = expireSeconds;
            if (schoolId) payload.school_id = schoolId;

            const res: any = await createCourseInvite(payload);
            
            if (res?.code === 200 || res?.data?.code) {
                message.success('邀请码已生成');
                onSuccess();
            } else {
                message.error(res?.msg || '邀请码生成失败');
            }
        } catch (error) {
            // Validate failed or API error
            console.error('Failed to create invite code:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="生成邀请码"
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="确定"
            cancelText="取消"
            destroyOnHidden
            className="invite-code-modal"
        >
            <div className="invite-code-modal-content">
                <div className="group-info">
                    当前教学组：{targetGroup?.name || '-'}
                </div>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="邀请码有效期"
                        extra="必须大于0。留空则使用后端默认值"
                        className="expire-form-item"
                    >
                        <Space.Compact className="expire-input-group">
                            <Form.Item
                                name="expire_value"
                                noStyle
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            if (value === undefined || value === null || value === '') {
                                                return Promise.resolve();
                                            }
                                            const parsed = Number(value);
                                            if (Number.isFinite(parsed) && parsed > 0) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('有效期必须大于0'));
                                        },
                                    },
                                ]}
                            >
                                <InputNumber 
                                    min={1} 
                                    precision={0} 
                                    className="expire-input" 
                                    placeholder="不填则使用默认值" 
                                />
                            </Form.Item>
                            <Select
                                value={unit}
                                onChange={setUnit}
                                className="expire-unit-select"
                                options={[
                                    { label: '分钟', value: 'minute' },
                                    { label: '小时', value: 'hour' },
                                    { label: '天', value: 'day' },
                                ]}
                            />
                        </Space.Compact>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
};

export default InviteCodeModal;
