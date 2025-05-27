# Reflective Authorization Service for TechCart

## 🚀 Overview

The Reflective Authorization Service is a dedicated microservice designed to handle all aspects of user authentication and authorization within the TechCart system[cite: 1]. Built with **Node.js (Express.js)** and integrating with a **PostgreSQL** database using **Prisma ORM**[cite: 2], it provides a robust and secure solution for managing user identities and access control[cite: 49].

### Core Functionalities

* **User Management:** Manages the entire user lifecycle, from registration and login to email verification, password resets, and profile retrieval[cite: 3].
* **Secure Authentication:** Employs modern security practices including **Argon2** for password hashing [cite: 42] and **JWTs (JSON Web Tokens)** with both access and refresh tokens for secure token-based authentication[cite: 4, 40].
* **Authorization:** Supports **Role-Based Access Control (RBAC)** to determine what actions a user is permitted to perform[cite: 5, 33].

## 📦 Architectural Components

This service is structured into several key components to ensure maintainability, scalability, and separation of concerns:

### Application Entry Point (`app.ts`)

The main Express application file[cite: 6]. It sets up the server, applies essential middleware (Helmet for security, CORS for cross-origin requests, `express.json` for body parsing, Morgan for logging)[cite: 7], defines the base `/api` route, includes a `/health` endpoint for readiness checks[cite: 9], and integrates global error handling[cite: 9].

### Routes (`routes/index.ts`, `routes/auth.routes.ts`)

* `routes/index.ts`: Acts as the central router, mounting `authRoutes` under the `/auth` path (e.g., `/api/auth/...`)[cite: 10].
* `routes/auth.routes.ts`: Defines all specific API endpoints related to authentication[cite: 11]:
    * `POST /api/auth/register`: New user registration[cite: 11].
    * `POST /api/auth/login`: User authentication and token issuance[cite: 12].
    * `POST /api/auth/refresh`: Obtain a new access token using a refresh token[cite: 12].
    * `GET /api/auth/me`: Fetch the current authenticated user's profile (protected route)[cite: 13].
    * `POST /api/auth/logout`: Invalidate refresh tokens and log out a user[cite: 14].
    * `GET /api/auth/verify-email/:token`: Verify a user's email address[cite: 15].
    * `POST /api/auth/forgot-password`: Initiate a password reset process[cite: 15].
    * `POST /api/auth/reset-password/:token`: Set a new password using a reset token[cite: 16].

### Controllers (`controllers/auth.controller.ts`)

Handle incoming HTTP requests from the routes[cite: 17]. They act as a thin layer, receiving request data, calling appropriate business logic methods from `auth.service.ts`, and sending back HTTP responses[cite: 18]. For example, `register` extracts user data from the request body and calls `authService.register()`[cite: 19].

### Services (`services/auth.service.ts`)

Contain the core business logic of the authentication service[cite: 20]. This includes functions for:
* `register()`: Handles user creation, password hashing, and generating email verification tokens[cite: 21].
* `login()`: Authenticates users, generates access and refresh tokens, and manages token expiration[cite: 22].
* `refreshToken()`: Issues new access tokens based on valid refresh tokens[cite: 23].
* `logout()`: Invalidates refresh tokens[cite: 23].
* `verifyEmail()`: Marks a user's email as verified[cite: 24].
* `forgotPassword()`: Generates and logs (or sends in a real app) a password reset token[cite: 24].
* `resetPassword()`: Allows a user to set a new password using a valid reset token[cite: 25].
They interact directly with the database via Prisma and utilize JWT and password utilities[cite: 26].

### Database (`database.ts`, `user.model.ts`)

* `database.ts`: Initializes the Prisma client, configured for logging database queries in development[cite: 27]. It also includes a `testConnection` function to verify the database connection on startup[cite: 28].
* `user.model.ts`: Defines TypeScript interfaces for user-related data, including `CreateUserInput` (for registration) and `UserResponse` (for safe user data returned in responses)[cite: 29]. It also provides a `toUserResponse` helper function to transform Prisma user objects into the `UserResponse` format[cite: 30].

### Middleware

* **`middlewares/auth.middleware.ts`**:
    * `authMiddleware`: Verifies the JWT access token sent in the Authorization header[cite: 31]. If valid, it decodes the token and attaches the user's information (id, email, role) to the Express Request object[cite: 32].
    * `authorize`: An optional middleware for role-based access control, ensuring that only users with specific roles can access certain routes[cite: 33].
* **`middlewares/error.middleware.ts`**: A global error handling middleware. It catches various types of errors (custom `ApiError` instances, Prisma errors, Joi validation errors, or any unexpected errors) and sends standardized JSON error responses to the client, while logging detailed errors internally[cite: 34].
* **`middlewares/validation.middleware.ts`**: The `validate` middleware uses Joi schemas to validate incoming request bodies (e.g., for registration or login)[cite: 35]. If validation fails, it throws a `ValidationError` which is then caught by the `errorMiddleware`[cite: 36].

### Utilities (`utils` folder)

* `catchAsync.ts`: A higher-order function that wraps asynchronous Express route handlers, automatically catching any errors and passing them to the next middleware[cite: 37].
* `errors.ts`: Defines custom error classes (`ApiError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`) which provide structured error messages and HTTP status codes for consistent API responses[cite: 38, 39].
* `jwt.ts`: Contains functions for `generateJwt` (to create new access/refresh tokens) and `verifyJwt` (to validate tokens)[cite: 40]. It retrieves the `JWT_SECRET` from environment variables[cite: 41].
* `logger.ts`: Configures `pino` for efficient and structured logging, allowing control over log levels based on the environment[cite: 42].
* `password.ts`: Provides utility functions for hashing user passwords using Argon2 and for verifying a provided password against a stored hash[cite: 43].
* `validation-schemas.ts`: Defines Joi schemas (e.g., `registerSchema`, `loginSchema`) that specify the structure and validation rules for incoming request data[cite: 44].

### Configuration (`config/index.ts`)

Manages environment variables critical for the Auth Service's operation, such as the `NODE_ENV`, `PORT`, `JWT_SECRET`, JWT expiry times (`accessTokenExpiry`, `refreshTokenExpiry`), whether email verification is required, and the `LOG_LEVEL`[cite: 45]. It ensures that these variables are loaded from `.env` files[cite: 46].

### Type Definitions (`types/express.d.ts`, `types/index.ts`)

* `types/express.d.ts`: Extends the Express `Request` object to include a `user` property, which holds the decoded JWT payload after authentication middleware has run[cite: 47].
* `types/index.ts`: Defines common TypeScript interfaces for JWT payloads, various request (e.g., `RegisterRequest`, `LoginRequest`) and response (e.g., `AuthResponse`, `UserProfile`) data structures used across the service[cite: 48].

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
* **Jest** (for testing)
* **Supertest** (for integration testing)
* **ESLint** & **Prettier** (for linting and formatting)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/en/) (LTS version recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
* [PostgreSQL](https://www.postgresql.org/download/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
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
    # EMAIL_VERIFICATION_REQUIRED=true # Uncomment if email verification is enabled
    ```
    **Important:** Replace placeholder values with your actual database credentials and a strong, unique JWT secret.

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

## 🏃 Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
# OR
# yarn dev