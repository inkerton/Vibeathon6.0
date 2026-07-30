# System Documentation

Welcome to the Smart Restaurant Management System documentation. This directory contains comprehensive documentation covering all aspects of the system.

## 📚 Documentation Index

### 1. [Overview](./overview.md)
**Complete system architecture and feature overview**

Topics covered:
- Technology stack (Backend & Frontend)
- System components and architecture diagram
- User roles and permissions
- Core features (Authentication, Menu, Orders, Inventory, etc.)
- API architecture
- Frontend architecture
- Data flow diagrams
- Security features
- Deployment information
- Development modes (Mock/Live API)
- Future enhancements

**Start here** for a high-level understanding of the entire system.

---

### 2. [API Documentation](./api.md)
**Complete REST API reference**

Topics covered:
- Base URL and authentication
- Response format standards
- All API endpoints with examples:
  - Authentication (`/auth`)
  - Menu Management (`/menu`)
  - Order Management (`/orders`)
  - Reservations (`/reservations`)
  - Inventory Management (`/inventory`)
  - Recipe Management (`/recipes`)
  - Staff Management (`/staff`)
  - Database Seeding (`/seed`)
- WebSocket events
- Error codes and handling
- Best practices

**Use this** when integrating with the API or understanding endpoint behavior.

---

### 3. [Database Schema](./database-schema.md)
**Complete database structure and relationships**

Topics covered:
- Database overview (PostgreSQL + Prisma)
- All enums (Role, Status types, etc.)
- Complete table definitions with:
  - Fields and data types
  - Relations and foreign keys
  - Indexes and constraints
- Entity relationship diagrams
- Key relationships explained
- Data integrity rules
- Migration strategy
- Backup and recovery
- Security considerations
- Future enhancements

**Use this** when working with the database or understanding data models.

---

### 4. [Frontend Architecture](./frontend-architecture.md)
**Complete frontend structure and patterns**

Topics covered:
- Technology stack details
- Project structure and file organization
- Routing architecture (App Router)
- State management strategies:
  - Authentication (Context API)
  - Server state (React Query)
  - Form state (React Hook Form)
  - Local UI state
- API integration and interceptors
- Mock API mode for development
- Real-time communication (Socket.io)
- Component architecture and patterns
- Navigation system
- Styling system (Tailwind CSS, Material-UI)
- Performance optimization
- Error handling
- Testing strategy
- Accessibility
- Build and deployment
- Best practices

**Use this** when developing frontend features or understanding UI architecture.

---

### 5. [Authentication & Authorization](./authentication-flow.md)
**Complete auth system documentation**

Topics covered:
- Authentication methods:
  - Local (Email/Password + OTP)
  - Google OAuth 2.0
- Detailed flow diagrams for:
  - Registration with OTP
  - OTP verification
  - Login
  - Google OAuth
- JWT token structure and management
- Authorization flow and middleware
- Role-based access control (RBAC)
- Permission matrix
- Security best practices
- Error handling
- Token refresh (planned)
- Logout flow
- Testing authentication
- Troubleshooting guide

**Use this** when implementing or debugging authentication features.

---

## 🚀 Quick Start Guide

### For Developers

1. **First Time Setup**:
   - Read [Overview](./overview.md) to understand the system
   - Review [Database Schema](./database-schema.md) to understand data models
   - Check [Authentication Flow](./authentication-flow.md) for auth implementation

2. **Backend Development**:
   - Reference [API Documentation](./api.md) for endpoint specifications
   - Use [Database Schema](./database-schema.md) for data operations
   - Follow [Authentication Flow](./authentication-flow.md) for protected routes

3. **Frontend Development**:
   - Study [Frontend Architecture](./frontend-architecture.md) for structure
   - Use [API Documentation](./api.md) for API integration
   - Reference [Authentication Flow](./authentication-flow.md) for auth implementation

### For API Consumers

1. Start with [API Documentation](./api.md)
2. Review [Authentication Flow](./authentication-flow.md) for auth requirements
3. Check [Database Schema](./database-schema.md) for data structure understanding

### For System Administrators

1. Read [Overview](./overview.md) for system capabilities
2. Review [Database Schema](./database-schema.md) for backup/recovery
3. Check deployment sections in [Overview](./overview.md)

---

## 🔍 Finding Information

### By Topic

