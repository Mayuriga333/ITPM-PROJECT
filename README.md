# ITPM-PROJECT

# 🎓 Volunteer-Based Academic Support & Smart Matching Platform

A full-stack web application built using the MERN stack that connects students with suitable volunteers through intelligent matching, interactive chatbot guidance, and real-time communication.

---

## 📌 Project Overview

The Smart Volunteer–Student Support System is designed to streamline how students find academic support. Instead of traditional forms, the system uses a **rule-based chatbot** to collect requirements and a **smart matching algorithm** to recommend the most suitable volunteers.

The platform also includes **admin moderation**, **real-time messaging**, and **feedback-driven improvements**, ensuring a secure, scalable, and intelligent support environment.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization
- Secure user registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Role-based access (Student / Volunteer / Admin)
- Protected routes

---

### 🛡 Admin Moderation
- Volunteer approval workflow (Pending → Approved / Rejected)
- Account suspension system
- Controlled platform access

---

### 💬 Rule-Based Chatbot
- Interactive step-by-step requirement collection
- Collects:
  - Subject
  - Topic
  - Availability
- Stores conversation state in MongoDB

---

### 🧠 Smart Matching System
- Matches students with volunteers based on:
  - Subject
  - Availability
  - Experience
  - Rating
- Weighted scoring algorithm
- Ranked recommendations
- **Explainable results (why a volunteer is selected)**

---

### 🔄 Adaptive Matching (Advanced Feature)
- System learns from previous sessions
- High-rated volunteers get priority in future matches
- Improves recommendation accuracy over time

---

### 💬 Messaging System (NEW 🔥)
- Real-time communication between students and volunteers
- Start conversation after matching
- Features:
  - Conversation list
  - Message history
  - Read/unread status
  - Unread message count
  - Auto-scrolling chat UI
  - Archive conversations
- 30-second polling for updates
- Fully responsive UI

---

### 📊 Dashboard System
#### Student Dashboard:
- View matches
- Access chatbot
- Messaging notifications

#### Volunteer Dashboard:
- View incoming requests
- Messaging access
- Profile visibility

#### Admin Dashboard:
- Approve/reject volunteers
- Monitor users
- Platform control

---

## 🏗 System Architecture

React (Frontend)
↓
Express + Node.js (Backend API)
↓
MongoDB (Database)


- REST API communication
- JWT authentication
- Role-based middleware
- Modular architecture

---

## 🛠 Tech Stack

### Frontend:
- React.js
- React Router
- Axios
- Tailwind CSS / Custom CSS

### Backend:
- Node.js
- Express.js

### Database:
- MongoDB
- Mongoose

### Authentication:
- JSON Web Token (JWT)
- bcrypt.js

### Tools:
- Git & GitHub
- Postman
- VS Code

---

## 📁 Project Structure

client/
├── pages/
├── components/
├── services/

server/
├── models/
├── controllers/
├── routes/
├── middleware/
├── config/

---

## 🔄 System Workflow
User Registration/Login
↓
Role-Based Access Control
↓
Chatbot collects requirements
↓
Smart Matching algorithm runs
↓
Student selects volunteer
↓
Messaging starts
↓
Session completed
↓
Feedback improves future matching


---

## 📬 Messaging System Workflow
Match Found
↓
Start Conversation
↓
Send/Receive Messages
↓
Unread Count Updated
↓
Mark as Read
↓
Archive Conversation (optional)


---

## 🧪 API Endpoints (Sample)

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`

### Chatbot
- POST `/api/chat/message`

### Matching
- GET `/api/match`

### Messaging
- POST `/api/messages/start`
- POST `/api/messages/send`
- GET `/api/messages`
- PUT `/api/messages/read`
- GET `/api/messages/unread`

### Admin
- PUT `/api/admin/approve/:id`
- PUT `/api/admin/reject/:id`
- PUT `/api/admin/suspend/:id`

---

## 🔐 Security Features

- Password hashing
- Token-based authentication
- Role-based authorization
- Protected API routes
- Session expiry handling
- Input validation

---

## 🎯 Intended Outcomes

- Efficient student-volunteer matching
- Improved user experience through chatbot interaction
- Secure and moderated platform
- Transparent and explainable recommendations
- Real-time communication between users

---

## 📈 Future Enhancements

- WebSocket real-time messaging (Socket.io)
- AI-based chatbot (NLP)
- Push notifications
- Mobile app version
- Advanced analytics dashboard

---

## 👨‍💻 Contributors

- **Member 1** – Authentication, Chatbot, Smart Matching, Messaging
- **Member 2** – Volunteer Matching & Feedback System
- **Member 3** – Study Request & Dispute Management
- **Member 4** – Scheduling & Attendance System

---

## 📜 License

This project is developed for academic purposes.

---

## ⭐ Final Note

This system demonstrates a complete full-stack solution with intelligent matching, secure authentication, real-time messaging, and modular architecture — going beyond basic CRUD applications.
