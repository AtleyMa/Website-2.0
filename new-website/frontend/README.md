# SodaKid React Frontend

A modern, professional React application built with Ant Design for the SodaKid CO2 canister exchange service.

## Features

- 🎨 Modern UI with Ant Design 5
- 🔐 JWT-based authentication
- 📱 Fully responsive design
- 💳 Stripe payment integration
- 📅 Interactive order calendar
- ⚡ Fast development with Vite

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx    # Route protection wrapper
│   └── layout/
│       └── MainLayout.jsx        # Main app layout with nav
│
├── context/
│   └── AuthContext.jsx           # Authentication state management
│
├── pages/
│   ├── HomePage.jsx              # Landing page
│   ├── AboutPage.jsx             # About SodaKid
│   ├── ContactPage.jsx           # Contact form
│   ├── LoginPage.jsx             # User login
│   ├── SignUpPage.jsx            # User registration
│   ├── ForgotPasswordPage.jsx    # Password reset initiation
│   ├── VerifyAccountPage.jsx     # Phone verification (signup)
│   ├── VerifyPhonePage.jsx       # Phone verification (reset)
│   ├── ResetPasswordPage.jsx     # New password entry
│   ├── PlaceOrderPage.jsx        # Order flow (canister/qty/date)
│   ├── AccountPage.jsx           # User account & history
│   ├── SuccessPage.jsx           # Order confirmation
│   └── CancelPage.jsx            # Order cancelled
│
├── services/
│   └── api.js                    # API client with Axios
│
├── theme.js                      # Ant Design theme config
├── index.css                     # Global styles
├── App.jsx                       # Routes configuration
└── main.jsx                      # Application entry point
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Theme Customization

The app uses a custom Ant Design theme defined in `src/theme.js`:

- **Primary Color**: `#87CCD9` (Cyan/Teal)
- **Secondary Color**: `#B8CF37` (Lime Green)
- **Background**: `#f8f9fa` (Light Gray)

## Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Use `ProtectedRoute` wrapper for authenticated routes

## Dependencies

- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing
- `antd` - Ant Design UI components
- `@ant-design/icons` - Ant Design icons
- `axios` - HTTP client
- `dayjs` - Date manipulation
- `@stripe/react-stripe-js` - Stripe React components
- `@stripe/stripe-js` - Stripe.js
