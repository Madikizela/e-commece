# E-Commerce Website

Full-stack e-commerce application with C# ASP.NET Core backend, React frontend, and PostgreSQL database.

## Setup Instructions

### 1. Database Setup
Install PostgreSQL and create a database:
```sql
CREATE DATABASE ecommerce;
```

Update the connection string in `backend/appsettings.json` with your PostgreSQL credentials.

### 2. Backend Setup
```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```
Backend will run on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend-app
npm install
npm run dev
```
Frontend will run on http://localhost:5173

## Features

### Admin Panel
- **Product Management**: Add, edit, delete products at `/admin/products`
- **Order Management**: View and update order status at `/admin/orders`

### Customer Features
- Browse products on home page
- View product details with pricing and stock

## API Endpoints

### Products
- GET `/api/products` - Get all products
- GET `/api/products/{id}` - Get product by ID
- POST `/api/products` - Create product
- PUT `/api/products/{id}` - Update product
- DELETE `/api/products/{id}` - Delete product

### Orders
- GET `/api/orders` - Get all orders
- GET `/api/orders/{id}` - Get order by ID
- POST `/api/orders` - Create order
- PUT `/api/orders/{id}/status` - Update order status

## Tech Stack
- **Backend**: C# ASP.NET Core 9.0, Entity Framework Core, PostgreSQL
- **Frontend**: React, React Router v7
- **Database**: PostgreSQL
