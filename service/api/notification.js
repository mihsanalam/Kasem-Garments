import { db } from '../../firebase';
import { doc, updateDoc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '../../config/auth';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async requestPermission() {
    // console.log('Requesting notification permissions...');

    if (!Device.isDevice) {
      // console.log('Not a physical device, skipping notification permission');
      return false;
    }

    // For Android, we need to set the channel for notifications
    if (Platform.OS === 'android') {
      // console.log('Setting up Android notification channel');
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
          enableVibrate: true,
          showBadge: true,
        });
        // console.log('Android notification channel set up successfully');
      } catch (error) {
        // console.error('Error setting up Android notification channel:', error);
      }
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      // console.log('Current notification permission status:', existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        // console.log('Requesting notification permission from user...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        // console.log('New notification permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        // console.log('Notification permission not granted');
        return false;
      }

      // console.log('Notification permission granted');
      return true;
    } catch (error) {
      // console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners(onNotificationReceived, onNotificationResponseReceived) {
    // When a notification is received while the app is in the foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      notification => {
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // When the user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        if (onNotificationResponseReceived) {
          onNotificationResponseReceived(response);
        }
      }
    );

    return {
      remove: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      }
    };
  }

  async getFCMToken() {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        // console.log('Not running on a physical device, skipping FCM token');
        return null;
      }

      // Request permission with timeout
      let permissionGranted = false;
      try {
        // console.log('Requesting notification permission with timeout...');
        const permissionPromise = this.requestPermission();

        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Permission request timed out')), 5000)
        );

        permissionGranted = await Promise.race([permissionPromise, timeoutPromise]);
      } catch (permError) {
        // console.error('Error or timeout requesting notification permission:', permError);
        // Continue without permission - we'll return null at the end
      }

      if (!permissionGranted) {
        // console.log('Permission not granted for notifications');
        return null;
      }

      // console.log('Getting Expo push token...');

      try {
        // Try to get the token with a timeout
        const tokenPromise = Notifications.getExpoPushTokenAsync({
          projectId: 'ad6ce3c1-6e78-459d-ad11-dc3ff5a52be7' // Expo project ID
        });

        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('FCM token request timed out')), 5000)
        );

        const tokenResponse = await Promise.race([tokenPromise, timeoutPromise]);
        const token = tokenResponse.data;

        // console.log('Expo push token obtained:', token);
        return token;
      } catch (tokenError) {
        // console.error('Error getting Expo push token:', tokenError);
        // Continue without token
        return null;
      }
    } catch (error) {
      // console.error('Unexpected error in getFCMToken:', error);
      return null;
    }
  }

  async updateUserToken(userId, token) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      // console.error('Error updating user token:', error);
      return false;
    }
  }

  // Send a local notification (for testing and when app is in foreground)
  async sendLocalNotification(notification) {
    try {
      // console.log('Attempting to send local notification:', notification.title);

      const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // console.log('Current user role:', userData.role);

        if (userData.role === 'ADMIN') {
          // console.log('User is admin, scheduling local notification');

          const permissionResult = await this.requestPermission();
          if (!permissionResult) {
            // console.log('No notification permission, cannot show local notification');
            return false;
          }

          const notificationContent = {
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: true,
            badge: 1,
          };

          // console.log('Scheduling notification with content:', JSON.stringify(notificationContent));

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: notificationContent,
            trigger: null,
          });

          // console.log('Local notification scheduled with ID:', notificationId);
          return true;
        } else {
          // console.log('User is not admin, skipping local notification');
        }
      } else {
        // console.log('No user data found, cannot determine if user is admin');
      }
      return true;
    } catch (error) {
      // console.error('Error sending local notification:', error);
      return false;
    }
  }

  async notifyAdmins(notification) {
    try {
      // console.log('Sending notification to admins:', notification);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'ADMIN'));
      const querySnapshot = await getDocs(q);

      await this.sendLocalNotification(notification);

      // console.log(`Found ${querySnapshot.size} admin users to notify`);

      const notifications = [];

      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const userId = docSnapshot.id;

        if (userData.fcmToken) {
          // console.log(`Sending push notification to admin: ${userData.email} with token: ${userData.fcmToken.substring(0, 10)}...`);

          const notificationPayload = {
            to: userData.fcmToken,
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: 'default',
            priority: 'high',
            badge: 1,
            channelId: 'default',
          };

          // console.log('Notification payload:', JSON.stringify(notificationPayload));

          notifications.push(
            fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(notificationPayload),
            }).then(async (response) => {
              const result = await response.json();
              // console.log(`Push notification response for ${userData.email}:`, JSON.stringify(result));

              if (!response.ok) {
                throw new Error(`Failed to send notification to ${userData.email}: ${result.error || 'Unknown error'}`);
              }

              if (result.errors && result.errors.length > 0) {
                if (result.errors.some(error => error.error === 'DeviceNotRegistered')) {
                  // console.log(`Removing invalid token for user: ${userData.email}`);
                  await updateDoc(doc(db, 'users', userId), {
                    fcmToken: null,
                    tokenInvalidatedAt: new Date().toISOString()
                  });
                }
                throw new Error(`Notification errors for ${userData.email}: ${JSON.stringify(result.errors)}`);
              }

              return result;
            }).catch(error => {
              // console.error(`Error sending notification to ${userData.email}:`, error);
              throw error;
            })
          );
        } else {
          // console.log(`Admin user ${userData.email} has no FCM token`);
        }
      });

      if (notifications.length === 0) {
        // console.log('No notifications were sent because no admin users have valid FCM tokens');
        return false;
      }

      // console.log(`Sending ${notifications.length} push notifications...`);
      const results = await Promise.allSettled(notifications);

      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // console.log(`Successfully sent ${succeeded.length} notifications, failed to send ${failed.length} notifications`);

      if (failed.length > 0) {
        // console.error('Some notifications failed to send:',
        //   failed.map(f => f.reason?.message || 'Unknown error').join('\n'));
      }

      return succeeded.length > 0;
    } catch (error) {
      // console.error('Error sending notifications:', error);
      return false;
    }
  }

  async createLog(logData) {
    try {
      // console.log('Creating notification log for action:', logData.action);

      const notificationsRef = collection(db, 'notifications');

      const notificationData = {
        ...logData,
        createdAt: serverTimestamp(),
        isRead: false,
        staffAction: true
      };

      // console.log('Saving notification to Firestore:', notificationData);

      const docRef = await addDoc(notificationsRef, notificationData);
      // console.log('Notification saved with ID:', docRef.id);

      const notificationPayload = {
        title: this.getLogTitle(logData.action),
        body: this.getLogBody(logData),
        data: {
          ...logData,
          notificationId: docRef.id,
          action: logData.action,
          timestamp: new Date().toISOString()
        }
      };

      // console.log('Sending notification to admins with payload:', notificationPayload);

      const notificationResult = await this.notifyAdmins(notificationPayload);
      // console.log('Notification send result:', notificationResult);

      return true;
    } catch (error) {
      // console.error('Error creating notification log:', error);
      return false;
    }
  }

  getLogTitle(action) {
    switch (action) {
      case 'add_product':
        return 'নতুন পণ্য যুক্ত করা হয়েছে';
      case 'sale':
        return 'নতুন বিক্রয় হয়েছে';
      case 'stock_update':
        return 'স্টক আপডেট করা হয়েছে';
      case 'return':
        return 'পণ্য ফেরত আসছে';
      default:
        return 'নতুন নোটিফিকেশন';
    }
  }

  getLogBody(logData) {
    switch (logData.action) {
      case 'add_product':
        return `${logData.by} যুক্ত করেছেন: ${logData.productName} - ${logData.quantity} টি`;
      case 'sale':
        return `${logData.by} বিক্রি করেছেন: ${logData.productName} - ${logData.quantity} টি`;
      case 'stock_update':
        return `${logData.by} স্টক ${logData.type === 'in' ? 'যুক্ত' : 'বিয়োগ'} করেছেন: ${logData.productName} - ${logData.quantity} টি`;
      case 'return':
        return `${logData.by} ফেরত নিয়েছেন: ${logData.productName} - ${logData.quantity} টি`;
      default:
        return JSON.stringify(logData);
    }
  }

  // Get all notifications for admin
  async getAdminNotifications() {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('staffAction', '==', true));
      const querySnapshot = await getDocs(q);

      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        });
      });

      // Sort by creation date (newest first)
      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Get unread notification count for admin
  async getUnreadNotificationCount() {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('staffAction', '==', true),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      // console.log('Marking all notifications as read');

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('staffAction', '==', true),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // console.log('No unread notifications found');
        return { success: true, count: 0 };
      }

      // console.log(`Found ${querySnapshot.size} unread notifications to mark as read`);

      const batch = [];

      querySnapshot.forEach((docSnapshot) => {
        const notificationRef = doc(db, 'notifications', docSnapshot.id);
        batch.push(
          updateDoc(notificationRef, {
            isRead: true,
            readAt: serverTimestamp()
          })
        );
      });

      await Promise.all(batch);

      // console.log(`Successfully marked ${batch.length} notifications as read`);
      return { success: true, count: batch.length };
    } catch (error) {
      // console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }
}

export const notificationService = new NotificationService();