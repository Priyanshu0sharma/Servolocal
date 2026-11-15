import 'cart_model.dart';

enum OrderStatus {
  created,
  accepted,
  packing,
  readyForPickup,
  outForDelivery,
  delivered,
  cancelled,
}

extension OrderStatusExtension on OrderStatus {
  String get displayTitle {
    switch (this) {
      case OrderStatus.created:
        return 'Order Placed';
      case OrderStatus.accepted:
        return 'Shop Accepted';
      case OrderStatus.packing:
        return 'Packing Items';
      case OrderStatus.readyForPickup:
        return 'Ready for Pickup';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get description {
    switch (this) {
      case OrderStatus.created:
        return 'Waiting for shopkeeper confirmation';
      case OrderStatus.accepted:
        return 'Shopkeeper confirmed fresh stock';
      case OrderStatus.packing:
        return 'Items being safely packed';
      case OrderStatus.readyForPickup:
        return 'Awaiting delivery fleet pickup';
      case OrderStatus.outForDelivery:
        return 'Rider heading to your doorstep';
      case OrderStatus.delivered:
        return 'Order handed over successfully';
      case OrderStatus.cancelled:
        return 'Order was cancelled';
    }
  }

  int get stepIndex {
    switch (this) {
      case OrderStatus.created:
        return 0;
      case OrderStatus.accepted:
        return 1;
      case OrderStatus.packing:
        return 2;
      case OrderStatus.readyForPickup:
      case OrderStatus.outForDelivery:
        return 3;
      case OrderStatus.delivered:
        return 4;
      case OrderStatus.cancelled:
        return -1;
    }
  }
}

class OrderModel {
  final int id;
  final String orderNumber;
  final OrderStatus status;
  final double totalAmount;
  final String deliveryPin;
  final List<CartItemModel> items;
  final String shopName;
  final String deliveryAddress;
  final DateTime createdAt;
  final String? riderName;
  final String? riderPhone;
  final bool isReviewed;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.totalAmount,
    required this.deliveryPin,
    required this.items,
    required this.shopName,
    required this.deliveryAddress,
    required this.createdAt,
    this.riderName,
    this.riderPhone,
    this.isReviewed = false,
  });

  static OrderStatus _parseStatus(String? statusStr) {
    final s = (statusStr ?? '').toUpperCase().trim();
    if (s.contains('ACCEPT')) return OrderStatus.accepted;
    if (s.contains('PACK')) return OrderStatus.packing;
    if (s.contains('READY')) return OrderStatus.readyForPickup;
    if (s.contains('OUT') || s.contains('DELIVERING')) return OrderStatus.outForDelivery;
    if (s.contains('DELIVERED')) return OrderStatus.delivered;
    if (s.contains('CANCEL')) return OrderStatus.cancelled;
    return OrderStatus.created;
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return OrderModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '1') ?? 1,
      orderNumber: json['order_number'] ?? 'SL-${json['id'] ?? 1001}',
      status: _parseStatus(json['status']?.toString()),
      totalAmount: (json['total_amount'] is num) ? (json['total_amount'] as num).toDouble() : 0.0,
      deliveryPin: json['delivery_pin']?.toString() ?? '4821',
      items: rawItems.map((e) => CartItemModel.fromJson(e as Map<String, dynamic>)).toList(),
      shopName: json['shop_name'] ?? 'Local Verified Store',
      deliveryAddress: json['delivery_address'] ?? 'Home Address',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) ?? DateTime.now() : DateTime.now(),
      riderName: json['rider_name'] ?? 'Ramesh Kumar',
      riderPhone: json['rider_phone'] ?? '9876543210',
      isReviewed: json['is_reviewed'] ?? false,
    );
  }
}
