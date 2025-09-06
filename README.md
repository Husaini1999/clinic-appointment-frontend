# Sunrise Medical Center - Clinic Appointment Management System

A comprehensive, modern clinic appointment management system built with React.js, featuring role-based access control, real-time appointment booking, and an intelligent AI chatbot assistant.

![Sunrise Medical Center](https://img.shields.io/badge/Sunrise-Medical%20Center-orange?style=for-the-badge&logo=medical-bag)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Material-UI](https://img.shields.io/badge/Material--UI-5.15.12-blue?style=for-the-badge&logo=mui)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11.15.0-purple?style=for-the-badge&logo=framer)

## 🌟 Features

### 🎯 Core Functionality

- **Role-Based Access Control**: Admin, Staff, and Patient roles with different permissions
- **Appointment Management**: Book, reschedule, cancel, and track appointments
- **Service Management**: Manage medical services and categories
- **User Management**: Complete user profile and account management
- **Real-time Dashboard**: Live updates and statistics for all user types

### 🎨 Modern UI/UX

- **Responsive Design**: Mobile-first approach with Material-UI components
- **Advanced Animations**: Smooth transitions and parallax effects with Framer Motion
- **Glassmorphism Effects**: Modern UI with backdrop blur and transparency
- **Dark/Light Theme**: Consistent color scheme with orange-red gradient theme
- **Interactive Elements**: Hover effects, loading states, and micro-interactions

### 🤖 AI-Powered Features

- **Intelligent Chatbot**: OpenAI-powered assistant for appointment guidance
- **Smart Booking Flow**: Guided appointment booking with AI recommendations
- **Contextual Help**: Role-specific assistance and information

### 🔧 Demo Mode

- **Demo Credentials**: Pre-configured accounts for testing all features
- **Profile Protection**: Demo mode prevents accidental data modifications
- **Easy Exploration**: One-click login with demo credentials

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API server running on port 5000

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/husaini/clinic-appointment-frontend.git
   cd clinic-appointment-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   REACT_APP_API_URL=http://127.0.0.1:5000
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎭 Demo Mode

The application includes a comprehensive demo mode for easy exploration:

### Demo Credentials

| Role        | Email             | Password     | Access Level                                        |
| ----------- | ----------------- | ------------ | --------------------------------------------------- |
| **Admin**   | admin@gmail.com   | admin12345   | Full system access, user management, all features   |
| **Staff**   | staff@gmail.com   | staff12345   | Appointment management, patient records, services   |
| **Patient** | patient@gmail.com | patient12345 | Book appointments, view records, profile management |

### Demo Features

- **One-Click Login**: Use the demo credentials accordion on the login page
- **Protected Profiles**: Profile editing is disabled in demo mode to prevent data corruption
- **Full Feature Access**: Explore all functionality without affecting real data
- **Visual Indicators**: Clear warnings and disabled states for demo mode

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── AppointmentManagement.js  # Appointment CRUD operations
│   ├── Booking.js               # Appointment booking modal
│   ├── CategoryServices.js      # Service category management
│   ├── Chatbot.js              # AI-powered chatbot
│   ├── Dashboard.js            # Main dashboard component
│   ├── Header.js               # Navigation header with demo banner
│   ├── Homepage.js             # Landing page with animations
│   ├── Layout.js               # Main layout wrapper
│   ├── Login.js                # Authentication with demo mode
│   ├── Navbar.js               # Navigation menu
│   ├── NotesHistory.js         # Medical notes history
│   ├── PatientDashboard.js     # Patient-specific dashboard
│   ├── ProfileSettings.js      # User profile management
│   ├── ServiceManagement.js    # Service CRUD operations
│   ├── Signup.js               # User registration
│   ├── StaffDashboard.js       # Staff-specific dashboard
│   ├── UserManagement.js       # User administration
│   └── styles/                 # Component-specific styles
├── config/              # Configuration files
│   └── demo.js         # Demo mode settings
├── api/                # API configuration
│   └── axiosConfig.js  # Axios setup
├── utils/              # Utility functions
│   ├── permissions.js  # Role-based permissions
│   └── roleUtils.js    # Role utility functions
├── App.js              # Main application component
├── index.js            # Application entry point
└── config.js           # Environment configuration
```

## 🎨 Technology Stack

### Frontend

- **React 18.2.0**: Modern React with hooks and functional components
- **Material-UI 5.15.12**: Comprehensive UI component library
- **Framer Motion 11.15.0**: Advanced animations and transitions
- **React Router 6.22.3**: Client-side routing
- **Axios 1.7.9**: HTTP client for API communication

### UI/UX Libraries

- **@mui/x-date-pickers**: Advanced date and time pickers
- **date-fns**: Modern date utility library
- **libphonenumber-js**: Phone number validation
- **fuse.js**: Fuzzy search functionality

### AI Integration

- **OpenAI 4.71.1**: AI-powered chatbot functionality

### Development Tools

- **React Scripts**: Create React App toolchain
- **ESLint**: Code linting and formatting
- **Babel**: JavaScript transpilation

## 🔐 Authentication & Authorization

### Role-Based Access Control

#### Admin Role

- **User Management**: Create, edit, delete users
- **Service Management**: Manage medical services and categories
- **Appointment Oversight**: View and manage all appointments
- **System Settings**: Configure application settings
- **Analytics**: Access to comprehensive system reports

#### Staff Role

- **Appointment Management**: Handle patient appointments
- **Patient Records**: View and update patient information
- **Service Management**: Manage available services
- **Notes Management**: Add and view medical notes
- **Schedule Management**: Manage appointment schedules

#### Patient Role

- **Appointment Booking**: Book and manage personal appointments
- **Profile Management**: Update personal information
- **Medical History**: View appointment and treatment history
- **Service Discovery**: Browse available medical services
- **Communication**: Interact with clinic staff

## 🎯 Key Components

### Homepage

- **Hero Section**: Animated landing with parallax effects
- **Service Categories**: Interactive service browsing
- **About Section**: Clinic information with animations
- **Contact Information**: Multiple contact methods
- **Demo Banner**: Sticky demo mode notification

### Appointment System

- **Smart Booking**: Date/time selection with availability checking
- **Doctor Preferences**: Gender preference selection
- **Medical Information**: Weight, height, and medical notes
- **Confirmation Flow**: Email notifications and confirmations
- **Rescheduling**: Easy appointment modifications

### Dashboard System

- **Role-Specific Views**: Customized dashboards for each user type
- **Real-time Updates**: Live appointment and system status
- **Quick Actions**: Fast access to common tasks
- **Statistics**: Visual data representation
- **Notifications**: Important alerts and reminders

### AI Chatbot

- **Intelligent Assistance**: Context-aware help and guidance
- **Appointment Guidance**: Step-by-step booking assistance
- **Service Discovery**: Help users find appropriate services
- **FAQ System**: Common questions and answers
- **Multi-language Support**: Localized responses

## 🎨 Design System

### Color Palette

- **Primary**: Dark Blue-Gray (#2c3e50)
- **Secondary**: Orange-Red (#ff6b6b)
- **Accent**: Orange (#ffa726)
- **Background**: Light Gray (#F9FAFB)
- **Text**: Dark Blue-Gray (#2c3e50)

### Typography

- **Headings**: Bold, modern sans-serif
- **Body**: Clean, readable font stack
- **Code**: Monospace for technical content

### Animations

- **Parallax Scrolling**: Smooth background movement
- **Fade Transitions**: Elegant page transitions
- **Hover Effects**: Interactive element feedback
- **Loading States**: Smooth loading animations
- **Micro-interactions**: Subtle user feedback

## 🔧 Configuration

### Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://127.0.0.1:5000

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Demo Mode (optional)
REACT_APP_ENABLE_DEMO_MODE=true
```

### Demo Mode Configuration

Edit `src/config/demo.js` to customize demo mode:

- Enable/disable demo mode
- Modify demo credentials
- Customize demo messages
- Adjust demo styling

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features

- **Touch-Friendly**: Optimized for touch interactions
- **Swipe Gestures**: Natural mobile navigation
- **Responsive Images**: Optimized for different screen sizes
- **Mobile Menu**: Collapsible navigation for small screens

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

- **Netlify**: Automatic deployment from Git
- **Vercel**: Zero-config deployment
- **AWS S3**: Static website hosting
- **Heroku**: Full-stack deployment

### Environment Setup

1. Set production API URL
2. Configure OpenAI API key
3. Enable demo mode (optional)
4. Set up SSL certificates
5. Configure domain and DNS

## 🧪 Testing

### Available Scripts

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Eject from Create React App
npm run eject
```

### Testing Strategy

- **Unit Tests**: Component-level testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Full user journey testing
- **Accessibility Tests**: WCAG compliance testing

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards

- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Follow established patterns
- **Documentation**: Comment complex logic
- **Testing**: Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI Team**: For the excellent component library
- **Framer Motion**: For smooth animations and transitions
- **OpenAI**: For AI-powered chatbot capabilities
- **React Community**: For the amazing ecosystem and tools

## 📞 Support

For support, email support@sunrisemedical.com or join our Slack channel.

---

**Built with ❤️ for modern healthcare management**

_Sunrise Medical Center - Where technology meets compassionate care_
