class ProductModel {
  final int id;
  final String name;
  final String brand;
  final String category;
  final String subCategory;
  final double sellingPrice;
  final double mrp;
  final String unit;
  final String imageUrl;
  final bool inStock;
  final int shopId;
  final String shopName;
  final bool is18Plus;
  final double rating;

  ProductModel({
    required this.id,
    required this.name,
    this.brand = 'Authentic',
    required this.category,
    this.subCategory = '',
    required this.sellingPrice,
    required this.mrp,
    this.unit = '1 Unit',
    required this.imageUrl,
    this.inStock = true,
    this.shopId = 1,
    this.shopName = 'Verified Local Store',
    this.is18Plus = false,
    this.rating = 4.8,
  });

  int get discountPct => mrp > sellingPrice
      ? (((mrp - sellingPrice) / mrp) * 100).round()
      : 0;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? 'Product Item',
      brand: json['brand'] ?? 'Local Store',
      category: json['category'] ?? 'Grocery',
      subCategory: json['sub_category'] ?? '',
      sellingPrice: (json['selling_price'] is num)
          ? (json['selling_price'] as num).toDouble()
          : 0.0,
      mrp: (json['mrp'] is num)
          ? (json['mrp'] as num).toDouble()
          : ((json['selling_price'] is num)
              ? (json['selling_price'] as num).toDouble()
              : 0.0),
      unit: json['unit'] ?? json['default_weight_or_size'] ?? '1 Unit',
      imageUrl: json['image_url'] ?? '',
      inStock: json['in_stock'] ?? true,
      shopId: json['shop_id'] is int ? json['shop_id'] : 1,
      shopName: json['shop_name'] ?? 'Verified Local Store',
      is18Plus: json['is_18_plus'] ?? false,
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.8,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'category': category,
      'sub_category': subCategory,
      'selling_price': sellingPrice,
      'mrp': mrp,
      'unit': unit,
      'image_url': imageUrl,
      'in_stock': inStock,
      'shop_id': shopId,
      'shop_name': shopName,
      'is_18_plus': is18Plus,
      'rating': rating,
    };
  }
}
