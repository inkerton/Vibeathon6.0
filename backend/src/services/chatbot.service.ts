import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

interface ChatContext {
  userId: string;
  role: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

class ChatbotService {
  async chat(message: string, context: ChatContext) {
    // Build context-aware prompt
    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    // Get AI response
    const response = await aiService.generateText(fullPrompt, false);

    // Update conversation history
    context.conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    return {
      response,
      context: context.conversationHistory
    };
  }

  private buildSystemPrompt(context: ChatContext): string {
    const basePrompt = `You are a helpful restaurant assistant. You can help with:
- Menu information and recommendations
- Order status and tracking
- Reservation management
- General restaurant information

User Role: ${context.role}
`;

    // Add conversation history
    const history = context.conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `${basePrompt}\n\nConversation History:\n${history}`;
  }

  async getMenuHelp(query: string) {
    const menuItems = await prisma.menuItem.findMany({
      where: { is_available: true }
    });

    const prompt = `
You are a restaurant menu assistant. Help the customer with their query.

Query: ${query}

Available Menu Items:
${JSON.stringify(menuItems.map(item => ({
  name: item.name,
  category: item.category,
  price: Number(item.price),
  description: item.description
})))}

Provide a helpful, conversational response. If recommending items, explain why.
Keep the response concise and friendly.
`;

    return aiService.generateText(prompt, false);
  }

  async getOrderHelp(userId: string, query: string) {
    const orders = await prisma.order.findMany({
      where: { customer_id: userId },
      include: { items: { include: { menu_item: true } } },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    if (orders.length === 0) {
      return "You don't have any orders yet. Would you like to browse our menu?";
    }

    const prompt = `
You are a restaurant order assistant. Help the customer with their query about orders.

Query: ${query}

Customer's Recent Orders:
${JSON.stringify(orders.map(order => ({
  id: order.id,
  status: order.order_status,
  total: Number(order.total_amount),
  items: order.items.map(i => i.menu_item.name),
  createdAt: order.created_at
})))}

Provide a helpful response about their order status or history.
Be specific and reference order details when relevant.
`;

    return aiService.generateText(prompt, false);
  }

  async getReservationHelp(userId: string, query: string) {
    const reservations = await prisma.reservation.findMany({
      where: { customer_id: userId },
      include: { table: true },
      orderBy: { date: 'desc' },
      take: 5
    });

    if (reservations.length === 0) {
      return "You don't have any reservations yet. Would you like to make one?";
    }

    const prompt = `
You are a restaurant reservation assistant. Help the customer with their query about reservations.

Query: ${query}

Customer's Reservations:
${JSON.stringify(reservations.map(res => ({
  id: res.id,
  date: res.date,
  partySize: res.party_size,
  status: res.status,
  tableNumber: res.table.table_number
})))}

Provide a helpful response about their reservations.
Be specific and reference reservation details when relevant.
`;

    return aiService.generateText(prompt, false);
  }

  async getGeneralHelp(query: string, userRole: string) {
    const prompt = `
You are a helpful restaurant assistant. Answer the customer's general question.

User Role: ${userRole}
Query: ${query}

Provide a helpful, friendly response. If you don't know the answer, suggest contacting staff.
Keep the response concise and conversational.
`;

    return aiService.generateText(prompt, false);
  }

  async handleIntent(message: string, userId: string, userRole: string) {
    // Simple intent detection
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('menu') || lowerMessage.includes('food') || lowerMessage.includes('dish')) {
      return {
        intent: 'menu',
        response: await this.getMenuHelp(message)
      };
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('status')) {
      return {
        intent: 'order',
        response: await this.getOrderHelp(userId, message)
      };
    }
    
    if (lowerMessage.includes('reservation') || lowerMessage.includes('booking') || lowerMessage.includes('table')) {
      return {
        intent: 'reservation',
        response: await this.getReservationHelp(userId, message)
      };
    }
    
    return {
      intent: 'general',
      response: await this.getGeneralHelp(message, userRole)
    };
  }

  async getSuggestedQuestions(userRole: string) {
    const suggestions = {
      customer: [
        "What's on the menu today?",
        "Where is my order?",
        "What do you recommend?",
        "Do you have vegetarian options?",
        "Can I make a reservation?"
      ],
      admin: [
        "Show me today's revenue",
        "What are the popular items?",
        "Any low stock alerts?",
        "How many orders today?"
      ],
      kitchen: [
        "Show pending orders",
        "What items are most ordered?",
        "Any special requests?"
      ],
      reception: [
        "Show today's reservations",
        "Any upcoming bookings?",
        "Table availability?"
      ],
      inventory: [
        "Show low stock items",
        "What needs restocking?",
        "Inventory predictions?"
      ]
    };

    return suggestions[userRole as keyof typeof suggestions] || suggestions.customer;
  }
}

export default new ChatbotService();
