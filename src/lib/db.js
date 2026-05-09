// Mock in-memory database for MVP
export const db = {
  bills: [],
  
  // Create a new bill
  createBill: (billData) => {
    const id = Math.random().toString(36).substring(2, 10);
    const newBill = {
      id,
      ...billData,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    db.bills.push(newBill);
    return newBill;
  },

  // Get a bill by ID
  getBillById: (id) => {
    return db.bills.find(b => b.id === id);
  },

  // Get all bills for a customer phone number
  getBillsByCustomerPhone: (phone) => {
    return db.bills.filter(b => b.customerPhone === phone);
  },

  // Get all bills for a shop ID
  getBillsByShopId: (shopId) => {
    return db.bills.filter(b => b.shopId === shopId);
  }
};
