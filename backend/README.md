# Video Streaming Backend

Express.js backend with Socket.io for real-time video processing updates.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Data models
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── storage/             # File storage
└── package.json
```

## Running the Server

Development mode with auto-restart:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## API Endpoints

See main README.md for complete API documentation.

## Database

Uses in-memory simulation of MongoDB. Data is reset on server restart.

For production, replace with actual MongoDB connection in `src/config/db.js`.
