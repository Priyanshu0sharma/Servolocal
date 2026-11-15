import 'product_model.dart';

class CartItemModel {
  final int inventoryId;
  final ProductModel product;
  int quantity;
  final String unit;
  final int shopId;
  final String shopName;

  CartItemModel({
    required this.inventoryId,
    required this.product,
    this.quantity = 1,
    required this.unit,
    required this.shopId,
    required this.shopName,
  });

  double get totalPrice => product.sellingPrice * quantity;
  double get totalMrp => product.mrp * quantity;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      inventoryId: json['inventory_id'] ?? json['id'] ?? 0,
      product: ProductModel.fromJson(json['product'] ?? json),
      quantity: json['quantity'] ?? 1,
      unit: json['unit'] ?? '1 Unit',
      shopId: json['shop_id'] ?? 1,
      shopName: json['shop_name'] ?? 'Local Store',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'inventory_id': inventoryId,
      'product': product.toJson(),
      'quantity': quantity,
      'unit': unit,
      'shop_id': shopId,
      'shop_name': shopName,
    };
  }
}
