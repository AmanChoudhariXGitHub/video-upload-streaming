# Video Upload and Streaming Platform

A full-stack video upload and streaming application with real-time processing updates, built with Next.js, Express, and Socket.io.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/aman-choudharis-projects-0f1050b2/v0-video-upload-streaming)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/sPAPhnKAE7v)

## Features

- **Chunked Video Upload** - Upload large videos in 5MB chunks with progress tracking
- **Real-time Processing** - Socket.io updates for format conversion, compression, and analysis
- **HTTP Range Streaming** - Efficient video streaming with partial content support
- **Role-Based Access Control** - Admin, Editor, and Viewer roles with proper permissions
- **Content Moderation** - Automated sensitivity analysis with admin review
- **Multi-Tenancy** - Complete tenant isolation for data segregation
- **HLS/DASH Support** - Adaptive streaming manifest generation
- **Analytics Tracking** - View counts and engagement metrics

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Socket.io Client** - Real-time updates
- **Shadcn/ui** - UI component library
- **Tailwind CSS** - Styling

### Backend
- **Node.js + Express** - REST API server
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication and authorization
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

## Project Structure

```
video-upload-streaming/
├── frontend/                # Next.js frontend application
│   ├── app/                # Next.js app directory
│   │   ├── admin/         # Admin dashboard
│   │   ├── dashboard/     # User dashboard
│   │   ├── login/         # Login page
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── auth-provider.tsx
│   │   ├── video-uploader.tsx
│   │   ├── video-player.tsx
│   │   ├── user-dashboard.tsx
│   │   └── admin-dashboard.tsx
│   ├── lib/              # Utilities
│   │   ├── api-client.ts
│   │   └── socket-client.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── .env.local
├── backend/              # Express backend server
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utilities
│   │   └── server.js    # Entry point
│   ├── storage/         # File storage (uploads, processed)
│   ├── package.json
│   └── .env
├── README.md
└── DEPLOYMENT-GUIDE.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-upload-streaming
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Configure environment variables**

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

5. **Start the backend server**
```bash
cd backend
npm run dev
```

6. **Start the frontend (in a new terminal)**
```bash
cd frontend
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Demo Accounts

The application comes with pre-configured demo accounts:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@example.com | admin123 | Admin | Full access, content moderation |
| editor@example.com | editor123 | Editor | Upload and manage own videos |
| viewer@example.com | viewer123 | Viewer | View approved content only |

## API Documentation

### Authentication

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "editor"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Video Upload

**POST** `/api/videos/init` - Initialize upload
```json
{
  "filename": "video.mp4",
  "filesize": 1048576,
  "mimetype": "video/mp4",
  "title": "My Video",
  "description": "Description"
}
```

**POST** `/api/videos/chunk` - Upload chunk (multipart/form-data)
- `videoId`: Video ID
- `chunkIndex`: Current chunk index
- `totalChunks`: Total number of chunks
- `chunk`: File chunk (binary)

**POST** `/api/videos/complete` - Complete upload
```json
{
  "videoId": "123",
  "totalChunks": 10
}
```

### Video Management

**GET** `/api/videos` - List all videos (filtered by role)

**GET** `/api/videos/:id` - Get video details

