# API Key Documentation

This application now supports API key authentication, allowing users to programmatically access their data.

## Getting Started

1. **Create an API Key**: Use the web interface or call `POST /api/api-keys`
2. **Use the API Key**: Include it in requests as `X-API-Key` header or `Authorization: Bearer` header
3. **Access Your Data**: Use the `/api/user-data` endpoint to fetch your files and metadata

## API Endpoints

### API Key Management

#### Create API Key
```http
POST /api/api-keys
Content-Type: application/json

{
  "keyName": "My Integration",
  "permissions": ["read", "write"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### List API Keys
```http
GET /api/api-keys
```

#### Revoke API Key
```http
DELETE /api/api-keys?keyId=uuid&action=revoke
```

### User Data Access

#### Get Overview
```http
GET /api/user-data?type=overview
X-API-Key: sk_your_api_key_here
```

Response includes:
- User profile information
- Storage usage statistics
- Recent files summary

#### List Files
```http
GET /api/user-data?type=files&prefix=folder&limit=50&includeContent=true
X-API-Key: sk_your_api_key_here
```

Parameters:
- `prefix`: Filter files by folder/path prefix
- `limit`: Maximum number of files to return (default: 100)
- `includeContent`: Include pre-signed download URLs (default: false)

#### List Folders
```http
GET /api/user-data?type=folders
X-API-Key: sk_your_api_key_here
```

#### Storage Statistics
```http
GET /api/user-data?type=storage
X-API-Key: sk_your_api_key_here
```

## Authentication Methods

### API Key (Header)
```http
X-API-Key: sk_your_api_key_here
```

### API Key (Bearer Token)
```http
Authorization: Bearer sk_your_api_key_here
```

### Web Session (Clerk)
Automatically handled when logged in through the web interface.

## Permissions

- **read**: Access to view files, folders, and metadata
- **write**: Upload and modify files (if implemented)
- **delete**: Delete files and folders (if implemented)

## Security Best Practices

1. **Store API Keys Securely**: Never commit API keys to version control
2. **Use Environment Variables**: Store keys in environment variables or secure key management
3. **Rotate Keys Regularly**: Create new keys and revoke old ones periodically
4. **Limit Permissions**: Only grant the minimum permissions needed
5. **Set Expiration Dates**: Use time-limited keys when possible

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid or missing API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Examples

### Node.js Example
```javascript
const axios = require('axios');

const apiKey = 'sk_your_api_key_here';
const baseURL = 'https://your-app.com/api';

async function getUserFiles() {
  try {
    const response = await axios.get(`${baseURL}/user-data?type=files`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    console.log('Files:', response.data.files);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python Example
```python
import requests

api_key = 'sk_your_api_key_here'
base_url = 'https://your-app.com/api'

headers = {'X-API-Key': api_key}

# Get user overview
response = requests.get(f'{base_url}/user-data?type=overview', headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"Storage used: {data['storage']['used']} bytes")
else:
    print(f"Error: {response.json()}")
```

### cURL Example
```bash
# Create API key
curl -X POST https://your-app.com/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"keyName": "Test Key", "permissions": ["read"]}'

# Use API key to get files
curl -X GET "https://your-app.com/api/user-data?type=files" \
  -H "X-API-Key: sk_your_api_key_here"
```
