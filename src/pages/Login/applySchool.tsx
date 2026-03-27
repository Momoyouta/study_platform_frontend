import React, { useState } from 'react';
import { Form, Input, Button, Upload, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { applySchool, uploadImageTemp } from '../../http/api';
import './applySchool.less';

const ApplySchool: React.FC = () => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [evidenceImgUrl, setEvidenceImgUrl] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const beforeUpload = (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('只能上传 JPG/PNG 文件!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('文件必须小于 5MB!');
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length === 0) {
            setEvidenceImgUrl('');
        }
    };

    const customUpload: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError } = options;

        setUploadingImage(true);
        try {
            const uploadRes = await uploadImageTemp(file as File);
            const uploadData: any = uploadRes;
            const uploadedPath = uploadData?.data?.path ?? uploadData?.path ?? uploadData;

            if (!uploadedPath) {
                throw new Error('上传接口未返回图片路径');
            }

            setEvidenceImgUrl(String(uploadedPath));
            message.success('图片上传成功');
            onSuccess?.(uploadRes as any);
        } catch (error) {
            console.error('Image upload failed:', error);
            setEvidenceImgUrl('');
            message.error('图片上传失败，请重试');
            onError?.(error as any);
        } finally {
            setUploadingImage(false);
        }
    };

    const onFinish = async (values: any) => {
        if (fileList.length === 0 || !evidenceImgUrl) {
            message.warning('请上传一张证明材料图片');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                school_name: values.name,
                school_address: values.address,
                charge_name: values.contactName,
                charge_phone: values.contactPhone,
                evidence_img_url: evidenceImgUrl,
            };
            
            await applySchool(payload);
            message.success('提交申请成功');
            setSubmitted(true);
        } catch (error) {
            console.error('Submit failed:', error);
            message.error('提交失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const uploadButton = (
        <div>
            <PlusOutlined style={{ fontSize: 32, color: '#ccc' }} />
        </div>
    );

    return (
        <div className="apply-school-container">
            <div className="banner">
                <div className="banner-content">
                    <h1 className="banner-title"><ClockCircleOutlined className="banner-icon"/> MomoStudy</h1>
                    <p className="banner-slogan">打造新一代智慧校园</p>
                </div>
            </div>
            
            <div className="content-card">
                {!submitted ? (
                    <>
                        <h2 className="card-title">学校申请</h2>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            className="form-wrapper"
                            requiredMark={false}
                        >
                            <Form.Item
                                label="学校名称"
                                name="name"
                                rules={[{ required: true, message: '请输入学校名称' }]}
                            >
                                <Input placeholder="" />
                            </Form.Item>

                            <Form.Item
                                label="学校地址"
                                name="address"
                                rules={[{ required: true, message: '请输入学校地址' }]}
                            >
                                <Input placeholder="" />
                            </Form.Item>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <Form.Item
                                    label="负责人姓名"
                                    name="contactName"
                                    style={{ flex: 1 }}
                                    rules={[{ required: true, message: '请输入负责人姓名' }]}
                                >
                                    <Input placeholder="" />
                                </Form.Item>

                                <Form.Item
                                    label="负责人手机号"
                                    name="contactPhone"
                                    style={{ flex: 1 }}
                                    rules={[
                                        { required: true, message: '请输入负责人手机号' },
                                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                                    ]}
                                >
                                    <Input placeholder="" />
                                </Form.Item>
                            </div>

                            <Form.Item
                                label="学校机构证明材料图片上传"
                                name="evidence"
                                className="upload-wrapper"
                            >
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onPreview={() => {}}
                                    onChange={handleChange}
                                    customRequest={customUpload}
                                    beforeUpload={beforeUpload}
                                    maxCount={1}
                                    showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
                                >
                                    {fileList.length >= 1 ? null : uploadButton}
                                </Upload>
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40}}>
                                     <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={loading || uploadingImage}
                                        disabled={uploadingImage}
                                        className="submit-btn"
                                    >
                                        发起申请
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </>
                ) : (
                    <div className="success-result">
                         {/* Using a simple div instead of Result to customize if needed */}
                         <div style={{ textAlign: 'center', padding: '100px 0' }}>
                             <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>申请成功</div>
                             <div style={{ fontSize: 16, color: '#666', marginTop: 16 }}>请耐心等待平台管理员审核</div>
                         </div>
                    </div>
                )}
            </div>
            
            <div className="footer-copyright">
                © 2026 在线学习平台 版权所有
            </div>
        </div>
    );
};

export default ApplySchool;
