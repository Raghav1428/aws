import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card = ({ children, className, hoverable = false }: CardProps) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-slate-200',
        hoverable && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('px-6 py-4 border-b border-slate-200', className)}>{children}</div>
);

export const CardBody = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('px-6 py-4', className)}>{children}</div>
);

export const CardFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('px-6 py-4 border-t border-slate-200 bg-slate-50/50', className)}>{children}</div>
);
