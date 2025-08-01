# 📝 ToDo SAM App

A fully serverless To-Do application built with AWS SAM, Cognito authentication, API Gateway (HTTP API), Lambda, and DynamoDB. Designed for recruiter-readiness, clarity, and production-grade infrastructure.

---

## 🚀 Features

- ✅ User signup, confirmation, forgot/reset password, and login via Cognito  
- 🔐 Authenticated CRUD operations on tasks  
- 🌐 RESTful API with CORS and JWT protection  
- 🧱 Modular Lambda handlers using AWS SDK v3  
- 🧼 Environment isolation, tagging, and retention policies  
- 🧪 Local development support with `sam local`  

---

## 🧱 Architecture Diagram

```mermaid
flowchart TD
    A[Frontend / Client App]
    B[API Gateway (HTTP API)]
    F[Cognito User Pool]
    G[Cognito User Pool Client]
    C1[Signup Lambda]
    C2[Login Lambda]
    C3[Confirm Signup Lambda]
    C4[Forgot Password Lambda]
    C5[Reset Password Lambda]
    D1[Create Task Lambda]
    D2[Get Tasks Lambda]
    D3[Update Task Lambda]
    D4[Delete Task Lambda]
    D5[Complete Task Lambda]
    E[ToDoTasks Table]

    A -->|HTTP Request| B
    B -->|/auth/signup| C1
    B -->|/auth/login| C2
    B -->|/auth/confirm| C3
    B -->|/auth/forgot| C4
    B -->|/auth/reset| C5
    B -->|/tasks*| D1
    B -->|/tasks*| D2
    B -->|/tasks*| D3
    B -->|/tasks*| D4
    B -->|/tasks*| D5

    C1 -->|Cognito API| F
    C2 -->|Cognito API| F
    C3 -->|Cognito API| F
    C4 -->|Cognito API| F
    C5 -->|Cognito API| F

    D1 -->|CRUD| E
    D2 -->|CRUD| E
    D3 -->|CRUD| E
    D4 -->|CRUD| E
    D5 -->|CRUD| E

    B -->|JWT Auth| G
    G --> F
```

---

## 📦 Folder Structure

```plaintext
todo-sam-app/
├── template.yaml
├── README.md
├── .gitignore
├── src/
│   └── handlers/
│       ├── createTask.js
│       ├── getTasks.js
│       ├── deleteTask.js
│       ├── updateTask.js
│       ├── completeTask.js
│       ├── signup.js
│       ├── login.js
│       ├── confirmSignup.js
│       ├── forgotPassword.js
│       └── resetPassword.js
```

---

## 🛠️ Setup & Deployment

### Prerequisites
- AWS CLI configured  
- SAM CLI installed  
- Node.js 18+  

### Install dependencies
```bash
cd src/handlers/<function>
npm install
```

### Build and deploy
```bash
sam build
sam deploy --guided
```

---

## 🔐 Authentication Flow

- **Signup**: `POST /auth/signup`  
- **Confirm Signup**: `POST /auth/confirm`  
- **Forgot Password**: `POST /auth/forgot`  
- **Reset Password**: `POST /auth/reset`  
- **Login**: `POST /auth/login`  
- All `/tasks` routes require a valid JWT from Cognito  

---

## 📤 API Endpoints

| Method | Path                     | Auth Required | Description                  |
|--------|--------------------------|---------------|------------------------------|
| POST   | `/auth/signup`           | ❌            | Create new user              |
| POST   | `/auth/confirm`          | ❌            | Confirm user signup          |
| POST   | `/auth/forgot`           | ❌            | Request password reset (OTP) |
| POST   | `/auth/reset`            | ❌            | Reset password with OTP      |
| POST   | `/auth/login`            | ❌            | Authenticate user            |
| GET    | `/tasks`                 | ✅            | Get all tasks                |
| POST   | `/tasks`                 | ✅            | Create a task                |
| PUT    | `/tasks/{taskId}`        | ✅            | Update a task                |
| DELETE | `/tasks/{taskId}`        | ✅            | Delete a task                |
| PATCH  | `/tasks/{taskId}/toggle` | ✅            | Toggle task completion       |

---

## 📚 Notes

- All task routes are explicitly bound to the HTTP API and protected by Cognito  
- `DeletionPolicy: Retain` ensures safe teardown  
- Uses AWS SDK v3 with modular imports for Lambda efficiency  
- IAM policies follow least-privilege principles  
- Local testing supported via `sam local invoke` and `sam local start-api`  

---

## 👨‍💻 Author

Built by **Abhishek** — passionate about clean infrastructure, recruiter-ready code, and serverless best practices.

- 💼 [LinkedIn](https://www.linkedin.com/in/abhishekgupta-2017)
- 🛠️ [GitHub](https://github.com/DevAbhishekGupta)
