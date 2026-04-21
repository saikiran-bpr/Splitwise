# Splitwise

A full-stack expense splitting application built with React Native (Expo) and Node.js. Track shared expenses, split bills with multiple methods, simplify debts, and settle up with friends.

## Tech Stack

**Frontend:** React Native, Expo, React Navigation, React Native Paper  
**Backend:** Node.js, Express.js, MongoDB, Mongoose  
**Auth:** JWT (JSON Web Tokens) with bcrypt password hashing

## Features

### Expense Management
- **4 Split Types** - Equal, exact amounts, percentage-based, or share-based splitting
- **10 Categories** - Food, transport, entertainment, shopping, utilities, rent, travel, health, education, other
- **Comments** - Add and view comments on any expense
- **Edit/Delete** - Modify or remove expenses (creator/payer only)

### Groups
- **Group Categories** - Trip, home, couple, friends, work, other
- **Member Management** - Add or remove members anytime
- **Group Balances** - See who owes whom within each group
- **Debt Simplification** - Minimizes the number of transactions needed to settle up

### Friends
- **Add by Email** - Find and add friends who are already registered
- **Search** - Search users by name or email
- **Friend Balances** - View balance breakdown with each friend across all groups

### Settlements
- **Settle Up** - Record payments between users
- **Per-Group or Overall** - Settle within a specific group or across all debts
- **Suggested Amounts** - Pre-filled amounts based on what's owed

### Dashboard
- **Balance Overview** - Total owed to you, total you owe, net balance
- **Recent Activity** - Latest expenses, settlements, and group updates
- **Quick Actions** - Fast access to groups and common tasks

### Activity Feed
- Tracks all actions: expenses added/edited/deleted, settlements, group changes, member updates
- Paginated feed with pull-to-refresh

### User Profile
- Edit name, phone, currency preference
- Change password
- Account statistics (groups, friends, balance)

### Authentication
- Email/password registration and login
- JWT-based session persistence
- Secure password hashing with bcrypt

## Project Structure

```
Splitwise/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Expense.js
│   │   ├── Settlement.js
│   │   └── Activity.js
│   ├── routes/
│   │   ├── auth.js               # Register, login, profile
│   │   ├── friends.js            # Add, remove, search friends
│   │   ├── groups.js             # CRUD groups, manage members
│   │   ├── expenses.js           # CRUD expenses, comments
│   │   ├── settlements.js        # Record settlements
│   │   ├── balances.js           # Balance calculations
│   │   └── activity.js           # Activity feed
│   ├── utils/
│   │   ├── debtSimplifier.js     # Debt minimization algorithm
│   │   └── helpers.js            # Split calculators
│   ├── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Auth state & methods
│   │   │   └── DataContext.js     # App data & API calls
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   ├── HomeScreen.js           # Tab navigator
│   │   │   ├── DashboardScreen.js
│   │   │   ├── GroupsScreen.js
│   │   │   ├── CreateGroupScreen.js
│   │   │   ├── GroupDetailScreen.js
│   │   │   ├── AddExpenseScreen.js
│   │   │   ├── EditExpenseScreen.js
│   │   │   ├── ExpenseDetailScreen.js
│   │   │   ├── FriendsScreen.js
│   │   │   ├── AddFriendScreen.js
│   │   │   ├── AddMemberToGroupScreen.js
│   │   │   ├── SettleUpScreen.js
│   │   │   ├── ActivityScreen.js
│   │   │   └── ProfileScreen.js
│   │   └── services/
│   │       └── api.js             # API client
│   ├── assets/
│   ├── App.js
│   ├── app.json
│   └── package.json
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get all friends |
| POST | `/api/friends/add` | Add friend by email |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends/search?q=` | Search users |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | Get all groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:id` | Get group with expenses & settlements |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |
| POST | `/api/groups/:id/members` | Add members |
| DELETE | `/api/groups/:id/members/:userId` | Remove member |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/group/:groupId` | Get group expenses (paginated) |
| GET | `/api/expenses/user` | Get user's expenses |
| GET | `/api/expenses/:id` | Get expense detail |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| POST | `/api/expenses/:id/comments` | Add comment |
| DELETE | `/api/expenses/:id/comments/:commentId` | Delete comment |

### Settlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/settlements` | Record settlement |
| GET | `/api/settlements` | Get all user settlements |
| GET | `/api/settlements/group/:groupId` | Get group settlements |
| DELETE | `/api/settlements/:id` | Delete settlement |

### Balances
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/balances/overall` | Overall balances with all friends |
| GET | `/api/balances/group/:groupId` | Group balances + simplified debts |
| GET | `/api/balances/friend/:friendId` | Balance with specific friend |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | User's activity feed (paginated) |
| GET | `/api/activity/group/:groupId` | Group activity (paginated) |

## Prerequisites

- [Node.js](https://nodejs.org/) v16+
- [MongoDB](https://www.mongodb.com/) (local install or [Atlas](https://www.mongodb.com/atlas) cloud)
- [Expo CLI](https://docs.expo.dev/) (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/client) app on your phone (for testing)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Splitwise
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Configure the environment variables in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/splitwise   # or your MongoDB Atlas URI
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
```

Start the backend server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Start the Expo development server:

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

### 4. Connect frontend to backend

The frontend API client (`frontend/src/services/api.js`) is configured to connect to:
- **iOS Simulator**: `http://localhost:5000/api`
- **Android Emulator**: `http://10.0.2.2:5000/api`

If testing on a physical device, update the `getBaseUrl()` function in `api.js` with your machine's local IP address:

```js
const getBaseUrl = () => {
  return 'http://YOUR_LOCAL_IP:5000/api';
};
```

## How Splitting Works

### Equal Split
Total divided equally among selected members.  
Example: $120 among 4 people = $30 each.

### Exact Amount
Specify exact amounts per person. Must sum to the total.  
Example: $100 total - Alice $60, Bob $40.

### Percentage
Specify percentage per person. Must sum to 100%.  
Example: $200 total - Alice 60% ($120), Bob 40% ($80).

### Shares
Specify share units per person. Amount is divided proportionally.  
Example: $150 total, Alice 2 shares, Bob 1 share - Alice $100, Bob $50.

### Debt Simplification
When enabled on a group, the app minimizes the number of transactions needed.  
Example: If A owes B $10 and B owes C $10, it simplifies to A owes C $10 (1 transaction instead of 2).

## Troubleshooting

**MongoDB connection errors**
- Ensure MongoDB is running: `mongod` or check Atlas dashboard
- Verify the `MONGODB_URI` in `backend/.env`

**API connection from mobile device**
- Use your machine's IP (not localhost) in `api.js`
- Ensure your phone and computer are on the same Wi-Fi network
- Check that port 5000 isn't blocked by firewall

**Expo errors**
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Auth issues**
- Check that the JWT_SECRET is set in `.env`
- Verify the token is being stored in AsyncStorage

## License

This project is private and proprietary.
