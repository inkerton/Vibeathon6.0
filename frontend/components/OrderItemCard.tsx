import { Badge } from './Badge';

interface OrderItem {
  id: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
  quantity: number;
  customInstructions?: string | null;
  allergyInfo?: string | null;
  status?: string;
}

interface OrderItemCardProps {
  item: OrderItem;
  showInstructions?: boolean;
  showStatus?: boolean;
  showImage?: boolean;
}

export function OrderItemCard({ 
  item, 
  showInstructions = true, 
  showStatus = false,
  showImage = false 
}: OrderItemCardProps) {
  const getStatusVariant = (status?: string): 'info' | 'warning' | 'success' | 'danger' | 'gray' => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'received':
        return 'info';
      case 'preparing':
        return 'warning';
      case 'ready':
        return 'success';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'danger';
      default:
        return 'gray';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {showImage && item.menuItem.imageUrl && (
          <img
            src={item.menuItem.imageUrl}
            alt={item.menuItem.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{item.menuItem.name}</h4>
              <p className="text-sm text-gray-600">
                Quantity: {item.quantity} × ₹{item.menuItem.price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">
                ₹{(item.quantity * item.menuItem.price).toFixed(2)}
              </p>
              {showStatus && item.status && (
                <Badge variant={getStatusVariant(item.status)} className="mt-1">
                  {item.status}
                </Badge>
              )}
            </div>
          </div>

          {showInstructions && (item.customInstructions || item.allergyInfo) && (
            <div className="mt-3 space-y-2">
              {item.customInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                  <p className="text-xs font-medium text-blue-900 mb-1">Custom Instructions:</p>
                  <p className="text-sm text-blue-800">{item.customInstructions}</p>
                </div>
              )}
              {item.allergyInfo && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-xs font-medium text-red-900 mb-1">⚠️ Allergy Information:</p>
                  <p className="text-sm text-red-800">{item.allergyInfo}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
