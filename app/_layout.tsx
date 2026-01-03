import React, { useEffect, useRef } from "react";
import { Slot } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '../config/auth';

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function Layout() {
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    useEffect(() => {
        const requestPermissions = async () => {
            try {
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'default',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#4CAF50',
                    });
                }

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    return;
                }
            } catch (error) {
                // Silent fail for permissions
            }
        };

        requestPermissions();

        notificationListener.current = Notifications.addNotificationReceivedListener(async notification => {
            try {
                const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    if (userData.role !== 'ADMIN') return;
                }
            } catch (error) {
                // Silent fail
            }
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
            try {
                const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    if (userData.role !== 'ADMIN') return;
                }

                const data = response.notification.request.content.data;
                if (data && data.notificationId) {
                    setTimeout(() => {
                        try {
                            const { router } = require('expo-router');
                            router.push('/notifications');
                        } catch (navError) {
                            // Silent fail
                        }
                    }, 1000);
                }
            } catch (error) {
                // Silent fail
            }
        });

        return () => {
            try {
                if (notificationListener.current) {
                    Notifications.removeNotificationSubscription(notificationListener.current);
                }
                if (responseListener.current) {
                    Notifications.removeNotificationSubscription(responseListener.current);
                }
            } catch (cleanupError) {
                // Silent fail
            }
        };
    }, []);

    return <Slot />;
}