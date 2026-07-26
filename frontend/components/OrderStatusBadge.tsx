import { Badge } from './Badge';

type OrderStatus = 'PENDING' | 'RECEIVED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function OrderStatusBadge({ status, size = 'md', showIcon = false }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    if (!status) return { variant: 'gray' as const, label: 'Unknown', icon: '•' };
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case 'PENDING':
      case 'RECEIVED':
        return {
          variant: 'info' as const,
          label: 'Received',
          icon: '📝'
        };
      case 'PREPARING':
        return {
          variant: 'warning' as const,
          label: 'Preparing',
          icon: '👨‍🍳'
        };
      case 'READY':
        return {
          variant: 'success' as const,
          label: 'Ready',
          icon: '✅'
        };
      case 'COMPLETED':
        return {
          variant: 'gray' as const,
          label: 'Completed',
          icon: '✓'
        };
      case 'CANCELLED':
        return {
          variant: 'danger' as const,
          label: 'Cancelled',
          icon: '✗'
        };
      default:
        return {
          variant: 'gray' as const,
          label: status,
          icon: '•'
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge variant={config.variant} className={sizeClasses[size]}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
