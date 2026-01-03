import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { rS, vS, mS } from '@/style/responsive';
import { notificationService } from '../../service/api/notification';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, USER_ROLES } from '../../config/auth';
import { AntDesign } from '@expo/vector-icons';
import NotificationDetailModal from './NotificationDetailModal';

const NotificationItem = ({ notification, onPress }) => {
  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.action}</Text>
        <Text style={styles.notificationBody}>
          {notificationService.getLogBody(notification)}
        </Text>
        <Text style={styles.notificationDate}>
          {formatDate(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );
};

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserData(userData);

        // Only load notifications for admin users
        if (userData.role === USER_ROLES.ADMIN) {
          loadNotifications();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationData = await notificationService.getAdminNotifications();
      setNotifications(notificationData);
      applyFilter(activeFilter, notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (filter, notificationsData = notifications) => {
    setActiveFilter(filter);

    if (filter === 'all') {
      setFilteredNotifications(notificationsData);
      return;
    }

    const filtered = notificationsData.filter(notification =>
      notification.action === filter
    );

    setFilteredNotifications(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read automatically when clicked
    if (!notification.isRead) {
      try {
        await notificationService.markNotificationAsRead(notification.id);

        // Update the notification in our state
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );

        // Update filtered notifications
        setFilteredNotifications(prevFiltered =>
          prevFiltered.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );

        // Set the selected notification with isRead=true
        setSelectedNotification({
          ...notification,
          isRead: true
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Still show the modal even if marking as read fails
        setSelectedNotification(notification);
      }
    } else {
      setSelectedNotification(notification);
    }

    setModalVisible(true);
  };

  const handleMarkAsRead = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markNotificationAsRead(notification.id);
        // Update the local state to reflect the change
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );

        // Also update the selected notification
        setSelectedNotification({
          ...notification,
          isRead: true
        });

        // Update filtered notifications
        setFilteredNotifications(prevFiltered =>
          prevFiltered.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Check if there are any unread notifications
      const hasUnread = notifications.some(notification => !notification.isRead);

      if (!hasUnread) {
        return; // No unread notifications to mark
      }

      // Call the service to mark all as read
      const result = await notificationService.markAllNotificationsAsRead();

      if (result.success) {
        // Update all notifications in state
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true
        }));

        setNotifications(updatedNotifications);
        setFilteredNotifications(
          filteredNotifications.map(notification => ({
            ...notification,
            isRead: true
          }))
        );

        // If a notification is selected, update it too
        if (selectedNotification) {
          setSelectedNotification({
            ...selectedNotification,
            isRead: true
          });
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  if (!userData || userData.role !== USER_ROLES.ADMIN) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          শুধুমাত্র এডমিন ব্যবহারকারীরা নোটিফিকেশন দেখতে পারবেন।
        </Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>কোন নোটিফিকেশন নেই</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadNotifications}>
          <AntDesign name="reload1" size={24} color="#4caf50" />
          <Text style={styles.refreshText}>রিফ্রেশ করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderFilterButton = (title, filter) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => applyFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.activeFilterButtonText
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.filterContainer}>
          {renderFilterButton('সব', 'all')}
          {renderFilterButton('নতুন পণ্য', 'add_product')}
          {renderFilterButton('স্টক আপডেট', 'stock_update')}
          {renderFilterButton('বিক্রয়', 'sale')}
        </View>

        {/* Mark All as Read button */}
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity
            style={styles.markAllAsReadButton}
            onPress={handleMarkAllAsRead}
          >
            <AntDesign name="check" size={16} color="white" />
            <Text style={styles.markAllAsReadText}>সব পঠিত করুন</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>এই ফিল্টারে কোন নোটিফিকেশন নেই</Text>
          </View>
        }
      />

      <NotificationDetailModal
        visible={modalVisible}
        notification={selectedNotification}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mS(20),
    marginTop: mS(20),
  },
  emptyText: {
    fontSize: mS(16),
    textAlign: 'center',
    color: '#666',
  },
  headerContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mS(10),
    paddingVertical: mS(10),
  },
  markAllAsReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    padding: mS(10),
    margin: mS(10),
    borderRadius: mS(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  markAllAsReadText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: mS(5),
    fontSize: mS(14),
  },
  filterButton: {
    paddingVertical: mS(10),
    paddingHorizontal: mS(15),
    borderRadius: mS(20),
    backgroundColor: '#f0f0f0',
    marginHorizontal: mS(2),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: mS(15),
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: mS(20),
    padding: mS(10),
    backgroundColor: '#f0f0f0',
    borderRadius: mS(8),
  },
  refreshText: {
    marginLeft: mS(8),
    color: '#4caf50',
    fontSize: mS(16),
  },
  listContainer: {
    padding: mS(10),
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: mS(8),
    padding: mS(15),
    marginBottom: mS(10),
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: mS(16),
    fontWeight: 'bold',
    marginBottom: mS(5),
    color: '#333',
  },
  notificationBody: {
    fontSize: mS(14),
    color: '#666',
    marginBottom: mS(5),
  },
  notificationDate: {
    fontSize: mS(12),
    color: '#999',
  },
  unreadIndicator: {
    width: mS(10),
    height: mS(10),
    borderRadius: mS(5),
    backgroundColor: '#4caf50',
    marginLeft: mS(10),
    alignSelf: 'center',
  },
});

export default NotificationList;
