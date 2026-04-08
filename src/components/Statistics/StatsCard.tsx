import { Alert, Card, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';
import './StatsCard.less';

type StatsCardProps = {
    title: ReactNode;
    extra?: ReactNode;
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    emptyDescription?: string;
    className?: string;
    children?: ReactNode;
};

const StatsCard = ({
    title,
    extra,
    loading = false,
    error,
    empty = false,
    emptyDescription = '暂无数据',
    className = '',
    children,
}: StatsCardProps) => {
    return (
        <Card className={`statistics-card ${className}`.trim()} title={title} extra={extra}>
            {loading ? (
                <div className="statistics-card-loading">
                    <Spin />
                </div>
            ) : null}

            {!loading && error ? (
                <Alert type="error" showIcon message={error} />
            ) : null}

            {!loading && !error && empty ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
            ) : null}

            {!loading && !error && !empty ? children : null}
        </Card>
    );
};

export default StatsCard;