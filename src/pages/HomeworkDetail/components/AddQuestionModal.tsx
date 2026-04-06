import { useEffect, useState } from 'react';
import { Form, InputNumber, Modal, Select } from 'antd';
import type { QuestionType } from '@/store/homework';
import { TYPE_NAMES } from '../constants';

export type AddQuestionPayload = {
    type: QuestionType;
    count: number;
};

type AddQuestionModalProps = {
    open: boolean;
    onCancel: () => void;
    onConfirm: (payload: AddQuestionPayload) => Promise<boolean>;
};

type AddQuestionFormValues = {
    type: QuestionType;
    count: number;
};

const AddQuestionModal = ({ open, onCancel, onConfirm }: AddQuestionModalProps) => {
    const [form] = Form.useForm<AddQuestionFormValues>();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setFieldsValue({
            type: 'single',
            count: 1,
        });
    }, [open, form]);

    const handleOk = async () => {
        const values = await form.validateFields();
        setSubmitting(true);
        try {
            const ok = await onConfirm({
                type: values.type,
                count: Number(values.count || 1),
            });

            if (ok) {
                form.resetFields();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="添加题目"
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={submitting}
            okText="添加"
            cancelText="取消"
            destroyOnClose
        >
            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item name="type" label="题型" rules={[{ required: true, message: '请选择题型' }]}>
                    <Select options={Object.entries(TYPE_NAMES).map(([value, label]) => ({ value, label }))} />
                </Form.Item>

                <Form.Item
                    name="count"
                    label="数量"
                    rules={[{ required: true, message: '请输入添加数量' }]}
                    extra="添加后可点击右侧题号逐题编辑内容"
                >
                    <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddQuestionModal;
