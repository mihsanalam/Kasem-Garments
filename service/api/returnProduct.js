import { db } from '../../firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, query, where, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { notificationService } from './notification';

const COLLECTION_NAME = 'returnedProducts';

class ReturnProductService {
  // Add a new returned product
  async addReturnedProduct(returnData) {
    try {
      // Validate required fields
      if (!returnData.items || !returnData.customerName) {
        throw new Error('Missing required return data');
      }

      // Create a new return document
      const returnsRef = collection(db, COLLECTION_NAME);
      
      // Create the return object
      const newReturn = {
        customerName: returnData.customerName,
        items: returnData.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        totalAmount: returnData.items.reduce((total, item) => total + (item.price * item.quantity), 0),
        totalQuantity: returnData.items.reduce((total, item) => total + item.quantity, 0),
        staffEmail: returnData.staffEmail,
        staffName: returnData.staffName || returnData.staffEmail.split('@')[0],
        createdAt: serverTimestamp(),
        date: returnData.date || new Date().toISOString()
      };
      
      // Add the return to Firestore
      const docRef = await addDoc(returnsRef, newReturn);
      
      return { 
        success: true, 
        id: docRef.id
      };
    } catch (error) {
      console.error('Error adding returned product:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  // Get all returned products
  async getAllReturnedProducts() {
    try {
      const returnsRef = collection(db, COLLECTION_NAME);
      const q = query(returnsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const returns = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        returns.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });
      
      return returns;
    } catch (error) {
      console.error('Error getting returned products:', error);
      return [];
    }
  }
  
  // Get returned products by product name
  async getReturnedProductsByName(productName) {
    try {
      const returnsRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(returnsRef);
      
      const returns = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if any item in the return has the specified product name
        const hasProduct = data.items.some(item => item.productName === productName);
        
        if (hasProduct) {
          // Filter items to only include the specified product
          const filteredItems = data.items.filter(item => item.productName === productName);
          
          returns.push({
            id: doc.id,
            ...data,
            items: filteredItems,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        }
      });
      
      return returns;
    } catch (error) {
      console.error('Error getting returned products by name:', error);
      return [];
    }
  }
}

export const returnProductService = new ReturnProductService();
