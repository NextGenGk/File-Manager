# S3-UI: Modern File Management Interface

A sleek, production-ready web application for managing AWS S3 files with a beautiful glass morphism UI design. Built with Next.js 15, TypeScript, and modern React patterns.

![S3-UI Demo](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=S3-UI+Modern+Interface)

## ✨ Features

### 🎨 Modern UI/UX
- **Glass Morphism Design** - Beautiful translucent interface with backdrop blur effects
- **Framer Motion Animations** - Smooth, professional animations throughout the app
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile devices
- **Dark Theme** - Elegant dark interface with grid background patterns
- **Professional Navigation** - Breadcrumb navigation and intuitive user flows

### 🔐 Authentication & Security
- **Clerk Authentication** - Secure user authentication with social logins
- **API Key Management** - Generate and manage API keys for programmatic access
- **Permission-Based Access** - Granular permissions (read, write, delete) for API keys
- **Security Headers** - Production-ready security headers and CSP policies
- **Input Validation** - Comprehensive request validation and sanitization

### 📁 File Management
- **Drag & Drop Upload** - Intuitive file upload with visual feedback
- **Multiple File Selection** - Upload multiple files simultaneously
- **File Preview** - View file details, sizes, and metadata
- **Download Files** - Secure file download with progress tracking
- **Delete Files** - Safe file deletion with confirmation dialogs
- **Search & Filter** - Find files quickly with built-in search functionality

### 🚀 Performance & Reliability
- **Next.js 15** - Latest Next.js with App Router and React 19
- **TypeScript** - Full type safety throughout the application
- **Error Boundaries** - Graceful error handling and user feedback
- **Loading States** - Professional loading indicators and skeleton screens
- **Health Monitoring** - Built-in health check endpoints for monitoring
- **Production Optimized** - Minified bundles, image optimization, and caching

### 🔌 API Integration
- **RESTful API** - Clean, documented API endpoints
- **AWS S3 Integration** - Direct integration with AWS S3 for file storage
- **Supabase Database** - PostgreSQL database for user data and metadata
- **Real-time Updates** - Live updates when files are added or removed

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **UI Components**: Radix UI, Custom Glass Components
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3
- **Deployment**: Vercel, Node.js

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- AWS S3 bucket
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/s3-ui.git
   cd s3-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment**
   
   Edit `.env` with your credentials:
   ```bash
   # Application
   NODE_ENV=development
   APP_URL=http://localhost:3001
   PORT=3001

   # Database (Supabase)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

   # AWS S3
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET_NAME=your_s3_bucket_name

   # Security
   JWT_SECRET=your_jwt_secret_64_characters
   ENCRYPTION_KEY=your_encryption_key_32_characters
   ```

5. **Set up the database**
   
   Run the SQL schema in your Supabase database:
   ```bash
   # Copy the contents of supabase-schema.sql and run it in your Supabase SQL editor
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3001](http://localhost:3001)

## 📚 API Documentation

### Authentication

The API supports multiple authentication methods:

1. **Session Authentication** - Automatic when signed in through the web interface via Clerk
2. **API Key Authentication** - Use `X-API-Key` header or `Authorization: Bearer <key>` (for programmatic access)

### Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

### Response Format
All API responses follow a consistent JSON format:
```json
{
  "success": true,
  "data": {},
  "error": "Error message (if applicable)",
  "message": "Success message (if applicable)"
}
```

### Endpoints

#### File Operations

##### Upload File
**`POST /api/upload`**

Upload a single file to S3 storage.

- **Authentication**: Required (Session or API Key)
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `file` (File, required) - The file to upload
  - `prefix` (string, optional) - Directory prefix for the file

**Example Request:**
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('prefix', 'documents/'); // optional

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here' // if using API key auth
  },
  body: formData
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "key": "documents/example.pdf",
  "size": 1048576
}
```

**Error Responses:**
- `401` - Unauthorized (missing or invalid authentication)
- `400` - Bad request (no file provided, storage quota exceeded)
- `404` - User storage not configured
- `500` - Server error

