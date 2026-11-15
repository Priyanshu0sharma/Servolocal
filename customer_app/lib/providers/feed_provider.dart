import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/shop_model.dart';
import '../models/product_model.dart';

class CategoryItem {
  final String id;
  final String name;
  final String icon;
  final String emoji;
  final Color bgColor;

  const CategoryItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.emoji,
    required this.bgColor,
  });
}

class FeedProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  bool _isLoading = false;
  String _errorMessage = '';
  List<ShopModel> _shops = [];
  List<ProductModel> _allProducts = [];
  String _selectedCategory = 'all';
  String _searchQuery = '';

  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  List<ShopModel> get shops => _shops;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;

  // The 10 Categories matching the reference design screenshot
  final List<CategoryItem> categories = const [
    CategoryItem(
      id: 'veg_fruits',
      name: 'Vegetables\n& Fruits',
      icon: 'assets/icons/fruits.png',
      emoji: '🥦',
      bgColor: Color(0xFFF0FDF4),
    ),
    CategoryItem(
      id: 'dairy_breakfast',
      name: 'Dairy &\nBreakfast',
      icon: 'assets/icons/dairy.png',
      emoji: '🥛',
      bgColor: Color(0xFFFEF2F2),
    ),
    CategoryItem(
      id: 'snacks_drinks',
      name: 'Snacks &\nBeverages',
      icon: 'assets/icons/snacks.png',
      emoji: '🍟',
      bgColor: Color(0xFFFFFBEB),
    ),
    CategoryItem(
      id: 'home_essentials',
      name: 'Home\nEssentials',
      icon: 'assets/icons/home.png',
      emoji: '🧼',
      bgColor: Color(0xFFEFF6FF),
    ),
    CategoryItem(
      id: 'personal_care',
      name: 'Personal\nCare',
      icon: 'assets/icons/care.png',
      emoji: '🧴',
      bgColor: Color(0xFFFDF2F8),
    ),
    CategoryItem(
      id: 'medicines',
      name: 'Medicines\n& Health',
      icon: 'assets/icons/pharma.png',
      emoji: '💊',
      bgColor: Color(0xFFFEF2F2),
    ),
    CategoryItem(
      id: 'baby_care',
      name: 'Baby\nCare',
      icon: 'assets/icons/baby.png',
      emoji: '🍼',
      bgColor: Color(0xFFF0F9FF),
    ),
    CategoryItem(
      id: 'pet_care',
      name: 'Pet\nCare',
      icon: 'assets/icons/pet.png',
      emoji: '🐕',
      bgColor: Color(0xFFFFF7ED),
    ),
    CategoryItem(
      id: 'gifting',
      name: 'Gifting\n& More',
      icon: 'assets/icons/gift.png',
      emoji: '🎁',
      bgColor: Color(0xFFFAF5FF),
    ),
    CategoryItem(
      id: 'all',
      name: 'All\nCategories',
      icon: 'assets/icons/all.png',
      emoji: '🍱',
      bgColor: Color(0xFFF5F5F4),
    ),
  ];

  FeedProvider() {
    _initLocalCatalog();
    fetchDiscoveryFeed();
  }

  void _initLocalCatalog() {
    _shops = [
      ShopModel(
        id: 7,
        name: 'Saini Restrorent and Kirana Store',
        category: 'Kirana & Daily Needs',
        isOpen: true,
        rating: 4.8,
        ratingCount: '1.2k+',
        distanceKm: 0.8,
        etaMins: '⚡ 10 mins',
        localityName: 'Kanti Nagar, Sindhi Camp',
      ),
      ShopModel(
        id: 1,
        name: 'Gupta Kirana Store',
        category: 'Grocery & Staples',
        isOpen: true,
        rating: 4.7,
        ratingCount: '950+',
        distanceKm: 1.2,
        etaMins: '⚡ 15 mins',
        localityName: 'Sindhi Camp Market',
      ),
      ShopModel(
        id: 2,
        name: 'Rajasthan Fresh Mart',
        category: 'Dairy, Bread & Eggs',
        isOpen: true,
        rating: 4.9,
        ratingCount: '2.1k+',
        distanceKm: 1.4,
        etaMins: '⚡ 12 mins',
        localityName: 'Station Road',
      ),
    ];

    _allProducts = [
      ProductModel(
        id: 9001,
        name: 'Amul Taaza Homogenised Toned Milk',
        brand: 'Amul',
        category: 'Dairy, Bread & Eggs',
        subCategory: 'Milk',
        sellingPrice: 28,
        mrp: 30,
        unit: '500 ml',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 7,
        shopName: 'Saini Restrorent and Kirana Store',
      ),
      ProductModel(
        id: 9002,
        name: "Lay's India's Magic Masala Potato Chips",
        brand: "Lay's",
        category: 'Snacks & Munchies',
        subCategory: 'Chips & Crisps',
        sellingPrice: 20,
        mrp: 20,
        unit: '50 g',
        imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 7,
        shopName: 'Saini Restrorent and Kirana Store',
      ),
      ProductModel(
        id: 9003,
        name: 'Fortune Sunlite Refined Sunflower Oil',
        brand: 'Fortune',
        category: 'Grocery',
        subCategory: 'Edible Oils',
        sellingPrice: 142,
        mrp: 165,
        unit: '1 L',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 1,
        shopName: 'Gupta Kirana Store',
      ),
      ProductModel(
        id: 9004,
        name: 'Aashirvaad Shudh Chakki Atta',
        brand: 'Aashirvaad',
        category: 'Grocery',
        subCategory: 'Atta & Flours',
        sellingPrice: 245,
        mrp: 275,
        unit: '5 kg',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 7,
        shopName: 'Saini Restrorent and Kirana Store',
      ),
      ProductModel(
        id: 9005,
        name: 'Dettol Original Germ Protection Bathing Soap',
        brand: 'Dettol',
        category: 'Personal Care',
        subCategory: 'Bath & Body',
        sellingPrice: 95,
        mrp: 110,
        unit: 'Pack of 3 x 75g',
        imageUrl: 'https://images.unsplash.com/photo-1607006314187-573e047466eb?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 1,
        shopName: 'Gupta Kirana Store',
      ),
      ProductModel(
        id: 9006,
        name: 'Dolo 650 Paracetamol Tablets',
        brand: 'Micro Labs',
        category: 'Medicines & Health',
        subCategory: 'First Aid & Pain',
        sellingPrice: 32,
        mrp: 35,
        unit: 'Strip of 15 Tabs',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        shopId: 2,
        shopName: 'Rajasthan Fresh Mart',
      ),
      // Adult 18+ Product (Protected by age gate)
      ProductModel(
        id: 9020,
        name: 'Durex Extra Thin Ultra Lubricated Condoms',
        brand: 'Durex',
        category: 'Personal Care',
        subCategory: 'Sexual Wellness',
        sellingPrice: 220,
        mrp: 240,
        unit: 'Pack of 10',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        is18Plus: true,
        shopId: 7,
        shopName: 'Saini Restrorent and Kirana Store',
      ),
    ];
  }

  Future<void> fetchDiscoveryFeed() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.discoveryFeed);
      if (res is Map) {
        if (res.containsKey('shops') && res['shops'] is List) {
          final rawShops = res['shops'] as List;
          if (rawShops.isNotEmpty) {
            _shops = rawShops.map((s) => ShopModel.fromJson(s)).toList();
          }
        }
        if (res.containsKey('products') && res['products'] is List) {
          final rawProds = res['products'] as List;
          if (rawProds.isNotEmpty) {
            _allProducts = rawProds.map((p) => ProductModel.fromJson(p)).toList();
          }
        }
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  List<ProductModel> getFilteredProducts({required bool isUser18Plus}) {
    return _allProducts.filter((p) {
      // 18+ Age Restriction Gate
      if (!isUser18Plus && p.is18Plus) return false;
      if (!isUser18Plus && p.subCategory.toLowerCase().contains('sexual wellness')) return false;

      // Category filter
      if (_selectedCategory != 'all') {
        final catLower = _selectedCategory.toLowerCase();
        final pCatLower = p.category.toLowerCase();
        if (!pCatLower.contains(catLower) && !catLower.contains(pCatLower)) {
          return false;
        }
      }

      // Search query
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().contains(q) ||
            p.brand.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q);
      }

      return true;
    }).toList();
  }

  void selectCategory(String catId) {
    _selectedCategory = catId;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }
}

extension ProductListFilter on List<ProductModel> {
  List<ProductModel> filter(bool Function(ProductModel p) test) {
    return where(test).toList();
  }
}
