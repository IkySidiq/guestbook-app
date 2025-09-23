# BukuTamu API Setup Guide

## Setup Environment Variables

Create a .env file in the root directory and fill in your own values:

## Server configuration
* HOST=localhost
* PORT=5000
* PGUSER=your_postgres_username
* PGHOST=localhost
* PGPASSWORD=your_postgres_password
* PGDATABASE=buku_tamu
* PGPORT=5432
* ACCESS_TOKEN_KEY=your_secure_access_token_secret
* REFRESH_TOKEN_KEY=your_secure_refresh_token_secret
* ACCESS_TOKEN_AGE=1800
* SMTP_HOST=your_smtp_host
* SMTP_PORT=your_smtp_port
* SMTP_USER=your_smtp_username
* SMTP_PASSWORD=your_smtp_password

## RabbitMQ
RABBITMQ_SERVER=amqp://localhost

## Redis
REDIS_SERVER=localhost


## Features
* User registration, authentication, and authorization (role-based access for admins)
* Guest book management (add, edit, delete, finish, and list guest entries with pagination)
* Guest member management (add individual or bulk members to guest books)
* Reservation management (create, edit, delete, list with pagination, and mark as visited to convert to guest book)
* Activity logging for all CRUD operations on users, reservations, and guest books
* Refresh token handling for secure sessions
* Payment notification processing (for bookings/reservations)
* Data validation and error handling (invariant, not found, authentication, and authorization errors)
* Secure password hashing and credential verification
* Pagination and filtering for user and reservation lists

## Technology Stack
* Node.js
* Hapi.js
* PostgreSQL
* bcrypt for password hashing
* JWT (@hapi/jwt)
* nanoid for generating unique IDs
* Joi for input validation
* node-pg-migrate for database migrations
* ESLint for code linting
* Nodemon for development

## Install Dependencies
npm install

## Database Migration
npm run migrate

## Running the Server
npm run start:dev    # development with nodemon

## Code Quality
npm run lint       # check code style with ESLint

## Script Overview
* start:dev – run server with nodemon for development
* migrate – run database migrations
* lint – check code style with ESLint

# BukuTamu API Documentation

## Authentication Endpoints
POST /authentications
Description: Authenticate a user and generate access and refresh tokens.
Authentication: None (public endpoint).

Request Body:
```json
{
  "username": "string (required, unique username)",
  "password": "string (required, user's password)"
}
```

Response Body (201):
```json
{
  "status": "success",
  "message": "Authentication berhasil ditambahkan",
  "data": {
    "accessToken": "string (JWT access token)",
    "refreshToken": "string (JWT refresh token)"
  }
}
```

PUT /authentications
Description: Refresh an expired access token using a valid refresh token.
Authentication: None (public endpoint, but requires refresh token in body).

Request Body:
```json
{
  "refreshToken": "string (required, valid refresh token)"
}
```

Response Body (200):
```json
{
  "status": "success",
  "message": "Access Token berhasil diperbarui",
  "data": {
    "accessToken": "string (new JWT access token)"
  }
}
```

DELETE /authentications
Description: Invalidate and delete a refresh token (logout).
Authentication: None (public endpoint, but requires refresh token in body).

Request Body:
```json
{
  "refreshToken": "string"
}
```

Response Body(201):
```json
{
  "status": "success",
  "message": "Refresh token berhasil dihapus"
}
```

## Guest-book Endpoints
POST /guest-book
Description: Create a new guest book entry with optional members. Automatically logs the activity.
Authentication: Required (JWT token).

Request Body:
```json
{
  "address": "string (required, visitor's address)",
  "purpose": "string (required, purpose of visit)",
  "institution": "string (required, institution/organization name)",
  "contactInfo": "string (required, contact information like email/phone)",
  "members": "array (optional, list of guest members; each object: { \"name\": \"string\" })"
}
```

