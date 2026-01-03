import { db } from '../../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { notificationService } from './notification';

const COLLECTION_NAME = 'products';

class ProductService {
  // Add a new product
  async addProduct(productData) {
    try {
      const productRef = doc(collection(db, COLLECTION_NAME));
      
      // Validate and clean the name
      if (!productData.name || typeof productData.name !== 'string') {
        throw new Error('Product name is required and must be a string');
      }
      const name = productData.name.trim();
      if (name.length === 0) {
        throw new Error('Product name cannot be empty');
      }

      // Create current timestamp for array entries
      const now = Timestamp.now();

      // Create new product object with proper data types
      const newProduct = {
        name,
        id: productRef.id,
        dateAdded: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        currentStock: parseInt(productData.quantity) || 0,
        originalQuantity: parseInt(productData.quantity) || 0,
        wholesalePrice: parseInt(productData.wholesalePrice) || 0,
        retailPrice: parseInt(productData.retailPrice) || 0,
        stockHistory: [{
          date: now,
          type: 'in',
          quantity: parseInt(productData.quantity) || 0,
          note: 'Initial stock',
          by: productData.addedBy || 'unknown'
        }],
        image: productData.image || null
      };

      await setDoc(productRef, newProduct);

      // Send notification to admins
      await notificationService.notifyAdmins({
        title: 'নতুন পণ্য যোগ করা হয়েছে',
        body: `${productData.addedBy || 'Staff'} যোগ করেছে: ${name} - ${productData.quantity} টি`,
        data: {
          type: 'product_add',
          productId: productRef.id,
          productName: name,
          quantity: productData.quantity,
          by: productData.addedBy
        }
      });

      return { success: true, id: productRef.id };
    } catch (error) {
      // console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
  }

  // Get a single product
  async getProduct(productId) {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        return { 
          success: true, 
          data: { 
            id: productSnap.id, 
            ...productSnap.data(),
            name: productSnap.data().name || '' // Ensure name is never undefined
          }
        };
      }
      return { success: false, error: 'Product not found' };
    } catch (error) {
      // console.error('Error getting product:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all products
  async getAllProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      // console.error('Error getting products:', error);
      return [];
    }
  }

  // Update product details
  async updateProduct(productId, updateData) {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      await updateDoc(productRef, {
        ...updateData,
        lastUpdated: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      // console.error('Error updating product:', error);
      return { success: false, error };
    }
  }

  // Update product stock
  async updateProductStock(productId, quantity, type, note, userId) {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      const productData = productSnap.data();
      const currentStock = productData.currentStock || 0;
      const newQuantity = type === 'in' ? 
        currentStock + quantity :
        currentStock - quantity;

      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }

      const stockHistoryEntry = {
        date: Timestamp.now(),
        type,
        quantity,
        note: note || '',
        by: userId
      };

      await updateDoc(productRef, {
        currentStock: newQuantity,
        lastUpdated: serverTimestamp(),
        stockHistory: [...(productData.stockHistory || []), stockHistoryEntry]
      });

      // Create notification log for stock update
      await notificationService.createLog({
        action: 'stock_update',
        by: userId,
        productName: productData.name,
        quantity: quantity,
        type: type
      });

      return { success: true, currentStock: newQuantity };
    } catch (error) {
      // console.error('Error updating product stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Search products by name (case-insensitive)
  async searchProductsByName(name) {
    try {
      const searchTerm = name.toLowerCase().trim();
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => product.name && 
                product.name.toLowerCase().includes(searchTerm));
    } catch (error) {
      // console.error('Error searching products:', error);
      return [];
    }
  }

  // Get products by price range
  async getProductsByPriceRange(minPrice, maxPrice) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('wholesalePrice', '>=', minPrice),
        where('wholesalePrice', '<=', maxPrice)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      // console.error('Error getting products by price range:', error);
      return [];
    }
  }
}

export const productService = new ProductService();