##### List Files
**`GET /api/objects`**

Retrieve all files for the authenticated user.

- **Authentication**: Required (Session or API Key)
- **Query Parameters**: None

**Example Request:**
```javascript
const response = await fetch('/api/objects', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});
```

**Success Response (200):**
```json
{
  "files": [
    {
      "id": "uuid",
      "file_name": "example.pdf",
      "file_size": 1048576,
      "content_type": "application/pdf",
      "uploaded_at": "2024-01-01T12:00:00Z",
      "s3_key": "documents/example.pdf"
    }
  ]
}
```

##### Download File
**`GET /api/download`**

Generate a secure download URL for a file.

- **Authentication**: Required (Session or API Key)
- **Query Parameters**:
  - `key` (string, required) - The file key/path
  - `method` (string, optional) - Download method (`presigned` or `direct`, default: `presigned`)

**Example Request:**
```javascript
const response = await fetch('/api/download?key=documents/example.pdf&method=presigned', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/bucket/signed-url",
  "expiresIn": 3600
}
```

##### Delete File
**`DELETE /api/delete`**

Delete a file from S3 storage and database.

- **Authentication**: Required (Session or API Key)
- **Content-Type**: `application/json`
- **Body Parameters**:
  - `key` (string, required) - The file key/path to delete

**Example Request:**
```javascript
const response = await fetch('/api/delete', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  body: JSON.stringify({
    key: 'documents/example.pdf'
  })
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### API Key Management

##### List API Keys
**`GET /api/api-keys`**

Retrieve all API keys for the authenticated user.

- **Authentication**: Required (Session only)

**Success Response (200):**
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "key_name": "Mobile App Key",
      "api_key": "ak_1234567890abcdef...",
      "permissions": ["read", "write"],
      "is_active": true,
      "last_used": "2024-01-01T12:00:00Z",
      "expires_at": null,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

##### Create API Key
**`POST /api/api-keys`**

Create a new API key with specified permissions.

- **Authentication**: Required (Session only)
- **Content-Type**: `application/json`
- **Body Parameters**:
  - `keyName` (string, required) - Name for the API key
  - `permissions` (string[], required) - Array of permissions (`read`, `write`, `delete`)

**Example Request:**
```javascript
const response = await fetch('/api/api-keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keyName: 'Mobile App Key',
    permissions: ['read', 'write']
  })
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "API key created successfully",
  "key": "ak_1234567890abcdef...",
  "keyId": "uuid"
}
```

##### Delete API Key
**`DELETE /api/api-keys?keyId=<id>&action=delete`**

Delete an existing API key.

- **Authentication**: Required (Session only)
- **Query Parameters**:
  - `keyId` (string, required) - The API key ID to delete
  - `action` (string, required) - Must be "delete"

**Success Response (200):**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

#### User & System

##### Get User Data
**`GET /api/user-data`**

Retrieve user profile and storage information.

- **Authentication**: Required (Session or API Key)

**Success Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "storage": {
    "used": 52428800,
    "available": 1047619200,
    "total": 1073741824,
    "prefix": "user-user_123"
  },
  "files": [
    {
      "id": "uuid",
      "file_name": "example.pdf",
      "file_size": 1048576,
      "downloadUrl": "https://s3.amazonaws.com/bucket/signed-url"
    }
  ]
}
```

##### Health Check
**`GET /api/health`**

System health check endpoint for monitoring.

