# Kasem Garments - Inventory Management App

A comprehensive inventory management mobile application built with React Native and Expo, designed for garment businesses to manage their stock, sales, and operations efficiently.

## 🚀 Features

### Core Functionality
- **Product Management**: Add, remove, and track product inventory
- **Sales Tracking**: Record and monitor daily sales transactions
- **Return Management**: Handle product returns and stock adjustments
- **Invoice System**: Generate and manage invoices for transactions
- **Dashboard Analytics**: View business insights and performance metrics

### User Management
- **Authentication**: Secure login and signup system
- **Admin Panel**: Administrative controls and oversight
- **User Roles**: Different access levels for staff and administrators

### Additional Features
- **Notifications**: Real-time alerts and updates
- **Calendar Integration**: Schedule and track important dates
- **Responsive Design**: Optimized for various screen sizes
- **Offline Support**: Continue working without internet connection

## 📱 Screenshots

The app includes multiple screens for different functionalities:
- Authentication (Login/Signup)
- Dashboard with analytics
- Product management interface
- Sales tracking and reporting
- Invoice generation
- Return processing
- Admin controls

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **UI Components**: Custom components with responsive design
- **Build Tool**: EAS Build for production builds

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Md-Mihsan-Alam/Kasem-Garments.git
   cd Kasem-Garments
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Download the configuration file and update `firebase.js`

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app for physical device

## 🏗️ Project Structure

```
Kasem-Garments/
├── app/                    # App screens and navigation
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab-based navigation screens
│   └── notifications/     # Notification screens
├── components/            # Reusable UI components
│   ├── common/           # Common components
│   ├── inventory/        # Inventory-specific components
│   ├── notifications/    # Notification components
│   └── sidebar/          # Sidebar components
├── config/               # Configuration files
├── Context/              # React Context providers
├── hooks/                # Custom React hooks
├── screen/               # Screen components
├── service/              # API and utility services
├── assets/               # Images, fonts, and other assets
└── style/                # Styling and responsive utilities
```

## 🔧 Configuration

### Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables with your Firebase configuration

### Build Configuration
- `app.json`: Expo configuration
- `eas.json`: EAS Build configuration for production builds
- `app.config.js`: Dynamic app configuration

## 📱 Usage

### For Business Owners
1. **Setup**: Create an admin account and configure your business settings
2. **Inventory**: Add your products with details like name, price, and stock quantity
3. **Sales**: Record sales transactions and generate invoices
4. **Analytics**: Monitor your business performance through the dashboard
5. **Returns**: Process product returns and adjust inventory accordingly

### For Staff Members
1. **Login**: Use provided credentials to access the system
2. **Daily Operations**: Record sales, check inventory, and process returns
3. **Customer Service**: Generate invoices and handle customer transactions

## 🚀 Deployment

### Development Build
```bash
npx expo start
```

### Production Build
```bash
eas build --platform android
eas build --platform ios
```

### Publishing Updates
```bash
eas update --branch production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Md Mihsan Alam**
- GitHub: [@Md-Mihsan-Alam](https://github.com/Md-Mihsan-Alam)
- Email: [your-email@example.com]

## 🙏 Acknowledgments

- React Native and Expo teams for the excellent framework
- Firebase for backend services
- The open-source community for various libraries and tools used

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/Md-Mihsan-Alam/Kasem-Garments/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about the problem and your environment

---

**Note**: This is a complete inventory management solution designed specifically for garment businesses. The app includes all necessary features for managing inventory, sales, returns, and generating business insights.