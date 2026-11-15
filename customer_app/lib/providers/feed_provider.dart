import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../core/data/master_catalog.dart';
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
    _shops = List.from(MasterCatalog.shops);
    _allProducts = List.from(MasterCatalog.products);
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
    return _allProducts.where((p) {
      // 18+ Age Restriction Gate
      if (!isUser18Plus && p.is18Plus) return false;
      if (!isUser18Plus && p.subCategory.toLowerCase().contains('sexual wellness')) return false;

      // Category filter
      if (_selectedCategory != 'all') {
        if (!matchesCategory(_selectedCategory, p.category, p.subCategory)) {
          return false;
        }
      }

      // Search query
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().contains(q) ||
            p.brand.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q) ||
            p.subCategory.toLowerCase().contains(q);
      }

      return true;
    }).toList();
  }

  static bool matchesCategory(String selectedCatId, String productCategory, String productSubCategory) {
    if (selectedCatId == 'all') return true;
    final cat = productCategory.toLowerCase();
    final sub = productSubCategory.toLowerCase();
    switch (selectedCatId) {
      case 'veg_fruits':
        return cat.contains('veg') || cat.contains('fruit') || cat.contains('produce') ||
            sub.contains('veg') || sub.contains('fruit');
      case 'dairy_breakfast':
        return cat.contains('dairy') || cat.contains('milk') || cat.contains('breakfast') ||
            sub.contains('dairy') || sub.contains('milk') || sub.contains('bread') ||
            sub.contains('egg') || sub.contains('paneer') || sub.contains('curd') ||
            sub.contains('butter');
      case 'snacks_drinks':
        return cat.contains('snack') || cat.contains('drink') || cat.contains('beverage') ||
            cat.contains('cold') || sub.contains('chips') || sub.contains('namkeen') ||
            sub.contains('juice') || sub.contains('soda') || sub.contains('soft');
      case 'home_essentials':
        return cat.contains('home') || cat.contains('cleaning') || cat.contains('kitchen') ||
            cat.contains('household') || sub.contains('detergent') || sub.contains('dishwash') ||
            sub.contains('cleaner') || sub.contains('repellent');
      case 'personal_care':
        return cat.contains('personal') || cat.contains('beauty') || cat.contains('care') ||
            sub.contains('soap') || sub.contains('oral') || sub.contains('skin') ||
            sub.contains('shampoo') || sub.contains('wellness');
      case 'medicines':
        return cat.contains('medicine') || cat.contains('pharma') || cat.contains('health') ||
            sub.contains('pain') || sub.contains('first aid') || sub.contains('relief') ||
            sub.contains('cold') || sub.contains('digestion');
      case 'baby_care':
        return cat.contains('baby') || sub.contains('baby') || sub.contains('diaper') ||
            sub.contains('cerelac') || sub.contains('wipe');
      case 'pet_care':
        return cat.contains('pet') || sub.contains('dog') || sub.contains('cat') ||
            sub.contains('pet');
      case 'gifting':
        return cat.contains('gift') || cat.contains('sweet') || cat.contains('mithai') ||
            sub.contains('chocolate') || sub.contains('sweet');
      default:
        return cat.contains(selectedCatId.toLowerCase()) || sub.contains(selectedCatId.toLowerCase());
    }
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