| Topic | Document | Section |
|-------|----------|---------|
| User Roles | [Overview](./overview.md) | User Roles & Permissions |
| API Endpoints | [API Documentation](./api.md) | API Endpoints |
| Database Tables | [Database Schema](./database-schema.md) | Tables |
| Authentication | [Auth Flow](./authentication-flow.md) | All sections |
| Frontend Components | [Frontend Architecture](./frontend-architecture.md) | Component Architecture |
| Real-time Features | [Overview](./overview.md) | Real-time Updates |
| Security | [Auth Flow](./authentication-flow.md) | Security Best Practices |
| Deployment | [Overview](./overview.md) | Deployment |

### By User Role

**Admin**:
- [Overview](./overview.md) - Admin permissions
- [API Documentation](./api.md) - Staff management endpoints
- [Database Schema](./database-schema.md) - Full data access

**Kitchen Staff**:
- [API Documentation](./api.md) - Order management endpoints
- [Frontend Architecture](./frontend-architecture.md) - Kitchen interface

**Reception Staff**:
- [API Documentation](./api.md) - Reservation endpoints
- [Frontend Architecture](./frontend-architecture.md) - Reception interface

**Inventory Staff**:
- [API Documentation](./api.md) - Inventory endpoints
- [Database Schema](./database-schema.md) - Inventory tables

**Customer**:
- [API Documentation](./api.md) - Customer endpoints
- [Frontend Architecture](./frontend-architecture.md) - Customer interface

---

## 📝 Documentation Standards

All documentation follows these standards:

- **Clear Structure**: Hierarchical organization with table of contents
- **Code Examples**: Real, working code snippets
- **Diagrams**: Visual representations of flows and architecture
- **Comprehensive**: Covers all aspects of the topic
- **Up-to-date**: Reflects current implementation
- **Searchable**: Well-organized with clear headings

---

## 🔄 Keeping Documentation Updated

When making changes to the system:

1. **Code Changes**: Update relevant documentation
2. **New Features**: Add to appropriate document
3. **API Changes**: Update [API Documentation](./api.md)
4. **Database Changes**: Update [Database Schema](./database-schema.md)
5. **Architecture Changes**: Update [Overview](./overview.md) and [Frontend Architecture](./frontend-architecture.md)

---

## 📞 Support

For questions or clarifications:

1. Check the relevant documentation first
2. Review code comments and inline documentation
3. Check existing issues and pull requests
4. Consult with the development team

---

## 📄 Additional Resources

### Project Root Files

- `README.md` - Project overview and setup instructions
- `QUICKSTART.md` - Quick start guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `MANUAL_TESTING_GUIDE.md` - Testing procedures
- Various implementation plans and status documents

### Code Documentation

- Backend: JSDoc comments in TypeScript files
- Frontend: Component prop types and inline comments
- Database: Prisma schema comments

---

## 🎯 Documentation Goals

This documentation aims to:

1. **Onboard new developers** quickly and effectively
2. **Serve as reference** for existing team members
3. **Document decisions** and architectural choices
4. **Enable maintenance** and future development
5. **Support API consumers** with clear specifications
6. **Facilitate testing** with comprehensive guides

---

## 📊 Documentation Coverage

| Area | Coverage | Document |
|------|----------|----------|
| System Architecture | ✅ Complete | [Overview](./overview.md) |
| API Endpoints | ✅ Complete | [API Documentation](./api.md) |
| Database Schema | ✅ Complete | [Database Schema](./database-schema.md) |
| Frontend Architecture | ✅ Complete | [Frontend Architecture](./frontend-architecture.md) |
| Authentication | ✅ Complete | [Auth Flow](./authentication-flow.md) |
| Deployment | ✅ Complete | [Overview](./overview.md) |
| Testing | ⚠️ Partial | Various guides in root |
| Monitoring | 🔄 Planned | Future addition |

---

## 🚧 Future Documentation

Planned additions:

1. **Performance Optimization Guide**
2. **Monitoring and Logging Guide**
3. **Troubleshooting Guide**
4. **Contributing Guidelines**
5. **Code Style Guide**
6. **Testing Best Practices**
7. **CI/CD Pipeline Documentation**
8. **Production Deployment Guide**

---

**Last Updated**: 2026-07-30

**Version**: 1.0.0

**Maintained By**: Development Team
