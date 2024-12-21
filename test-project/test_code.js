// Global configuration object
var globalConfig = {
  taxRate: 0.2,
  currency: 'USD',
  apiKey: 'secret_key_123',
  debug: true,
};

// Process order without proper validation
function processOrder(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price;
  }

  var tax = total * globalConfig.taxRate;
  return total + tax;
}

// Apply discount without checks
function applyDiscount(total, discount) {
  return total - total * discount;
}

// Calculate total with nested loops
function calculateTotal(orders) {
  var grandTotal = 0;

  for (var i = 0; i < orders.length; i++) {
    var orderTotal = 0;
    for (var j = 0; j < orders[i].items.length; j++) {
      orderTotal += orders[i].items[j].price;
    }
    grandTotal += orderTotal;
  }

  return grandTotal;
}

// Export without proper module system
window.processOrder = processOrder;
window.applyDiscount = applyDiscount;
window.calculateTotal = calculateTotal;
