import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import TempImageUpload from '@/components/TempImageUpload';
import { applySchool } from '../../http/api';
import './applySchool.less';

const ApplySchool = () => {
    const [form] = Form.useForm();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [evidenceImgUrl, setEvidenceImgUrl] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const onFinish = async (values: any) => {
        if (!evidenceImgUrl) {
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
                                <TempImageUpload
                                    variant="picture-card"
                                    previewPath={evidenceImgUrl}
                                    accept=".jpg,.jpeg,.png"
                                    allowedMimeTypes={['image/jpeg', 'image/png']}
                                    invalidTypeMessage="只能上传 JPG/PNG 文件!"
                                    oversizeMessage="文件必须小于 5MB!"
                                    onChange={(path) => {
                                        setEvidenceImgUrl(path);
                                    }}
                                    onUploadingChange={setUploadingImage}
                                />
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
