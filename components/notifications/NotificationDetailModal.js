import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import { mS } from '@/style/responsive';
import { AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { notificationService } from '../../service/api/notification';

const NotificationDetailModal = ({ visible, notification, onClose }) => {
  if (!notification) return null;

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  // Get icon based on notification type
  const getNotificationIcon = (action) => {
    switch (action) {
      case 'add_product':
        return <AntDesign name="plus" size={24} color="#4caf50" />;
      case 'sale':
        return <Feather name="shopping-bag" size={24} color="#4caf50" />;
      case 'stock_update':
        return <MaterialCommunityIcons name="update" size={24} color="#4caf50" />;
      case 'return':
        return <MaterialCommunityIcons name="keyboard-return" size={24} color="#4caf50" />;
      default:
        return <MaterialCommunityIcons name="bell" size={24} color="#4caf50" />;
    }
  };

  // Get title based on notification type
  const getTitle = (action) => {
    switch (action) {
      case 'add_product':
        return 'নতুন পণ্য যুক্ত করা হয়েছে';
      case 'sale':
        return 'পণ্য বিক্রয় করা হয়েছে';
      case 'stock_update':
        return 'স্টক আপডেট করা হয়েছে';
      case 'return':
        return 'পণ্য ফেরত নেওয়া হয়েছে';
      default:
        return 'নোটিফিকেশন';
    }
  };

  // Get details based on notification type
  const getDetails = () => {
    const details = [];

    if (notification.by) {
      details.push({ label: 'কর্মী', value: notification.by });
    }

    if (notification.productName) {
      details.push({ label: 'পণ্য', value: notification.productName });
    }

    if (notification.quantity) {
      details.push({ label: 'পরিমাণ', value: notification.quantity });
    }

    if (notification.type) {
      details.push({
        label: 'ধরন',
        value: notification.type === 'in' ? 'যুক্ত করা হয়েছে' : 'বিয়োগ করা হয়েছে'
      });
    }

    if (notification.price) {
      details.push({ label: 'মূল্য', value: `৳${notification.price}` });
    }

    if (notification.createdAt) {
      details.push({ label: 'সময়', value: formatDate(notification.createdAt) });
    }

    return details;
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.iconContainer}>
                  {getNotificationIcon(notification.action)}
                </View>
                <Text style={styles.modalTitle}>{getTitle(notification.action)}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>
                    {notificationService.getLogBody(notification)}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  {getDetails().map((detail, index) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{detail.label}:</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: mS(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: mS(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  iconContainer: {
    width: mS(40),
    height: mS(40),
    borderRadius: mS(20),
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: mS(10),
  },
  modalTitle: {
    flex: 1,
    fontSize: mS(18),
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: mS(5),
  },
  modalContent: {
    padding: mS(15),
    maxHeight: '70%',
  },
  messageContainer: {
    backgroundColor: '#f0f8ff',
    padding: mS(15),
    borderRadius: mS(8),
    marginBottom: mS(15),
  },
  messageText: {
    fontSize: mS(16),
    color: '#333',
    lineHeight: mS(24),
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: mS(15),
    borderRadius: mS(8),
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: mS(10),
    paddingBottom: mS(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    width: '30%',
    fontSize: mS(14),
    fontWeight: 'bold',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: mS(14),
    color: '#333',
  },
  markAsReadButton: {
    margin: mS(15),
    padding: mS(12),
    backgroundColor: '#4caf50',
    borderRadius: mS(8),
    alignItems: 'center',
  },
  markAsReadButtonText: {
    color: 'white',
    fontSize: mS(16),
    fontWeight: 'bold',
  },
});

export default NotificationDetailModal;
