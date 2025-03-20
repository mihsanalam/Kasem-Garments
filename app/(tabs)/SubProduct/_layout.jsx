import { Stack } from "expo-router";
import { StyleSheet } from 'react-native';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="index" />
    </Stack>
  )
}

 

const styles = StyleSheet.create({})