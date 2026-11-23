import 'dart:async';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/order_model.dart';
import '../models/cart_model.dart';

class OrderProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  OrderModel? _activeOrder;
  List<OrderModel> _orderHistory = [];
  bool _isLoading = false;
  String _errorMessage = '';
  Timer? _pollingTimer;

  OrderModel? get activeOrder => _activeOrder;
  List<OrderModel> get orderHistory => _orderHistory;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  int? _customerId;
  bool _disposed = false;

  void setCustomer(int? id) {
    if (id == _customerId) return;
    _customerId = id;
    _pollingTimer?.cancel();
    _activeOrder = null;
    _orderHistory = [];
    _errorMessage = '';
    _isLoading = false;
    notifyListeners();
    if (id != null) fetchOrders();
  }

  Map<String, dynamic> _cartPayload(List<CartItemModel> items, String? coupon) {
    if (items.isEmpty || items.any((item) => item.shopId != items.first.shopId)) {
      throw ApiException('Please check out one shop at a time.');
    }
    return {
      'shop_id': items.first.shopId,
      'items': items.map((item) => {'inventory_id': item.inventoryId, 'quantity': item.quantity}).toList(),
      'coupon_code': coupon,
    };
  }

  Future<double> quote(List<CartItemModel> items, String? coupon) async {
    final response = await _api.post(ApiConstants.cartQuote, _cartPayload(items, coupon));
    return (response['grand_total'] as num).toDouble();
  }

  Future<bool> placeOrder({
    required List<CartItemModel> items,
    required double totalAmount,
    required String deliveryAddress,
    required String paymentMode,
    required double lat,
    required double lng,
    String? coupon,
  }) async {
    final customer = _customerId;
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final response = await _api.post(ApiConstants.placeOrder, {
        ..._cartPayload(items, coupon),
        'expected_total': totalAmount,
        'delivery_address': deliveryAddress,
        'delivery_lat': lat,
        'delivery_lng': lng,
        'payment_method': paymentMode,
      });
      if (_disposed || customer != _customerId) return false;
      final confirmed = response['order'];
      if (confirmed is! Map || confirmed['id'] == null) {
        throw ApiException('Order confirmation unavailable. Check your order history.');
      }
      _activeOrder = OrderModel.fromJson({...Map<String, dynamic>.from(confirmed),
        'items': items.map((item) => item.toJson()).toList()});
      _orderHistory.insert(0, _activeOrder!);
      _startLiveTracking();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      if (_disposed || customer != _customerId) return false;
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  void _startLiveTracking() {
    _pollingTimer?.cancel();
    final order = _activeOrder!;
    bool loading = false;
    _pollingTimer = Timer.periodic(const Duration(seconds: 8), (timer) async {
      if (loading) return;
      loading = true;
      try {
        final data = await _api.get('${ApiConstants.orderDetails}/${order.id}');
        if (!timer.isActive || _activeOrder?.id != order.id) return;
        final latest = OrderModel.fromJson({...Map<String, dynamic>.from(data),
          'created_at': order.createdAt.toIso8601String(),
          'items': order.items.map((item) => item.toJson()).toList()});
        _activeOrder = latest;
        final index = _orderHistory.indexWhere((entry) => entry.id == latest.id);
        if (index >= 0) _orderHistory[index] = latest;
        if (latest.status == OrderStatus.delivered || latest.status == OrderStatus.cancelled) timer.cancel();
        notifyListeners();
      } catch (_) {
        // Keep the last confirmed status while the network is unavailable.
      } finally {
        loading = false;
      }
    });
  }

  Future<void> fetchOrders() async {
    final customer = _customerId;
    if (customer == null) return;
    try {
      final res = await _api.get(ApiConstants.myOrders);
      if (!_disposed && customer == _customerId && res is List) {
        _orderHistory = res.map((e) => OrderModel.fromJson(e)).toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> submitReview({
    required int orderId,
    required double productRating,
    required double shopRating,
    required double deliveryRating,
    required String comment,
  }) async {
    try {
      await _api.post(ApiConstants.submitReview, {
        'order_id': orderId,
        'product_rating': productRating,
        'shop_rating': shopRating,
        'partner_rating': deliveryRating.round(),
        'comment': comment.trim(),
      });
      // Mark as reviewed in memory
      final idx = _orderHistory.indexWhere((o) => o.id == orderId);
      if (idx != -1) {
        final old = _orderHistory[idx];
        _orderHistory[idx] = OrderModel(
          id: old.id,
          orderNumber: old.orderNumber,
          status: old.status,
          totalAmount: old.totalAmount,
          deliveryPin: old.deliveryPin,
          items: old.items,
          shopName: old.shopName,
          deliveryAddress: old.deliveryAddress,
          createdAt: old.createdAt,
          riderName: old.riderName,
          riderPhone: old.riderPhone,
          isReviewed: true,
        );
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _pollingTimer?.cancel();
    super.dispose();
  }
}
