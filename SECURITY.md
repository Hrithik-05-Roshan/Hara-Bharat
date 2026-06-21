# Security Policy

## Security Practices
- **API Key Management**: All API keys (e.g., Google Gemini API key) are loaded strictly from environment variables and never hardcoded in the source files.
- **PIN Hashing**: User PINs are hashed using bcrypt before they are stored in the database. Raw PINs are never stored.
- **Input Validation**: All API endpoint inputs are validated using Pydantic schemas with strict Field constraints, including minimum/maximum length checks and regex patterns.
- **SQL Injection Prevention**: SQL injection is prevented by querying the database exclusively via the SQLAlchemy ORM. There are zero raw SQL query strings in the codebase.
- **CORS Policy**: CORS is configured to allow only specific, trusted origins (such as the frontend URL).
- **Rate Limiting**: Rate limiting is enforced on critical endpoints via `slowapi`:
  - `/api/chat` is limited to 20 requests per minute.
  - `/api/users/login` is limited to 5 requests per minute.
- **XSS Prevention**: All user-generated content is sanitized before being rendered in the React frontend.
- **Sensitive Client Data**: No sensitive user data is stored in the browser's `localStorage`. Only the non-sensitive `user_id` is kept client-side for session tracking.
- **Environment Safety**: The `.env` configuration file containing secrets is excluded from version control via `.gitignore`.
- **Security Headers**: Essential security headers (`X-Content-Type-Options`, `X-Frame-Options`, and `X-XSS-Protection`) are injected into all backend responses via FastAPI middleware.

## Environment Variables
Always use `.env.example` as a template for local environment configuration. Do not commit `.env` files.

## Reporting a Vulnerability
Please report any security vulnerabilities via GitHub Issues.