- **Authentication**: Not required

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "auth": "healthy"
  },
  "metrics": {
    "memoryUsage": {
      "used": 128,
      "total": 512,
      "percentage": 25
    },
    "requestCount": 1000
  }
}
```

**`HEAD /api/health`** - Readiness probe (returns 200 if ready, 503 if not)

##### Authentication Test
**`GET /api/auth-test`**

Test authentication status and method.

- **Authentication**: Required (Session or API Key)

**Success Response (200):**
```json
{
  "authenticated": true,
  "method": "api_key",
  "userId": "user_123",
  "permissions": ["read", "write"]
}
```

### Error Handling

All endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400,
  "context": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123"
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid parameters, file too large, quota exceeded)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user not found, file not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failed)

### Rate Limiting

API endpoints are protected with rate limiting:
- **Default limit**: 100 requests per 15 minutes per IP/API key
- **Headers returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

### SDK Examples

#### JavaScript/Node.js
```javascript
class S3UIClient {
  constructor(apiKey, baseUrl = 'https://your-domain.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async uploadFile(file, prefix = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (prefix) formData.append('prefix', prefix);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'X-API-Key': this.apiKey },
      body: formData
    });

    return response.json();
  }

  async listFiles() {
    const response = await fetch(`${this.baseUrl}/api/objects`, {
      headers: { 'X-API-Key': this.apiKey }
    });

    return response.json();
  }

  async deleteFile(key) {
    const response = await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ key })
    });

    return response.json();
  }
}

// Usage
const client = new S3UIClient('your-api-key');
await client.uploadFile(fileObject, 'documents/');
```

#### Python
```python
import requests

class S3UIClient:
    def __init__(self, api_key, base_url="https://your-domain.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"X-API-Key": api_key}

    def upload_file(self, file_path, prefix=""):
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'prefix': prefix} if prefix else {}
            
            response = requests.post(
                f"{self.base_url}/api/upload",
                headers=self.headers,
                files=files,
                data=data
            )
            
        return response.json()

    def list_files(self):
        response = requests.get(
            f"{self.base_url}/api/objects",
            headers=self.headers
        )
        return response.json()

    def delete_file(self, key):
        response = requests.delete(
            f"{self.base_url}/api/delete",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"key": key}
        )
        return response.json()

# Usage
client = S3UIClient("your-api-key")
client.upload_file("document.pdf", "documents/")
```

## 🎨 UI Components

### Glass Morphism Design System

The app features a custom glass morphism design system:

- **GlassCard** - Translucent cards with backdrop blur
- **Loading Spinners** - Animated loading indicators
- **File Upload Zone** - Drag & drop area with visual feedback
- **Professional Modals** - Glass morphism modal dialogs
- **Breadcrumb Navigation** - Intuitive navigation component

### Animation System

Built with Framer Motion for smooth, professional animations:

- Page transitions
- Component entrance animations
- Hover effects and micro-interactions
- Loading state animations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | ✅ |
| `JWT_SECRET` | Secret for API key generation | ✅ |
| `ENCRYPTION_KEY` | 32-character encryption key | ✅ |

### File Upload Limits

- **Maximum file size**: 100MB (configurable via `MAX_FILE_SIZE`)
- **Maximum files per user**: 1000 (configurable via `MAX_FILES_PER_USER`)
- **Supported formats**: All file types

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Add environment variables** in Vercel dashboard

### Traditional Hosting

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Health Monitoring

The application includes built-in health monitoring:

- **Health Check**: `GET /api/health`
- **Readiness Check**: `HEAD /api/health`
- **Service Status**: Database, Storage, and Auth service monitoring

## 🛡️ Security Features

- **CORS Protection** - Configured for production domains
- **Security Headers** - CSP, XSS protection, and frame options
- **Input Validation** - Server-side validation for all inputs
- **Error Handling** - Secure error messages that don't expose internals
- **API Key Encryption** - Encrypted storage of API keys
- **Permission System** - Granular API key permissions

## 🔍 Monitoring & Debugging

### Development Tools

- **TypeScript** - Full type checking
- **ESLint** - Code quality and consistency
- **Error Boundaries** - Graceful error handling in React
- **Structured Logging** - Contextual logging throughout the app

### Production Monitoring

- Health check endpoints for uptime monitoring
- Memory usage tracking
- Request logging and metrics
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Clerk](https://clerk.dev/) - Authentication and user management
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Framer Motion](https://www.framer.com/motion/) - Production-ready motion library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives

---

**Built with ❤️ using modern web technologies**
