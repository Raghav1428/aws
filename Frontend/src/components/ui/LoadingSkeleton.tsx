import clsx from 'clsx';

export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse bg-slate-200 rounded', className)} />
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <LoadingSkeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <LoadingSkeleton className="h-5 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <LoadingSkeleton className="h-9 w-full" />
    </div>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);
