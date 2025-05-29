# Reflective Authorization Service for TechCart

---

## 🚀 Overview

The Reflective Authorization Service is a dedicated microservice designed to handle all aspects of user authentication and authorization within the Reflective system. Built with **Node.js (Express.js)** and integrating with a **PostgreSQL** database using **Prisma ORM**, it provides a robust and secure solution for managing user identities and access control. It also incorporates **OpenTelemetry SDK** for enhanced observability, allowing for distributed tracing and metrics collection.

### Core Functionalities

* **Secure Authentication:** Employs modern security practices including **Argon2** for password hashing and **JWTs (JSON Web Tokens)** with both access and refresh tokens for secure token-based authentication.
* **Authorization:** Supports **Role-Based Access Control (RBAC)** to determine what actions a user is permitted to perform.
* **User Management:** Manages user lifecycle; registration and login, email verification, password resets, and profile retrieval are not yet integrated.

---

## 📦 Architectural Components

This service is structured into several key components to ensure maintainability, scalability, and separation of concerns:

### Application Entry Point (`app.ts`)

The main Express application file. It sets up the server, applies essential middleware (Helmet for security, CORS for cross-origin requests, `express.json` for body parsing, Morgan for logging), defines the base `/api` route, includes a `/health` endpoint for readiness checks, integrates global error handling, and initializes **OpenTelemetry** for tracing.

### Routes (`routes/index.ts`, `routes/auth.routes.ts`)

* `routes/index.ts`: Acts as the central router, mounting `authRoutes` under the `/auth` path (e.g., `/api/auth/...`).
* `routes/auth.routes.ts`: Defines all specific API endpoints related to authentication:
    * `POST /api/auth/register`: New user registration.
    * `POST /api/auth/login`: User authentication and token issuance.
    * `POST /api/auth/refresh`: Obtain a new access token using a refresh token.
    * `GET /api/auth/me`: Fetch the current authenticated user's profile (protected route).
    * `POST /api/auth/logout`: Invalidate refresh tokens and log out.
    * `GET /api/auth/verify-email/:token`: Verify a user's email address.
    * `POST /api/auth/forgot-password`: Initiate a password reset process.
    * `POST /api/auth/reset-password/:token`: Set a new password using a reset token.

### Controllers (`controllers/auth.controller.ts`)

Handle incoming HTTP requests from the routes. They act as a thin layer, receiving request data, calling appropriate business logic methods from `auth.service.ts`, and sending back HTTP responses. For example, `register` extracts user data from the request body and calls `authService.register()`.

### Services (`services/auth.service.ts`)

Contain the core business logic of the authentication service. This includes functions for:

* `register()`: Handles user creation, password hashing, and generating email verification tokens.
* `login()`: Authenticates users, generates access and refresh tokens, and manages token expiration.
* `refreshToken()`: Issues new access tokens based on valid refresh tokens.
* `logout()`: Invalidate refresh tokens.
* `verifyEmail()`: Marks a user's email as verified.
* `forgotPassword()`: Generates and logs (or sends in a real app) a password reset token.
* `resetPassword()`: Allows a user to set a new password using a valid reset token.

They interact directly with the database via Prisma and utilize JWT and password utilities. **OpenTelemetry** is integrated within these services to trace business logic operations.

### Database (`database.ts`, `user.model.ts`)

* `database.ts`: Initializes the Prisma client, configured for logging database queries in development. It also includes a `testConnection` function to verify the database connection on startup.
* `user.model.ts`: Defines TypeScript interfaces for user-related data, including `CreateUserInput` (for registration) and `UserResponse` (for safe user data returned in responses). It also provides a `toUserResponse` helper function to transform Prisma user objects into the `UserResponse` format.

### Middleware

* **`middlewares/auth.middleware.ts`**:
    * `authMiddleware`: Verifies the JWT access token sent in the Authorization header. If valid, it decodes the token and attaches the user's information (id, email, role) to the Express Request object.
    * `authorize`: An optional middleware for role-based access control, ensuring that only users with specific roles can access certain routes.
