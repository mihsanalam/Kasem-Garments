import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function NotificationsLayout() {
    return (
        <>    
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 200,
                    contentStyle: { backgroundColor: 'white' }
                }}
            >
                <Stack.Screen name="index" />
            </Stack>
            <StatusBar backgroundColor="white" style="light" />
        </>
    );
}
