// app.config.js - Custom configuration for Expo builds
module.exports = {
  name: "কাসেম গার্মেন্টস",
  slug: "kasem_garments",
  version: "1.0.1", // Increment version for new build
  orientation: "portrait",
  icon: "./assets/images/app-icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/app-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    runtimeVersion: {
      policy: "appVersion"
    },
    infoPlist: {
      NSPhotoLibraryUsageDescription: "Allow $(PRODUCT_NAME) to access your photos",
      NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera",
      NSMicrophoneUsageDescription: "Allow $(PRODUCT_NAME) to access your microphone",
      UIFileSharingEnabled: true
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/app-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.kasem_garments",
    googleServicesFile: "./google-services.json",
    runtimeVersion: "1.0.1", // Match with version above
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.RECORD_AUDIO",
      "android.permission.MANAGE_DOCUMENTS",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.INTERNET"
    ],
    // Add specific build configuration for Android
    config: {
      // Increase memory for Java VM during build
      gradle: {
        javaMaxHeapSize: "2g"
      }
    },
    // Add proguard rules to optimize the APK
    proguard: {
      rules: `
        # Keep important Firebase classes
        -keep class com.google.firebase.** { *; }
        -keep class com.firebase.** { *; }
        
        # Keep Expo classes
        -keep class expo.** { *; }
        -keep class com.facebook.react.** { *; }
        
        # Keep notification related classes
        -keep class com.google.android.gms.** { *; }
      `
    }
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/app-icon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-media-library",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos."
      }
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow $(PRODUCT_NAME) to access your camera."
      }
    ],
    [
      "expo-file-system",
      {
        filePermission: "Allow $(PRODUCT_NAME) to access files."
      }
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/app-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ],
    "expo-notifications",
    "expo-secure-store"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "aef91176-255d-47db-910d-b6bc82e9ebe7"
    }
  },
  // Add specific hooks for build process
  hooks: {
    postPublish: [
      {
        file: "sentry-expo/upload-sourcemaps",
        config: {
          organization: "kasem-garments",
          project: "kasem-garments-app"
        }
      }
    ]
  }
};
