import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { mS, rS, vS } from '@/style/responsive';
import { AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '../../config/auth';
import { notificationService } from '../../service/api/notification';

const { width, height } = Dimensions.get('window');

const AdminSidebar = ({ isVisible, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(-width));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Load unread notification count
      loadUnreadCount();

      // Animate sidebar in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate sidebar out
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER_DATA);
      onClose();
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert("ত্রুটি", "লগআউট করতে সমস্যা হচ্ছে");
    }
  };

  const handleCreateUser = () => {
    onClose();
    router.push("(auth)/signup");
  };

  const handleViewNotifications = () => {
    onClose();
    // Navigate to notifications screen
    router.push("/notifications");
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />

        <Animated.View
          style={[
            styles.sidebarContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>মেনু</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleViewNotifications}
            >
              <View style={styles.menuItemContent}>
                <MaterialCommunityIcons name="bell" size={24} color="#4caf50" />
                <Text style={styles.menuItemText}>নোটিফিকেশন</Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.createUserItem]}
              onPress={handleCreateUser}
            >
              <View style={styles.menuItemContent}>
                <AntDesign name="adduser" size={24} color="#4caf50" />
                <Text style={styles.menuItemText}>নতুন ব্যবহারকারী</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.createUserItem]}
              onPress={() => {
                onClose();
                router.push("(tabs)/Home/adminTodaySales");
              }}
            >
              <View style={styles.menuItemContent}>
                <Feather name="shopping-bag" size={24} color="#4caf50" />
                <Text style={styles.menuItemText}>বিক্রেতার বিক্রি</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.menuItemContent}>
                <Feather name="log-out" size={24} color="#ff3b30" />
                <Text style={[styles.menuItemText, styles.logoutText]}>লগ আউট</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sidebarContainer: {
    position: 'absolute',
    width: width * 0.75,
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: mS(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: mS(20),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: mS(5),
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: mS(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: mS(16),
    marginLeft: mS(16),
    color: '#333',
  },
  createUserItem: {
    marginTop: mS(20),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutItem: {
    marginTop: mS(60),
    borderTopWidth: 2,
    borderTopColor: '#ff3b30',
    paddingTop: mS(15),
    marginHorizontal: mS(10),
  },
  logoutText: {
    color: '#ff3b30',
  },
  badge: {
    backgroundColor: '#ff3b30',
    borderRadius: mS(12),
    minWidth: mS(24),
    height: mS(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: mS(8),
  },
  badgeText: {
    color: 'white',
    fontSize: mS(12),
    fontWeight: 'bold',
  },
});

export default AdminSidebar;
