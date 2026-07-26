interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
  estimatedTime?: number;
}

export function OrderTimeline({ currentStatus, createdAt, estimatedTime = 30 }: OrderTimelineProps) {
  const statuses = [
    { key: 'RECEIVED', label: 'Order Received', icon: '📝' },
    { key: 'PREPARING', label: 'Being Prepared', icon: '👨‍🍳' },
    { key: 'READY', label: 'Ready for Pickup', icon: '✅' },
    { key: 'COMPLETED', label: 'Completed', icon: '✓' }
  ];

  const getCurrentIndex = () => {
    const normalized = currentStatus.toUpperCase();
    const index = statuses.findIndex(s => s.key === normalized);
    return index === -1 ? 0 : index;
  };

  const currentIndex = getCurrentIndex();
  const isCancelled = currentStatus.toUpperCase() === 'CANCELLED';

  const getElapsedTime = () => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const elapsedTime = getElapsedTime();
  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <span className="text-2xl">✗</span>
          <div>
            <p className="font-semibold">Order Cancelled</p>
            <p className="text-sm">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Time Info */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Elapsed Time</p>
          <p className="text-lg font-semibold text-gray-900">{elapsedTime} mins</p>
        </div>
        {currentIndex < statuses.length - 1 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Est. Remaining</p>
            <p className="text-lg font-semibold text-blue-600">{remainingTime} mins</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {statuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={status.key} className="relative pb-8 last:pb-0">
              {/* Connector Line */}
              {index < statuses.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-full ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Status Item */}
              <div className="relative flex items-start gap-4">
                {/* Icon Circle */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {status.icon}
                </div>

                {/* Status Info */}
                <div className="flex-1 pt-0.5">
                  <p
                    className={`font-semibold ${
                      isCompleted
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-blue-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {status.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-600 mt-1">
                      Your order is currently being {status.label.toLowerCase()}
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-sm text-green-600 mt-1">✓ Completed</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
