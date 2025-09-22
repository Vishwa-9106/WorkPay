# WorkPay

A full-stack application for managing work and payments.

## Project Structure

```
WorkPay/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/           # Node.js + Express backend API
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Development

```bash
cd backend
npm install
npm run dev
```

The backend will be available at `http://localhost:5000`

## Features

- Modern React frontend with TypeScript
- Express.js backend with RESTful API
- Tailwind CSS for styling
- Component library with shadcn/ui
- Internationalization support

## Development

1. Start the backend server first
2. Start the frontend development server
3. Both servers support hot reload for development

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests