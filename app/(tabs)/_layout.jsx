import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { SECURE_STORE_KEYS, USER_ROLES } from '../../config/auth';
import { View, Text } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import NotificationBadge from '../../components/notifications/NotificationBadge';

export default function TabLayout() {
  const [isStaff, setIsStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        // console.log('Loading user role from SecureStore...');

        const dataPromise = SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SecureStore operation timed out')), 3000)
        );

        const data = await Promise.race([dataPromise, timeoutPromise]);

        if (data) {
          try {
            // console.log('User data found, parsing...');
            const userData = JSON.parse(data);
            // console.log('User role:', userData.role);
            setIsStaff(userData.role === USER_ROLES.STAFF);
          } catch (parseError) {
            // console.error('Error parsing user data:', parseError);
            setIsStaff(false);
          }
        } else {
          // console.log('No user data found in SecureStore');
          setIsStaff(false);
        }
      } catch (error) {
        // console.error('Error loading user role:', error);
        setIsStaff(false);
      } finally {
        // console.log('Finished loading user role, setting isLoading to false');
        setIsLoading(false);
      }
    };

    getUserRole();

    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        // console.log('Safety timeout triggered for tab layout loading');
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isStaff) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4caf50',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          }
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            tabBarIcon: ({ color }) => <AntDesign name="home" size={24} color={color} />,
            tabBarLabel: 'হোম'
          }}
        />
        <Tabs.Screen
          name="AddProduct/index"
          options={{
            tabBarIcon: ({ color }) => <AntDesign name="plus" size={24} color={color} />,
            tabBarLabel: 'পণ্য যুক্ত করুন'
          }}
        />
        <Tabs.Screen
          name="TodaysSale/index"
          options={{
            tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={24} color={color} />,
            tabBarLabel: 'আজকের বিক্রি'
          }}
        />
        <Tabs.Screen
          name="Invoice/invoice"
          options={{
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document" size={24} color={color} />,
            tabBarLabel: 'বিক্রি করুন'
          }}
        />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        }
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => <AntDesign name="home" size={24} color={color} />,
          tabBarLabel: 'হোম'
        }}
      />
      <Tabs.Screen
        name="AddProduct/index"
        options={{
          tabBarIcon: ({ color }) => <AntDesign name="plus" size={24} color={color} />,
          tabBarLabel: 'পণ্য যুক্ত করুন'
        }}
      />
      <Tabs.Screen
        name="TodaysSale/index"
        options={{
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={24} color={color} />,
          tabBarLabel: 'আজকের বিক্রয়'
        }}
      />
      <Tabs.Screen
        name="Invoice/invoice"
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document" size={24} color={color} />,
          tabBarLabel: 'বিক্রি করুন'
        }}
      />
    </Tabs>
  );
}