class ApiConstants {
  ApiConstants._();

  // Production Render FastAPI Backend URL
  static const String baseUrl = 'https://servolocal-api.onrender.com';

  // Auth Endpoints
  static const String sendOtp = '$baseUrl/api/auth/send-otp';
  static const String verifyOtp = '$baseUrl/api/auth/verify-otp';
  static const String profile = '$baseUrl/api/auth/profile';
  static const String updateProfile = '$baseUrl/api/auth/update-profile';

  // Discovery & Feed
  static const String discoveryFeed = '$baseUrl/api/discovery/feed';
  static const String appConfig = '$baseUrl/api/app-config';
  static const String shops = '$baseUrl/api/discovery/shops';

  // Products
  static const String productOffers = '$baseUrl/api/products/offers';
  static const String productDetails = '$baseUrl/api/products/details';

  // Orders & Lifecycle
  static const String placeOrder = '$baseUrl/api/orders/checkout';
  static const String myOrders = '$baseUrl/api/orders/my-orders';
  static const String orderDetails = '$baseUrl/api/orders/track';
  static const String cartQuote = '$baseUrl/api/orders/cart-quote';
  static const String submitReview = '$baseUrl/api/orders/review';

  // Legal
  static const String legalTerms = '$baseUrl/api/legal/policies';
}
