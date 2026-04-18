# 🎓 Volunteer-Based Academic Support & Smart Matching Platform

A comprehensive educational volunteer platform that connects students with volunteer tutors for study support, featuring intelligent matching, real-time communication, ratings and reviews, and administrative oversight.

## 🌟 Features

### Core Platform
- **User Authentication & Role Management**: Students, Volunteers, and Admins with different access levels
- **Intelligent Volunteer Matching**: AI-powered matching based on subjects, availability, and preferences
- **Real-time Communication**: Built-in chat system with Socket.IO for instant messaging
- **Rating & Review System**: Comprehensive feedback mechanism with reputation scoring
- **Study Support Requests**: Structured request management for academic assistance

### Key Modules
1. **Authentication & Profiles** (P1)
   - User registration and login
   - Profile management with skills and availability
   - Admin moderation and user status management

2. **Ratings & Reviews** (P2)
   - Volunteer rating system with detailed feedback
   - Reputation scoring and leaderboard
   - Review moderation by administrators
   - Smart matching based on ratings

3. **Study Support** (P3)
   - Academic support request management
   - Volunteer discovery and filtering
   - Session tracking and dispute resolution
   - Dashboard analytics for both students and volunteers

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **TailwindCSS** for styling
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Framer Motion** for animations

## 📁 Project Structure

```
ITPM-PROJECT/
├── backend/
│   ├── config/          # Database and server configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── uploads/         # File upload storage
│   ├── .env            # Environment variables
│   ├── package.json    # Backend dependencies
│   ├── server.js       # Server entry point
│   └── seed.js         # Database seeding script
├── frontend/
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   ├── styles/     # CSS and styling
│   │   └── utils/      # Frontend utilities
│   ├── package.json   # Frontend dependencies
│   └── vite.config.js # Vite configuration
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ITPM-PROJECT
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-secret-key
   ```

5. **Seed the database**
   ```bash
   cd backend
   npm run seed
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## 📊 Database Models

### Core Models
- **User**: Base user authentication and role management
- **VolunteerProfile**: Detailed volunteer information and skills
- **Volunteer**: Volunteer-specific data and availability
- **Session**: Study session tracking
- **Review**: Rating and review system
- **ChatSession**: Real-time communication sessions
- **Conversation**: Chat conversation management
- **Message**: Individual chat messages
- **StudyStudent**: Student-specific academic data
- **StudyVolunteer**: Volunteer teaching preferences
- **SupportRequest**: Academic support requests

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Volunteer Management
- `GET /api/volunteers` - List all volunteers
- `GET /api/volunteers/:id` - Get volunteer details
- `PUT /api/volunteers/:id` - Update volunteer profile

### Reviews & Ratings
- `POST /api/reviews` - Create a review
- `GET /api/reviews/volunteer/:id` - Get volunteer reviews
- `PUT /api/reviews/:id` - Update review

### Study Support
- `POST /api/requests` - Create support request
- `GET /api/requests` - List support requests
- `PUT /api/requests/:id` - Update request status

### Real-time Communication
- `WebSocket /socket.io` - Real-time chat functionality

## 👥 User Roles & Permissions

### Students
- Register and create profiles
- Browse and find volunteers
- Request study support
- Rate and review volunteers
- Participate in chat sessions

### Volunteers
- Create detailed profiles with skills and availability
- Respond to support requests
- Conduct study sessions
- Receive ratings and reviews
- Manage chat communications

### Administrators
- User moderation and approval
- Review content moderation
- Platform analytics and oversight
- Dispute resolution
- System configuration

## 🎯 Key Features in Detail

### Intelligent Matching System
- Subject-based matching algorithms
- Availability scheduling
- Reputation-weighted recommendations
- Student preference consideration

### Rating & Review System
- 5-star rating system
- Detailed feedback categories
- Reputation score calculation
- Leaderboard rankings
- Admin moderation tools

### Real-time Communication
- Instant messaging between students and volunteers
- File sharing capabilities
- Session-based chat rooms
- Message history and search

### Administrative Tools
- User status management (Pending/Approved/Suspended/Rejected)
- Review moderation
- Analytics dashboard
- Dispute resolution system

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Seeding
The project includes a comprehensive seeding script that creates:
- Sample users (students, volunteers, admins)
- Volunteer profiles with various skills
- Sample reviews and ratings
- Chat sessions and messages
- Support requests and responses

Run the seed script:
```bash
cd backend
npm run seed
```

## 📱 Responsive Design

The platform is fully responsive and works across:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices
- Mobile browsers
- Progressive Web App (PWA) capabilities

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- File upload security
- Rate limiting (recommended for production)

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=your-frontend-domain
```

### Build for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend production start
cd backend
npm start
```

## 👥 Contributors

### Development Team
- **Tharusha (Member 1)** – Authentication, Profile Management, Chatbot & Smart Matching
- **Mayuriga (Member 2)** – Volunteer Matching & Feedback System  
- **Lavanya (Member 3)** – Study Request & Dispute Management
- **Sheshanthan (Member 4)** – Scheduling & Attendance System 

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common issues

## 🔄 Version History

- **v1.0.0** - Initial release with all core features
  - Authentication and user management
  - Volunteer matching system
  - Rating and review system
  - Real-time chat functionality
  - Study support requests
  - Administrative tools

---

**Built with ❤️ for educational support and volunteer collaboration**
