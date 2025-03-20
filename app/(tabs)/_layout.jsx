import { Tabs, Redirect } from 'expo-router';
import React from 'react';
// import { Platform } from 'react-native';

// import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
// import TabBarBackground from '@/components/ui/TabBarBackground';
// import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        // tabBarButton: HapticTab,
        // tabBarBackground: TabBarBackground,
        // tabBarStyle: Platform.select({
        //   ios: {
        //     // Use a transparent background on iOS to show the blur effect
        //     position: 'absolute',
        //   },
        //   default: {},
        // }),
      }}>
      {/* <Tabs.Screen
        name="Dashboard/index"
        options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => 
            <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      /> */}
       <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="AddProduct/index"
        options={{
          title: 'Add Product',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.square.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="TodaysSale/index"
        options={{
          title: 'Today Deals',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="invoice.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}