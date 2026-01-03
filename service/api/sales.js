import { db } from '../../firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { notificationService } from './notification';

const COLLECTION_NAME = 'sales';
const TODAY_SALES_COLLECTION = 'todaySales';

class SalesService {
  // Add a new sale
  async addSale(saleData) {
    try {
      // Validate required fields
      if (!saleData.staffEmail || !saleData.customerName || !saleData.products || !saleData.totalAmount) {
        throw new Error('Missing required sale data');
      }

      // Create a new sale document
      const salesRef = collection(db, COLLECTION_NAME);

      // Get the last sale to determine the next SL number
      const lastSaleQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy('slNumber', 'desc'),
        limit(1)
      );

      const lastSaleSnapshot = await getDocs(lastSaleQuery);
      let nextSlNumber = 1;

      if (!lastSaleSnapshot.empty) {
        const lastSale = lastSaleSnapshot.docs[0].data();
        nextSlNumber = (lastSale.slNumber || 0) + 1;
      }

      // Create the sale object
      const newSale = {
        slNumber: nextSlNumber,
        staffEmail: saleData.staffEmail,
        staffName: saleData.staffName || saleData.staffEmail.split('@')[0],
        customerName: saleData.customerName,
        totalQuantity: saleData.totalQuantity || 0,
        returnQuantity: saleData.returnQuantity || 0,
        totalAmount: saleData.totalAmount,
        products: saleData.products || [],
        returnProducts: saleData.returnProducts || [],
        hasReturns: saleData.hasReturns || false,
        createdAt: serverTimestamp(),
        previousDue: saleData.previousDue || 0,
        deposit: saleData.deposit || 0,
        currentDue: saleData.currentDue || 0
      };

      // Add the sale to Firestore
      const docRef = await addDoc(salesRef, newSale);

      // Also save to today's sales collection
      const todaySalesRef = collection(db, TODAY_SALES_COLLECTION);
      await addDoc(todaySalesRef, {
        ...newSale,
        originalSaleId: docRef.id
      });

      // Create notification for admin
      await notificationService.createLog({
        action: 'sale',
        by: saleData.staffEmail,
        productName: saleData.products.map(p => `${p.productName} (${p.quantity})`).join(', '),
        quantity: saleData.totalQuantity,
        amount: saleData.totalAmount,
        customerName: saleData.customerName
      });

      return {
        success: true,
        id: docRef.id,
        slNumber: nextSlNumber
      };
    } catch (error) {
      console.error('Error adding sale:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all sales
  async getAllSales() {
    try {
      const salesRef = collection(db, COLLECTION_NAME);
      const q = query(salesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const sales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      return sales;
    } catch (error) {
      console.error('Error getting sales:', error);
      return [];
    }
  }

  // Get sales by staff
  async getSalesByStaff(staffEmail) {
    try {
      const salesRef = collection(db, COLLECTION_NAME);
      const q = query(
        salesRef,
        where('staffEmail', '==', staffEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const sales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      return sales;
    } catch (error) {
      console.error('Error getting sales by staff:', error);
      return [];
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate) {
    try {
      const salesRef = collection(db, COLLECTION_NAME);
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));

      const q = query(
        salesRef,
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const sales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      return sales;
    } catch (error) {
      console.error('Error getting sales by date range:', error);
      return [];
    }
  }

  // Get all today's sales
  async getAllTodaySales() {
    try {
      const todaySalesRef = collection(db, TODAY_SALES_COLLECTION);
      const q = query(todaySalesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const sales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      return sales;
    } catch (error) {
      console.error('Error getting today\'s sales:', error);
      return [];
    }
  }

  // Get today's sales by staff
  async getTodaySalesByStaff(staffEmail) {
    try {
      const todaySalesRef = collection(db, TODAY_SALES_COLLECTION);
      const q = query(
        todaySalesRef,
        where('staffEmail', '==', staffEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const sales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      return sales;
    } catch (error) {
      console.error('Error getting today\'s sales by staff:', error);
      return [];
    }
  }

  // Clear today's sales (to be called at the end of the day)
  async clearTodaySales() {
    try {
      const todaySalesRef = collection(db, TODAY_SALES_COLLECTION);
      const querySnapshot = await getDocs(todaySalesRef);

      // Delete all documents in the collection
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('Error clearing today\'s sales:', error);
      return { success: false, error: error.message };
    }
  }
}

export const salesService = new SalesService();