Response Body (201):
```json
{
  "status": "success",
  "data": {
    "id": "string (guest book ID)",
    "logId": "string (activity log ID)",
    "memberIds": "array (IDs of added members, if members provided)"
  }
}
```

GET /guest-book
Description: Retrieve a paginated list of guest books, optionally filtered by status.
Authentication: None (public endpoint).

Query Parameters:
status (optional, string: e.g., "sedang bertamu", "selesai")
page (optional, integer, default: 1)
limit (optional, integer, default: 10)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "data": "array (list of guest books: each { \"created_at\": \"ISO date\", \"institution\": \"string\", \"status\": \"string\", \"check_in\": \"ISO date\", \"check_out\": \"ISO date\", \"total_guest\": integer })",
    "page": integer,
    "limit": integer,
    "totalItems": integer,
    "totalPages": integer
  }
}
```

GET /guest-book/{targetId}
Description: Retrieve a specific guest book entry by ID.
Authentication: None (public endpoint).

Path Parameters:
targetId (required, string: guest book ID)
Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "address": "string",
    "purpose": "string",
    "created_at": "ISO date",
    "institution": "string",
    "accepted_by": "string (user ID)",
    "status": "string",
    "check_out": "ISO date",
    "check_in": "ISO date",
    "total_guest": integer
  }
}
```

PUT /guest-book/{targetId}
Description: Update an existing guest book entry (address, purpose, institution). Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
targetId (required, string: guest book ID)

Request Body:
```json
{
  "address": "string (required, updated address)",
  "purpose": "string (required, updated purpose)",
  "institution": "string (required, updated institution)",
  "contactInfo": "string (optional, updated contact info)",
  "members": "array (optional, updated members list)"
}
```

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (updated guest book ID)",
    "logId": "string (activity log ID)"
  }
}
```

DELETE /guest-book/{targetId}
Description: Delete a guest book entry. Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
targetId (required, string: guest book ID)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (deleted guest book ID)",
    "logId": "string (activity log ID)"
  }
}
```

PATCH /guest-book/{targetId}/finish
Description: Mark a guest book entry as finished (update status to "selesai"). Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
targetId (required, string: guest book ID)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (updated guest book ID)",
    "logId": "string (activity log ID)"
  }
}
```

POST /guest-book/{id}/members/bulk
Description: Add multiple guest members in bulk to an existing guest book. Requires admin role.
Authentication: Required (JWT token, admin only).

Path Parameters:
id (required, string: guest book ID)

Request Body:
```json
{
  "members": "array (required, list of members; each object: { \"name\": \"string\" })"
}
```

Response Body (201):
```json
{
  "status": "success",
  "message": "N anggota tamu berhasil ditambahkan (N = number of members)"
}
```

## Reservation Endpoints
POST /reservations
Description: Create a new reservation. Automatically logs the activity.
Authentication: Required (JWT token).

Request Body:
```json
{
  "name": "string (required, reservant's name)",
  "contactInfo": "string (required, contact information)",
  "purpose": "string (required, purpose of reservation)",
  "institution": "string (required, institution/organization)",
  "reservationDate": "ISO date (required, reservation date)",
  "address": "string (required, address)"
}
```

Response Body (201):
```json
{
  "status": "success",
  "data": {
    "id": "string (reservation ID)",
    "logId": "string (activity log ID)"
  }
}
```

GET /reservations
Description: Retrieve a paginated list of reservations, optionally filtered by status.
Authentication: None (public endpoint).

Query Parameters:
status (optional, string: e.g., "pending", "accepted")
page (optional, integer, default: 1)
limit (optional, integer, default: 10)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "data": "array (list of reservations: each { \"id\": \"string\", \"name\": \"string\", \"institution\": \"string\", \"reservation_date\": \"ISO date\", \"created_by\": \"string (user ID)\" })",
    "page": integer,
    "limit": integer,
    "totalItems": integer,
    "totalPages": integer
  }
}
```

