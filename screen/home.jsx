import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { mS, rS, vS } from "@/style/responsive";
import LogoTitle from "../components/inventory/LogoTitle";
import InfoCard from "../components/common/InfoCard";
import * as SecureStore from "expo-secure-store";
import { Feather, AntDesign } from "@expo/vector-icons";
import { SECURE_STORE_KEYS, USER_ROLES } from '../config/auth';
import AdminSidebar from "../components/sidebar/AdminSidebar";
import { notificationService } from '../service/api/notification';

const DashboardScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        if (data) {
          const { email, role } = JSON.parse(data);
          setUserName(email.split('@')[0]);
          setUserRole(role);

          // Load unread notification count for admin users
          if (role === USER_ROLES.ADMIN) {
            loadUnreadCount();
          }
        } else {
          router.replace('(auth)/signin');
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        router.replace('(auth)/signin');
      }
    };

    getUserData();

    // Set up interval to check for new notifications for admin users
    const interval = setInterval(() => {
      if (userRole === USER_ROLES.ADMIN) {
        loadUnreadCount();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [userRole]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER_DATA);
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert("ত্রুটি", "লগআউট করতে সমস্যা হচ্ছে");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <StatusBar style="auto" />

          <View style={styles.headerSection}>
            <LogoTitle
              title="ড্যাশবোর্ড"
              otherStyle={{ marginTop: mS(60), marginLeft: mS(5) }}
            />
            {userRole === USER_ROLES.ADMIN ? (
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={toggleSidebar}
                >
                  <View>
                    <Feather name="menu" style={styles.menuIcon} />
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.logoutContainer}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Feather name="log-out" style={styles.logoutIcon} />
                  <Text style={styles.logoutText}>লগ আউট</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.profileContainer}>
            <View style={styles.profileInfoContainer}>
              <Text style={styles.profileGreeting}>হ্যালো,</Text>
              <View style={styles.userNameContainer}>
                <Text style={styles.profileName}>{userName || "ব্যবহারকারী"}</Text>
              </View>
              <Text style={styles.roleText}>{userRole === USER_ROLES.ADMIN ? "এডমিন" : "স্টাফ"}</Text>
            </View>
          </View>

          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {userRole === USER_ROLES.ADMIN && (
              <>
                <View style={styles.overviewContainer}>
                  <Text style={styles.overviewTitle}>ওভারভিউ</Text>
                </View>

                <View style={styles.cardsContainer}>
                  <TouchableOpacity
                    onPress={() => router.push("(tabs)/Home/productStock")}
                  >
                    <InfoCard
                      source={require("../assets/images/download.jpeg")}
                      title={"পণ্যের স্টক"}
                      description={"যে পরিমাণ পণ্য মজুদ আছে"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("(tabs)/Home/returnStock")}
                  >
                    <InfoCard
                      source={require("../assets/images/11153363.png")}
                      title={"ফেরত মালের স্টক"}
                      description={"যে পরিমাণ পণ্য ফেরত যোগ্য"}
                      otherStyle={{ marginLeft: mS(-10) }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("(tabs)/Home/totalSales")}
                  >
                    <InfoCard
                      source={require("../assets/images/third.png")}
                      title={"মোট বিক্রি"}
                      description={"যে পরিমাণ পণ্য বিক্রি হয়েছে"}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {userRole === USER_ROLES.STAFF && (
              <>
                <View style={styles.staffWelcomeContainer}>
                  <View style={styles.staffWelcomeCard}>
                    <Text style={styles.staffWelcomeTitle}>স্বাগতম!</Text>
                    <Text style={styles.staffWelcomeText}>
                      আপনি বিক্রয় করতে পারেন, চালান দেখতে পারেন এবং পণ্য ফেরত নিতে পারেন।
                    </Text>
                    <View style={styles.staffActionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.staffActionButton}
                        onPress={() => router.push("(tabs)/Invoice/invoice")}
                      >
                        <Feather name="shopping-cart" style={styles.staffActionIcon} />
                        <Text style={styles.staffActionText}>বিক্রয় করুন</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.staffTipsContainer}>
                    <Text style={styles.staffTipsTitle}>দ্রুত টিপস</Text>
                    <View style={styles.staffTipCard}>
                      <Feather name="info" style={styles.staffTipIcon} />
                      <Text style={styles.staffTipText}>
                        পণ্য বিক্রয় করতে "বিক্রয় করুন" বাটনে ক্লিক করুন।
                      </Text>
                    </View>
                    <View style={styles.staffTipCard}>
                      <Feather name="list" style={styles.staffTipIcon} />
                      <Text style={styles.staffTipText}>
                        পণ্য বিক্রি করতে এবং চালান তৈরি করতে "বিক্রয় করুন" বাটনে ক্লিক করুন।
                      </Text>
                    </View>
                    <View style={styles.staffTipCard}>
                      <Feather name="help-circle" style={styles.staffTipIcon} />
                      <Text style={styles.staffTipText}>
                        কোন সমস্যা হলে এডমিনের সাথে যোগাযোগ করুন।
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Animated.ScrollView>
        </View>
      </ScrollView>

      {/* Admin Sidebar */}
      {userRole === USER_ROLES.ADMIN && (
        <AdminSidebar
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: mS(1),
    paddingBottom: mS(20),
  },
  container: {
    paddingHorizontal: mS(20),
    width: "100%",
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    marginTop: mS(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfoContainer: {
    marginLeft: mS(10),
  },
  profileGreeting: {
    fontSize: mS(15),
    color: 'black',
  },
  profileName: {
    fontSize: mS(22),
    color: 'black',
    fontWeight: "600",
  },
  roleText: {
    fontSize: mS(12),
    color: '#4caf50',
    marginTop: mS(2),
  },
  overviewContainer: {
    marginTop: mS(20),
  },
  overviewTitle: {
    marginLeft: mS(8),
    fontSize: mS(20),
    color: 'black',
    fontWeight: "600",
  },
  cardsContainer: {
    marginTop: mS(15),
  },
  menuContainer: {
    marginTop: mS(55),
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mS(5),
  },
  menuIcon: {
    fontSize: mS(28),
    color: '#4caf50',
  },
  logoutContainer: {
    marginTop: mS(55),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mS(5),
  },
  logoutIcon: {
    fontSize: mS(24),
    color: '#ff3b30',
    marginRight: mS(5),
  },
  logoutText: {
    fontSize: mS(16),
    color: '#ff3b30',
    fontWeight: '500',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Staff dashboard styles
  staffWelcomeContainer: {
    marginTop: mS(20),
    marginBottom: mS(20),
  },
  staffWelcomeCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: mS(12),
    padding: mS(20),
    marginBottom: mS(20),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  staffWelcomeTitle: {
    fontSize: mS(24),
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: mS(10),
  },
  staffWelcomeText: {
    fontSize: mS(16),
    color: '#333',
    marginBottom: mS(20),
    lineHeight: mS(22),
  },
  staffActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: mS(10),
  },
  staffActionButton: {
    backgroundColor: '#4caf50',
    borderRadius: mS(8),
    paddingVertical: mS(14),
    paddingHorizontal: mS(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  // Keeping this for future reference
  staffSecondaryButton: {
    backgroundColor: '#2196f3',
  },
  staffActionIcon: {
    color: 'white',
    fontSize: mS(18),
    marginRight: mS(8),
  },
  staffActionText: {
    color: 'white',
    fontSize: mS(16),
    fontWeight: 'bold',
  },
  staffTipsContainer: {
    backgroundColor: '#fff',
    borderRadius: mS(12),
    padding: mS(20),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  staffTipsTitle: {
    fontSize: mS(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: mS(15),
  },
  staffTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: mS(8),
    padding: mS(12),
    marginBottom: mS(10),
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  staffTipIcon: {
    fontSize: mS(20),
    color: '#4caf50',
    marginRight: mS(10),
  },
  staffTipText: {
    fontSize: mS(14),
    color: '#333',
    flex: 1,
    lineHeight: mS(20),
  },
});

export default DashboardScreen;