import { Stack } from "expo-router";
import { StyleSheet } from 'react-native';

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="index" />
      <Stack.Screen options={{ headerShown: false }} name="productStock" />
      <Stack.Screen options={{ headerShown: false }} name="productStockTable" />
      <Stack.Screen options={{ headerShown: false }} name="returnStock" />
      <Stack.Screen options={{ headerShown: false }} name="returnStockTable" />
      <Stack.Screen options={{ headerShown: false }} name="totalSales" />
      <Stack.Screen options={{ headerShown: false }} name="adminTodaySales" />
    </Stack>
  )
}


const styles = StyleSheet.create({})