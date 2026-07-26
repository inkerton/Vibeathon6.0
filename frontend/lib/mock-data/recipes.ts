import { mockMenuItems } from './menu';
import { mockInventory } from './inventory';

export interface MockRecipeItem {
  id: string;
  inventoryItemId: string;
  inventoryItem: any;
  quantityRequired: number;
}

export interface MockRecipe {
  menuItemId: string;
  items: MockRecipeItem[];
  maxServings: number;
}

export const mockRecipes: MockRecipe[] = [
  // Margherita Pizza
  {
    menuItemId: 'menu-6',
    items: [
      {
        id: 'recipe-item-1',
        inventoryItemId: 'inv-13',
        inventoryItem: mockInventory.find(i => i.id === 'inv-13'), // Pizza Dough
        quantityRequired: 0.3 // kg per serving
      },
      {
        id: 'recipe-item-2',
        inventoryItemId: 'inv-1',
        inventoryItem: mockInventory.find(i => i.id === 'inv-1'), // Tomatoes
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-3',
        inventoryItemId: 'inv-5',
        inventoryItem: mockInventory.find(i => i.id === 'inv-5'), // Mozzarella
        quantityRequired: 0.12
      },
      {
        id: 'recipe-item-4',
        inventoryItemId: 'inv-15',
        inventoryItem: mockInventory.find(i => i.id === 'inv-15'), // Basil
        quantityRequired: 0.01
      }
    ],
    maxServings: 16 // Based on available basil (2kg / 0.01kg)
  },

  // Pepperoni Pizza
  {
    menuItemId: 'menu-7',
    items: [
      {
        id: 'recipe-item-5',
        inventoryItemId: 'inv-13',
        inventoryItem: mockInventory.find(i => i.id === 'inv-13'), // Pizza Dough
        quantityRequired: 0.3
      },
      {
        id: 'recipe-item-6',
        inventoryItemId: 'inv-1',
        inventoryItem: mockInventory.find(i => i.id === 'inv-1'), // Tomatoes
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-7',
        inventoryItemId: 'inv-5',
        inventoryItem: mockInventory.find(i => i.id === 'inv-5'), // Mozzarella
        quantityRequired: 0.15
      }
    ],
    maxServings: 33 // Based on mozzarella (5kg / 0.15kg)
  },

  // Pasta Carbonara
  {
    menuItemId: 'menu-8',
    items: [
      {
        id: 'recipe-item-8',
        inventoryItemId: 'inv-12',
        inventoryItem: mockInventory.find(i => i.id === 'inv-12'), // Pasta
        quantityRequired: 0.2
      },
      {
        id: 'recipe-item-9',
        inventoryItemId: 'inv-10',
        inventoryItem: mockInventory.find(i => i.id === 'inv-10'), // Bacon
        quantityRequired: 0.1
      },
      {
        id: 'recipe-item-10',
        inventoryItemId: 'inv-6',
        inventoryItem: mockInventory.find(i => i.id === 'inv-6'), // Parmesan
        quantityRequired: 0.05
      },
      {
        id: 'recipe-item-11',
        inventoryItemId: 'inv-7',
        inventoryItem: mockInventory.find(i => i.id === 'inv-7'), // Cream
        quantityRequired: 0.1
      }
    ],
    maxServings: 80 // Based on parmesan (4kg / 0.05kg)
  },

  // Spaghetti Bolognese
  {
    menuItemId: 'menu-9',
    items: [
      {
        id: 'recipe-item-12',
        inventoryItemId: 'inv-12',
        inventoryItem: mockInventory.find(i => i.id === 'inv-12'), // Pasta
        quantityRequired: 0.2
      },
      {
        id: 'recipe-item-13',
        inventoryItemId: 'inv-9',
        inventoryItem: mockInventory.find(i => i.id === 'inv-9'), // Beef
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-14',
        inventoryItemId: 'inv-1',
        inventoryItem: mockInventory.find(i => i.id === 'inv-1'), // Tomatoes
        quantityRequired: 0.2
      },
      {
        id: 'recipe-item-15',
        inventoryItemId: 'inv-3',
        inventoryItem: mockInventory.find(i => i.id === 'inv-3'), // Onions
        quantityRequired: 0.05
      }
    ],
    maxServings: 100 // Based on beef (15kg / 0.15kg)
  },

  // Grilled Chicken
  {
    menuItemId: 'menu-10',
    items: [
      {
        id: 'recipe-item-16',
        inventoryItemId: 'inv-8',
        inventoryItem: mockInventory.find(i => i.id === 'inv-8'), // Chicken
        quantityRequired: 0.25
      },
      {
        id: 'recipe-item-17',
        inventoryItemId: 'inv-4',
        inventoryItem: mockInventory.find(i => i.id === 'inv-4'), // Bell Peppers
        quantityRequired: 0.1
      },
      {
        id: 'recipe-item-18',
        inventoryItemId: 'inv-14',
        inventoryItem: mockInventory.find(i => i.id === 'inv-14'), // Olive Oil
        quantityRequired: 0.02
      }
    ],
    maxServings: 108 // Based on chicken (27kg / 0.25kg)
  },

  // Caesar Salad
  {
    menuItemId: 'menu-2',
    items: [
      {
        id: 'recipe-item-19',
        inventoryItemId: 'inv-2',
        inventoryItem: mockInventory.find(i => i.id === 'inv-2'), // Lettuce
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-20',
        inventoryItemId: 'inv-6',
        inventoryItem: mockInventory.find(i => i.id === 'inv-6'), // Parmesan
        quantityRequired: 0.03
      }
    ],
    maxServings: 133 // Based on parmesan (4kg / 0.03kg)
  },

  // Bruschetta
  {
    menuItemId: 'menu-1',
    items: [
      {
        id: 'recipe-item-21',
        inventoryItemId: 'inv-1',
        inventoryItem: mockInventory.find(i => i.id === 'inv-1'), // Tomatoes
        quantityRequired: 0.1
      },
      {
        id: 'recipe-item-22',
        inventoryItemId: 'inv-16',
        inventoryItem: mockInventory.find(i => i.id === 'inv-16'), // Garlic
        quantityRequired: 0.01
      },
      {
        id: 'recipe-item-23',
        inventoryItemId: 'inv-15',
        inventoryItem: mockInventory.find(i => i.id === 'inv-15'), // Basil
        quantityRequired: 0.005
      },
      {
        id: 'recipe-item-24',
        inventoryItemId: 'inv-14',
        inventoryItem: mockInventory.find(i => i.id === 'inv-14'), // Olive Oil
        quantityRequired: 0.02
      }
    ],
    maxServings: 400 // Based on basil (2kg / 0.005kg)
  },

  // Fish and Chips
  {
    menuItemId: 'menu-12',
    items: [
      {
        id: 'recipe-item-25',
        inventoryItemId: 'inv-11',
        inventoryItem: mockInventory.find(i => i.id === 'inv-11'), // Fish
        quantityRequired: 0.2
      }
    ],
    maxServings: 0 // Out of stock
  },

  // Vegetable Stir Fry
  {
    menuItemId: 'menu-13',
    items: [
      {
        id: 'recipe-item-26',
        inventoryItemId: 'inv-4',
        inventoryItem: mockInventory.find(i => i.id === 'inv-4'), // Bell Peppers
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-27',
        inventoryItemId: 'inv-3',
        inventoryItem: mockInventory.find(i => i.id === 'inv-3'), // Onions
        quantityRequired: 0.1
      },
      {
        id: 'recipe-item-28',
        inventoryItemId: 'inv-16',
        inventoryItem: mockInventory.find(i => i.id === 'inv-16'), // Garlic
        quantityRequired: 0.02
      }
    ],
    maxServings: 146 // Based on bell peppers (22kg / 0.15kg)
  },

  // Tiramisu
  {
    menuItemId: 'menu-14',
    items: [
      {
        id: 'recipe-item-29',
        inventoryItemId: 'inv-19',
        inventoryItem: mockInventory.find(i => i.id === 'inv-19'), // Coffee
        quantityRequired: 0.02
      }
    ],
    maxServings: 400 // Based on coffee (8kg / 0.02kg)
  },

  // Chocolate Lava Cake
  {
    menuItemId: 'menu-15',
    items: [
      {
        id: 'recipe-item-30',
        inventoryItemId: 'inv-20',
        inventoryItem: mockInventory.find(i => i.id === 'inv-20'), // Chocolate
        quantityRequired: 0.08
      }
    ],
    maxServings: 75 // Based on chocolate (6kg / 0.08kg)
  },

  // Ice Cream Sundae
  {
    menuItemId: 'menu-17',
    items: [
      {
        id: 'recipe-item-31',
        inventoryItemId: 'inv-21',
        inventoryItem: mockInventory.find(i => i.id === 'inv-21'), // Ice Cream
        quantityRequired: 0.15
      },
      {
        id: 'recipe-item-32',
        inventoryItemId: 'inv-20',
        inventoryItem: mockInventory.find(i => i.id === 'inv-20'), // Chocolate
        quantityRequired: 0.03
      }
    ],
    maxServings: 106 // Based on ice cream (16L / 0.15L)
  },

  // Fresh Orange Juice
  {
    menuItemId: 'menu-19',
    items: [
      {
        id: 'recipe-item-33',
        inventoryItemId: 'inv-17',
        inventoryItem: mockInventory.find(i => i.id === 'inv-17'), // Orange Juice
        quantityRequired: 0.25
      }
    ],
    maxServings: 0 // Out of stock (0L available)
  },

  // Cappuccino
  {
    menuItemId: 'menu-20',
    items: [
      {
        id: 'recipe-item-34',
        inventoryItemId: 'inv-19',
        inventoryItem: mockInventory.find(i => i.id === 'inv-19'), // Coffee
        quantityRequired: 0.015
      }
    ],
    maxServings: 533 // Based on coffee (8kg / 0.015kg)
  }
];
