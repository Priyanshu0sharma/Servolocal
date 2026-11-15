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

  OrderProvider() {
    _initDemoOrders();
    fetchOrders();
  }

  void _initDemoOrders() {
    _orderHistory = [
      OrderModel(
        id: 1042,
        orderNumber: 'SL-1042',
        status: OrderStatus.delivered,
        totalAmount: 185.0,
        deliveryPin: '7391',
        items: [],
        shopName: 'Saini Restrorent and Kirana Store',
        deliveryAddress: 'Flat 402, Shiv Shakti Enclave, Kanti Nagar',
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
        riderName: 'Ramesh Kumar',
        riderPhone: '9876543210',
        isReviewed: false,
      ),
    ];
  }

  Future<bool> placeOrder({
    required List<CartItemModel> items,
    required double totalAmount,
    required String deliveryAddress,
    required String paymentMode,
  }) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final payload = {
        'items': items.map((e) => e.toJson()).toList(),
        'total_amount': totalAmount,
        'delivery_address': deliveryAddress,
        'payment_mode': paymentMode,
      };

      dynamic res;
      try {
        res = await _api.post(ApiConstants.placeOrder, payload);
      } catch (_) {
        // Fallback for seamless offline/preview mode
        res = {
          'id': DateTime.now().millisecondsSinceEpoch % 10000,
          'order_number': 'SL-${DateTime.now().millisecondsSinceEpoch % 10000}',
          'status': 'ACCEPTED',
          'total_amount': totalAmount,
          'delivery_pin': '${1000 + (DateTime.now().millisecond % 9000)}',
          'shop_name': items.isNotEmpty ? items.first.shopName : 'Local Store',
          'delivery_address': deliveryAddress,
        };
      }

      if (res is Map) {
        _activeOrder = OrderModel.fromJson(Map<String, dynamic>.from(res));
        _orderHistory.insert(0, _activeOrder!);
        _startLiveTracking();
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  void _startLiveTracking() {
    _pollingTimer?.cancel();
    // Simulate real-time progression from ACCEPTED -> PACKING -> OUT_FOR_DELIVERY -> DELIVERED
    int currentStep = 1;
    _pollingTimer = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (_activeOrder == null) {
        timer.cancel();
        return;
      }
      currentStep++;
      if (currentStep == 2) {
        _activeOrder = OrderModel(
          id: _activeOrder!.id,
          orderNumber: _activeOrder!.orderNumber,
          status: OrderStatus.packing,
          totalAmount: _activeOrder!.totalAmount,
          deliveryPin: _activeOrder!.deliveryPin,
          items: _activeOrder!.items,
          shopName: _activeOrder!.shopName,
          deliveryAddress: _activeOrder!.deliveryAddress,
          createdAt: _activeOrder!.createdAt,
          riderName: 'Ramesh Kumar',
          riderPhone: '9876543210',
        );
        notifyListeners();
      } else if (currentStep == 3) {
        _activeOrder = OrderModel(
          id: _activeOrder!.id,
          orderNumber: _activeOrder!.orderNumber,
          status: OrderStatus.outForDelivery,
          totalAmount: _activeOrder!.totalAmount,
          deliveryPin: _activeOrder!.deliveryPin,
          items: _activeOrder!.items,
          shopName: _activeOrder!.shopName,
          deliveryAddress: _activeOrder!.deliveryAddress,
          createdAt: _activeOrder!.createdAt,
          riderName: 'Ramesh Kumar',
          riderPhone: '9876543210',
        );
        notifyListeners();
      } else if (currentStep >= 4) {
        _activeOrder = OrderModel(
          id: _activeOrder!.id,
          orderNumber: _activeOrder!.orderNumber,
          status: OrderStatus.delivered,
          totalAmount: _activeOrder!.totalAmount,
          deliveryPin: _activeOrder!.deliveryPin,
          items: _activeOrder!.items,
          shopName: _activeOrder!.shopName,
          deliveryAddress: _activeOrder!.deliveryAddress,
          createdAt: _activeOrder!.createdAt,
          riderName: 'Ramesh Kumar',
          riderPhone: '9876543210',
        );
        timer.cancel();
        notifyListeners();
      }
    });
  }

  Future<void> fetchOrders() async {
    try {
      final res = await _api.get(ApiConstants.myOrders);
      if (res is List) {
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
        'delivery_rating': deliveryRating,
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
    _pollingTimer?.cancel();
    super.dispose();
  }
}
