import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product_model.dart';
import '../models/cart_model.dart';

class CartProvider extends ChangeNotifier {
  final Map<int, CartItemModel> _items = {};
  String? _appliedCoupon;
  double _couponDiscount = 0.0;

  Map<int, CartItemModel> get items => _items;
  List<CartItemModel> get itemList => _items.values.toList();
  int get itemCount => _items.values.fold(0, (sum, item) => sum + item.quantity);
  String? get appliedCoupon => _appliedCoupon;
  double get couponDiscount => _couponDiscount;

  CartProvider() {
    loadCartFromPrefs();
  }

  double get subtotal => _items.values.fold(0.0, (sum, item) => sum + item.totalPrice);
  double get mrpTotal => _items.values.fold(0.0, (sum, item) => sum + item.totalMrp);
  double get totalSavings => (mrpTotal - subtotal) + _couponDiscount;

  double get deliveryFee => subtotal >= 199 || subtotal == 0 ? 0.0 : 15.0;
  double get platformFee => subtotal > 0 ? 2.0 : 0.0;
  double get finalTotal => (subtotal - _couponDiscount + deliveryFee + platformFee).clamp(0.0, double.infinity);

  int getQuantity(int inventoryId) {
    return _items[inventoryId]?.quantity ?? 0;
  }

  void addToCart(ProductModel product, {int qty = 1}) {
    if (_items.containsKey(product.id)) {
      _items[product.id]!.quantity += qty;
    } else {
      _items[product.id] = CartItemModel(
        inventoryId: product.id,
        product: product,
        quantity: qty,
        unit: product.unit,
        shopId: product.shopId,
        shopName: product.shopName,
      );
    }
    _saveToPrefs();
    notifyListeners();
  }

  void updateQuantity(int inventoryId, int qty) {
    if (!_items.containsKey(inventoryId)) return;
    if (qty <= 0) {
      _items.remove(inventoryId);
    } else {
      _items[inventoryId]!.quantity = qty;
    }
    _saveToPrefs();
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _appliedCoupon = null;
    _couponDiscount = 0.0;
    _saveToPrefs();
    notifyListeners();
  }

  bool applyCoupon(String code) {
    final clean = code.trim().toUpperCase();
    if (clean == 'SERVO50' && subtotal >= 149) {
      _appliedCoupon = clean;
      _couponDiscount = 50.0;
      notifyListeners();
      return true;
    } else if (clean == 'WELCOME' && subtotal >= 99) {
      _appliedCoupon = clean;
      _couponDiscount = 30.0;
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeCoupon() {
    _appliedCoupon = null;
    _couponDiscount = 0.0;
    notifyListeners();
  }

  // Shop-wise breakdown if customer orders from multiple stores
  Map<int, List<CartItemModel>> get itemsByShop {
    final Map<int, List<CartItemModel>> grouped = {};
    for (var item in itemList) {
      grouped.putIfAbsent(item.shopId, () => []).add(item);
    }
    return grouped;
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final listJson = _items.values.map((i) => i.toJson()).toList();
      await prefs.setString('servo_cart', jsonEncode(listJson));
    } catch (_) {}
  }

  Future<void> loadCartFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartStr = prefs.getString('servo_cart');
      if (cartStr != null) {
        final List<dynamic> decoded = jsonDecode(cartStr);
        _items.clear();
        for (var item in decoded) {
          final cartItem = CartItemModel.fromJson(item);
          _items[cartItem.inventoryId] = cartItem;
        }
        notifyListeners();
      }
    } catch (_) {}
  }
}
