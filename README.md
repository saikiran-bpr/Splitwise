# 💰 Splitwise App

A React Native mobile application built with Expo for splitting expenses with friends and groups. This app helps you track shared expenses, split bills, and settle up seamlessly.

## ✨ Features

### 🏠 Dashboard
- **Balance Overview**: View total amount you're owed and total amount you owe across all groups
- **Recent Activity**: See your latest expense additions and settlements at a glance
- **Quick Access**: Navigate to groups, friends, and other sections easily

### 👥 Friends Management
- **Add Friends**: Search and add friends by email address
- **View Friends List**: See all your added friends in one place
- **Remove Friends**: Manage your friend list easily

### 📊 Groups & Expenses
- **Create Groups**: Form groups with multiple friends for shared expenses
- **Add Members**: Invite friends to existing groups anytime
- **Add Expenses**: 
  - Record expenses with descriptions
  - Split expenses equally among selected members
  - Track who paid for each expense
- **View Group Details**: See all expenses and balances for a specific group
- **Delete Expenses**: Remove expenses you've created (only for expenses you paid)

### 💵 Balance & Settlements
- **Pairwise Balance Calculation**: Accurately calculate what each person owes/is owed
- **Visual Balance Display**: 
  - Green for amounts owed to you
  - Red for amounts you owe
  - Clear indicators with arrows
- **Settle Up**: 
  - Mark payments as settled when you pay someone
  - Request payment from others who owe you
- **Smart Settlement Logic**: Correctly handles who paid and who should pay back

### 🔐 Authentication
- **Email/Password Sign Up**: Create a new account
- **Secure Login**: Sign in with your credentials
- **Persistent Sessions**: Stay logged in across app restarts
- **Logout**: Sign out securely

## 🛠️ Tech Stack

- **Framework**: React Native with Expo (~54.0.25)
- **Navigation**: React Navigation v7 (Native Stack & Bottom Tabs)
- **State Management**: React Context API
- **Backend**: Firebase (Firestore & Authentication)
- **UI Components**: React Native Paper
- **Storage**: AsyncStorage for auth persistence

### Key Dependencies
```
expo: ~54.0.25
react: 19.1.0
react-native: 0.81.5
firebase: ^12.6.0
@react-navigation/native: ^7.1.24
react-native-paper: ^5.14.5
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Expo Go](https://expo.dev/client) app on your iOS/Android device (for testing)
- A Firebase project with Firestore and Authentication enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd splitwise/splitwise-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password provider)
   - Enable Cloud Firestore Database
   - Copy your Firebase configuration
   - Update `firebase.js` with your configuration:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

4. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own user data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         
         // Friends subcollection
         match /friends/{friendId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
       
       // Groups - members can read, creator can write
       match /groups/{groupId} {
         allow read: if request.auth != null && request.auth.uid in resource.data.members;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
         
         // Expenses subcollection
         match /expenses/{expenseId} {
           allow read: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
           allow create: if request.auth != null;
           allow delete: if request.auth != null && request.auth.uid == resource.data.paidBy;
         }
       }
       
       // Settled expenses
       match /settledExpenses/{settleId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
       }
     }
   }
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on your device**
   - Scan the QR code with Expo Go (iOS) or the Expo app (Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 📱 Usage

### Getting Started
1. **Sign Up**: Create a new account with your email and password
2. **Add Friends**: Search for friends by email and add them to your friend list
3. **Create Groups**: Form a group with your friends (e.g., "Roommates", "Trip to NYC")
4. **Add Expenses**: Record who paid and split the expense among group members
5. **Settle Up**: Mark payments as settled or request payments from others

### Understanding Balances
- **Green Balance (Positive)**: Someone owes you money
  - Shows "owes you ₹X" with a Request button
- **Red Balance (Negative)**: You owe someone money
  - Shows "you owe ₹X" with a Settle Up button
- **Zero Balance**: All settled up!

### How Expenses Work
When you add an expense:
- The person who creates the expense is marked as the payer
- The total amount is split equally among selected members
- The app automatically calculates who owes whom
- Example: If Alice pays ₹100 for dinner split between Alice and Bob:
  - Alice paid: ₹100
  - Alice's share: ₹50
  - Bob's share: ₹50
  - Result: Bob owes Alice ₹50

## 📁 Project Structure

```
splitwise-app/
├── App.js                 # Main app component with navigation setup
├── app.json              # Expo configuration
├── firebase.js           # Firebase initialization and configuration
├── index.js              # App entry point
├── package.json          # Dependencies and scripts
├── assets/               # Images and icons
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
└── src/
    ├── context/          # Context providers for state management
    │   ├── AuthContext.js    # Authentication state and methods
    │   └── DataContext.js    # Data fetching and business logic
    ├── screens/          # Screen components
    │   ├── LoginScreen.js
    │   ├── SignupScreen.js
    │   ├── HomeScreen.js         # Bottom tab navigator
    │   ├── DashboardScreen.js    # Overview dashboard
    │   ├── FriendsScreen.js      # Friends list
    │   ├── AddFriendScreen.js    # Add new friends
    │   ├── GroupsScreen.js       # Groups list
    │   ├── CreateGroupScreen.js  # Create new groups
    │   ├── GroupDetailScreen.js  # Group expenses and balances
    │   ├── AddExpenseScreen.js   # Add expenses to groups
    │   └── AddMemberToGroupScreen.js  # Add members to groups
    └── navigation/       # Navigation configuration (if any)
