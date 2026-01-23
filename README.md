# SodaKid Website - Restructured

A modern, secure web application for SodaKid CO2 canister exchange service.

## Project Structure

```
├── api/                    # Flask Backend API
│   ├── app.py             # Application entry point
│   ├── database.py        # Database connection management
│   ├── routes/            # API route blueprints
│   │   ├── auth.py        # Authentication routes
│   │   ├── orders.py      # Order management routes
│   │   ├── contact.py     # Contact form routes
│   │   └── account.py     # Account management routes
│   ├── services/          # External service integrations
│   │   ├── sms.py         # AWS SNS SMS service
│   │   └── stripe_service.py  # Stripe payment service
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React Frontend Application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth, etc.)
│   │   ├── services/      # API service layer
│   │   ├── theme.js       # Ant Design theme configuration
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Application entry point
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
│
└── README.md              # This file
```

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Ant Design 5** - Professional UI component library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool and dev server

### Backend
- **Flask 3** - Python web framework
- **Flask-JWT-Extended** - JWT authentication
- **MariaDB** - Database (via mariadb connector)
- **Stripe** - Payment processing
- **AWS SNS** - SMS notifications

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MariaDB database

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the environment template and configure:
   ```bash
   cp config.env.example config.env
   # Edit config.env with your values
   ```

5. Run the development server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL and Stripe public key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Design Colors

The design uses these primary colors:
- **Primary (Cyan)**: `#87CCD9` - rgb(135, 204, 217)
- **Secondary (Lime)**: `#B8CF37` - rgb(184, 207, 55)
- **Blue Canister**: `#0480DE`
- **Pink Canister**: `#EB058C`
- **Background**: `#f8f9fa`

## License

Private - SodaKid © 2018-2026

---

# Original SodaKid Website