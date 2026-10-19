import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
}) => {
  const roundedClass = `ent-skeleton--rounded-${rounded}`;
  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return <div className={`ent-skeleton ${roundedClass} ${className}`.trim()} style={style} />;
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5
}) => {
  return (
    <div className="ent-skeleton-table">
      <div className="ent-skeleton-table__header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={18} width={`${80 + (i % 3) * 15}%`} />
        ))}
      </div>
      <div className="ent-skeleton-table__body">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="ent-skeleton-table__row">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                height={16}
                width={c === 0 ? '90%' : c === columns - 1 ? '50%' : '75%'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonStatsGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="ent-skeleton-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ent-skeleton-stat-card">
          <div className="ent-skeleton-stat-card__top">
            <Skeleton width={36} height={36} rounded="lg" />
            <Skeleton width={60} height={16} />
          </div>
          <Skeleton width="45%" height={28} className="mt-3 mb-2" />
          <Skeleton width="70%" height={14} />
        </div>
      ))}
    </div>
  );
};