```

## 🔑 Key Features Explained

### Pairwise Balance Calculation
The app uses a sophisticated balance calculation system that:
- Calculates balances between each pair of users separately
- Only considers expenses shared between two specific users
- Accounts for settlements between users
- Ensures accurate "who owes whom" tracking

### Real-time Updates
- Uses Firebase Firestore real-time listeners
- Updates automatically when expenses are added/deleted
- Reflects settlements immediately across all devices

### Data Persistence
- Authentication state persists using AsyncStorage
- All data stored securely in Firebase Cloud Firestore
- Offline support with Firebase's offline persistence

## 🐛 Troubleshooting

### Common Issues

**Firebase connection errors**
- Verify your Firebase configuration in `firebase.js`
- Check that Firestore and Authentication are enabled
- Ensure your security rules allow the operations

**Navigation errors**
- Clear Expo cache: `expo start -c`
- Reinstall node_modules: `rm -rf node_modules && npm install`

**Authentication not persisting**
- Check that AsyncStorage is properly configured
- Verify Firebase auth initialization in `firebase.js`

**Balance calculation issues**
- Ensure expenses include both payer and all split members
- Check that settlements are being recorded correctly
- Verify pairwise balance calculation is working

## 🚧 Future Enhancements

Potential features to add:
- [ ] Unequal expense splitting (custom amounts per person)
- [ ] Currency conversion support
- [ ] Expense categories and tags
- [ ] Monthly/Yearly expense reports
- [ ] Recurring expenses
- [ ] Expense attachments (receipts/photos)
- [ ] Push notifications for settlements
- [ ] Export expense data to CSV
- [ ] Multi-currency support
- [ ] Expense reminders

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Follow React Native best practices
2. Maintain consistent code style
3. Add comments for complex logic
4. Test on both iOS and Android when possible
5. Update documentation as needed

## 📄 License

This project is private and proprietary.

## 👤 Author

Created with ❤️ for easy expense splitting and bill management.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI components from [React Native Paper](https://reactnativepaper.com/)
- Backend powered by [Firebase](https://firebase.google.com/)
- Navigation handled by [React Navigation](https://reactnavigation.org/)

---

**Note**: Make sure to keep your Firebase configuration secure and never commit sensitive keys to public repositories. Consider using environment variables for production builds.