* **`middlewares/error.middleware.ts`**: A global error handling middleware. It catches various types of errors (custom `ApiError` instances, Prisma errors, Joi validation errors, or any unexpected errors) and sends standardized JSON error responses to the client, while logging detailed errors internally. **OpenTelemetry** can capture these errors as span events.
* **`middlewares/validation.middleware.ts`**: The `validate` middleware uses Joi schemas to validate incoming request bodies (e.g., for registration or login). If validation fails, it throws a `ValidationError` which is then caught by the `errorMiddleware`.

### Utilities (`utils` folder)

* `catchAsync.ts`: A higher-order function that wraps asynchronous Express route handlers, automatically catching any errors and passing them to the next middleware.
* `errors.ts`: Defines custom error classes (`ApiError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`) which provide structured error messages and HTTP status codes for consistent API responses.
* `jwt.ts`: Contains functions for `generateJwt` (to create new access/refresh tokens) and `verifyJwt` (to validate tokens). It retrieves the `JWT_SECRET` from environment variables.
* `logger.ts`: Configures `pino` for efficient and structured logging, allowing control over log levels based on the environment.
* `password.ts`: Provides utility functions for hashing user passwords using Argon2 and for verifying a provided password against a stored hash.
* `validation-schemas.ts`: Defines Joi schemas (e.g., `registerSchema`, `loginSchema`) that specify the structure and validation rules for incoming request data.

### Configuration (`config/index.ts`)

Manages environment variables critical for the Auth Service's operation, such as the `NODE_ENV`, `PORT`, `JWT_SECRET`, JWT expiry times (`accessTokenExpiry`, `refreshTokenExpiry`), whether email verification is required, and the `LOG_LEVEL`. It ensures that these variables are loaded from `.env` files. This is also where you would configure **OpenTelemetry** service names and exporter endpoints.

### Type Definitions (`types/express.d.ts`, `types/index.ts`)

* `types/express.d.ts`: Extends the Express `Request` object to include a `user` property, which holds the decoded JWT payload after authentication middleware has run.
* `types/index.ts`: Defines common TypeScript interfaces for JWT payloads, various request (e.g., `RegisterRequest`, `LoginRequest`) and response (e.g., `AuthResponse`, `UserProfile`) data structures used across the service.

---

## 🛠️ Technologies Used

* **Node.js**
* **Express.js**
* **TypeScript**
* **PostgreSQL**
* **Prisma ORM**
* **Argon2** (for password hashing)
* **JWT (JSON Web Tokens)**
* **Joi** (for validation)
* **Pino** (for logging)
* **OpenTelemetry SDK** (for distributed tracing and metrics)
* **Jest** (for testing)
* **Supertest** (for integration testing)
* **ESLint** & **Prettier** (for linting and formatting)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/en/) (LTS version recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
* [PostgreSQL](https://www.postgresql.org/download/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/mladenovskistefan111/reflective-auth-service](https://github.com/mladenovskistefan111/reflective-auth-service)
    cd reflective-auth-service
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project based on `.env.example` (you might need to create this example file yourself if it doesn't exist).
    ```
    # Example .env content
    NODE_ENV=development
    PORT=3000
    DATABASE_URL="postgresql://user:password@localhost:5432/auth_db"
    JWT_SECRET="your_super_secret_jwt_key"
    JWT_ACCESS_TOKEN_EXPIRY="1h"
    JWT_REFRESH_TOKEN_EXPIRY="7d"
    LOG_LEVEL=debug
    # OpenTelemetry Configuration (example)
    OTEL_SERVICE_NAME="auth-service"
    OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces" # Or your OTLP collector endpoint
    # EMAIL_VERIFICATION_REQUIRED=true # Uncomment if email verification is enabled
    ```
    **Important:** Replace placeholder values with your actual database credentials and a strong, unique JWT secret. Also, configure your OpenTelemetry endpoint if you're sending traces to a collector.

4.  **Database Setup:**
    * Ensure your PostgreSQL database is running.
    * Run Prisma migrations to create the database schema:
        ```bash
        npm run prisma:migrate
        # OR
        # yarn prisma:migrate
        ```
    * Generate Prisma client:
        ```bash
        npm run prisma:generate
        # OR
        # yarn prisma:generate
        ```

---

## 🏃 Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
# OR
# yarn dev