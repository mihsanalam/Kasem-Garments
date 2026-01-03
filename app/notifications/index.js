import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rS, vS, mS } from '@/style/responsive';
import NotificationList from '@/components/notifications/NotificationList';
import { notificationService } from '@/service/api/notification';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, USER_ROLES } from '@/config/auth';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

const NotificationsScreen = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserData(userData);
        
        // Only load unread count for admin users
        if (userData.role === USER_ROLES.ADMIN) {
          loadUnreadCount();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>নোটিফিকেশন</Text>
        {userData?.role === USER_ROLES.ADMIN && unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <NotificationList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: mS(15),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: mS(15),
  },
  title: {
    fontSize: mS(20),
    fontWeight: 'bold',
    color: '#333',
  },
  badgeContainer: {
    backgroundColor: '#ff4444',
    borderRadius: mS(12),
    minWidth: mS(24),
    height: mS(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: mS(10),
    paddingHorizontal: mS(8),
  },
  badgeText: {
    color: 'white',
    fontSize: mS(12),
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