**PUT** `/api/videos/:id` - Update video metadata
```json
{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

**DELETE** `/api/videos/:id` - Delete video

### Streaming

**GET** `/api/stream/:id/video` - Stream video with HTTP range support

**GET** `/api/stream/:id/video.m3u8` - HLS manifest

**GET** `/api/stream/:id/manifest.mpd` - DASH manifest

**GET** `/api/stream/:id/thumbnail` - Video thumbnail

### Admin

**GET** `/api/admin/stats` - Platform statistics

**GET** `/api/admin/users` - List all users

**PUT** `/api/admin/users/:id/role` - Update user role
```json
{
  "role": "editor"
}
```

**PUT** `/api/admin/videos/:id/sensitivity` - Update sensitivity status
```json
{
  "status": "safe"
}
```

**GET** `/api/admin/jobs` - Processing jobs list

### Analytics

**POST** `/api/analytics/track/view` - Track video view
```json
{
  "videoId": "123",
  "watchTime": 120,
  "quality": "1080p"
}
```

**GET** `/api/analytics/video/:id` - Video analytics (admin only)

**GET** `/api/analytics/platform` - Platform analytics (admin only)

## Socket.io Events

### Client → Server

- `subscribe:video` - Subscribe to video updates
- `unsubscribe:video` - Unsubscribe from video updates

### Server → Client

- `upload:progress` - Upload progress update
- `upload:complete` - Upload completed
- `processing:started` - Processing started
- `processing:progress` - Processing progress update
- `processing:step` - Processing step update
- `processing:completed` - Processing completed
- `processing:error` - Processing error

## Architecture

The application follows a client-server architecture with real-time communication:

- **Frontend**: Next.js app in `/frontend` directory providing UI and user interactions
- **Backend**: Express API in `/backend` directory handling business logic and file operations
- **Real-time Layer**: Socket.io for bidirectional updates
- **Storage**: Local filesystem (can be replaced with S3/cloud storage)
- **Database**: Simulated MongoDB (replace with real MongoDB for production)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Development

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# Backend (no build needed, runs on Node.js)
cd backend
npm start
```

## Deployment

**See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for complete step-by-step instructions.**

### Quick Summary

**Backend → Render/Railway:**
1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy and get backend URL

**Frontend → Vercel:**
1. Import GitHub repository
2. Set root directory to `frontend`
3. Add `NEXT_PUBLIC_API_URL` with backend URL
4. Deploy

**Important:** Deploy backend first, then use its URL in frontend environment variables.

### Deployment Requirements Checklist

✅ **Repository Structure**
```
video-upload-streaming/
  ├── frontend/    (Next.js app)
  ├── backend/     (Express API)
  └── README.md
```

✅ **Backend Features**
- Node.js + Express server
- MongoDB (simulated, ready for real connection)
- Video upload endpoint with chunked uploads
- Video streaming with HTTP range requests
- Simulated sensitivity analysis
- Socket.io real-time progress updates
- JWT authentication + RBAC

✅ **Frontend Features**
- Upload UI with progress tracking
- Real-time processing progress via Socket.io
- Video list with status indicators
- Video player with streaming support
- Admin dashboard for moderation
- User dashboard for management

✅ **Deployment**
- Frontend: Vercel-ready with proper configuration
- Backend: Works on Render, Railway, Fly.io, or Heroku
- Both publicly accessible with production URLs

## Design Decisions

- **Why Simulated Processing?**

The assignment requires simulated video processing to demonstrate the system architecture without heavy FFmpeg dependencies. Real processing can be added by:

1. Installing FFmpeg
2. Replacing simulated functions in `backend/src/services/videoProcessor.js`
3. Using child processes to run FFmpeg commands

- **Why In-Memory Database?**

For simplicity and portability. Production deployment should use:
- MongoDB for data persistence
- Redis for caching
- S3 for file storage

- **Why Socket.io?**

Real-time updates are critical for:
- Upload progress tracking
- Processing status updates
- Live notifications
- Better user experience

## Security Considerations

- JWT tokens with 7-day expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control
- Tenant isolation
- File type validation
- CORS configuration
- HTTP-only cookies (recommended for production)

## Performance Optimizations

- Chunked file uploads (reduces memory usage)
- HTTP range requests (efficient streaming)
- Progress tracking (better UX)
- Simulated CDN caching
- Lazy loading components

## Future Enhancements

- [ ] Real FFmpeg integration
- [ ] AWS S3 storage integration
- [ ] MongoDB Atlas connection
- [ ] Redis caching layer
- [ ] Rate limiting
- [ ] Video transcoding queue
- [ ] Email notifications
- [ ] Search functionality
- [ ] Video tagging
- [ ] Playlist creation
- [ ] Comments system
- [ ] Social sharing

## Contributing

This project was built as an assignment demonstration. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Check [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for deployment help

## Acknowledgments

- Built with [v0.app](https://v0.app)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Live Demo**: [https://vercel.com/aman-choudharis-projects-0f1050b2/v0-video-upload-streaming](https://vercel.com/aman-choudharis-projects-0f1050b2/v0-video-upload-streaming)

**Development Chat**: [https://v0.app/chat/sPAPhnKAE7v](https://v0.app/chat/sPAPhnKAE7v)
