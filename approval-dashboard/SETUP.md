# Approval Dashboard Setup

## Overview
Simple web dashboard where you review and approve issues before they become Jira tickets.

## Technology Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **API:** Connects to Slack Bot backend
- **Auth:** Simple password protection

## Project Structure
```
approval-dashboard/
├── src/
│   ├── App.jsx              # Main app component
│   ├── components/
│   │   ├── Login.jsx        # Login screen
│   │   ├── IssueCard.jsx    # Individual issue card
│   │   ├── IssueList.jsx    # List of pending issues
│   │   └── ApprovalModal.jsx # Approval confirmation
│   ├── api/
│   │   └── client.js        # API calls to backend
│   ├── utils/
│   │   └── helpers.js       # Helper functions
│   └── main.jsx             # Entry point
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Installation
```bash
npm create vite@latest approval-dashboard -- --template react
cd approval-dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npm install axios date-fns
npx tailwindcss init -p
```

## Environment Variables
Create `.env`:
```
VITE_API_URL=http://localhost:5173
VITE_DASHBOARD_PASSWORD=anusha123
```
