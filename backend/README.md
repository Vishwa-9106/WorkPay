# WorkPay Backend

Express.js backend API for the WorkPay application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - API health status

## Environment Variables

Create a `.env` file based on `.env.example`:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests

## Project Structure

```
backend/
├── src/
│   └── server.js     # Main server file
├── package.json
├── .env.example
└── README.md
```