GET /reservations/{id}
Description: Retrieve a specific reservation by ID.
Authentication: None (public endpoint).

Path Parameters:
id (required, string: reservation ID)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "name": "string",
    "contact_info": "string",
    "purpose": "string",
    "institution": "string",
    "reservation_date": "ISO date",
    "created_at": "ISO date",
    "updated_at": "ISO date",
    "created_by": "string (user ID)"
  }
}
```

PUT /reservations/{id}
Description: Update an existing reservation. Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
id (required, string: reservation ID)

Request Body:
```json
{
  "name": "string (required, updated name)",
  "contactInfo": "string (required, updated contact info)",
  "purpose": "string (required, updated purpose)",
  "institution": "string (required, updated institution)",
  "reservationDate": "ISO date (required, updated date)",
  "address": "string (required, updated address)"
}
```

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (updated reservation ID)",
    "logId": "string (activity log ID)"
  }
}
```

DELETE /reservations/{id}
Description: Delete a reservation. Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
id (required, string: reservation ID)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (deleted reservation ID)",
    "logId": "string (activity log ID)"
  }
}
```

POST /reservations/{id}/visited
Description: Mark a reservation as visited, converting it to a guest book entry (status to "accepted", creates guest book). Requires admin role. Logs activities.
Authentication: Required (JWT token, admin only).

Path Parameters:
id (required, string: reservation ID)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "guestBookId": "string (new guest book ID)",
    "reservationId": "string (updated reservation ID)"
  }
}
```
## Users Endpoints
POST /users
Description: Create a new user account. Password is hashed automatically. Logs the activity.
Authentication: None (public endpoint, but typically admin-initiated).

Request Body:
```json
{
  "name": "string (required, full name)",
  "position": "string (required, job position)",
  "username": "string (required, unique username)",
  "password": "string (required, password, min 8 chars)"
}
```

Response Body (201):
```json
{
  "status": "success",
  "data": {
    "id": "string (user ID)",
    "logId": "string (activity log ID)"
  }
}
```

GET /users
Description: Retrieve a paginated list of active users, optionally filtered by position or role.
Authentication: None (public endpoint).

Query Parameters:
position (optional, string: e.g., "manager")
role (optional, string: e.g., "admin")
page (optional, integer, default: 1)
limit (optional, integer, default: 10)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "data": "array (list of users: each { \"id\": \"string\", \"name\": \"string\", \"username\": \"string\", \"position\": \"string\", \"role\": \"string\" })",
    "page": integer,
    "limit": integer,
    "totalItems": integer,
    "totalPages": integer
  }
}
```

PUT /users/{targetId}
Description: Update a user account (name, position, username, password). Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
targetId (required, string: user ID to update)

Request Body:
```json
{
  "name": "string (required, updated name)",
  "position": "string (required, updated position)",
  "username": "string (required, updated unique username)",
  "password": "string (required, updated password)"
}
```

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (updated user ID)",
    "logId": "string (activity log ID)"
  }
}
```

DELETE /users/{targetId}
Description: Delete a user account. Requires admin role. Logs the activity.
Authentication: Required (JWT token, admin only).

Path Parameters:
targetId (required, string: user ID to delete)

Response Body (200):
```json
{
  "status": "success",
  "data": {
    "id": "string (deleted user ID)",
    "logId": "string (activity log ID)"
  }
}
```

# Additional Notes
Roles: Users have roles like "admin" for authorization checks.
Activity Logging: All CRUD operations are logged in an active_logs table for auditing.
Security: Passwords are hashed with bcrypt. JWT tokens expire (access: 30 min, configurable). Refresh tokens are stored in DB.
Testing: Use tools like Postman or Insomnia. Ensure PostgreSQL is running and migrated.
Limitations: No file uploads or external integrations shown in code. Payment notifications are handled but not exposed as endpoints here.
Extensibility: Add more endpoints for notifications or exports as needed.