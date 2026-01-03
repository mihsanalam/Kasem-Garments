import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { notificationService } from '../../service/api/notification';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, USER_ROLES } from '../../config/auth';
import { mS } from '@/style/responsive';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
    
    // Set up interval to check for new notifications
    const interval = setInterval(() => {
      if (isAdmin) {
        loadUnreadCount();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  const checkUserRole = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const isAdminUser = userData.role === USER_ROLES.ADMIN;
        setIsAdmin(isAdminUser);
        
        if (isAdminUser) {
          loadUnreadCount();
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
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

  if (!isAdmin || unreadCount === 0) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: mS(18),
    height: mS(18),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: mS(4),
  },
  badgeText: {
    color: 'white',
    fontSize: mS(10),
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
