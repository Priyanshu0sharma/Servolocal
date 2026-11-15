import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/feed_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../product/product_detail_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  int _selectedCategoryIndex = 0;

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final cartProv = context.watch<CartProvider>();
    final authProv = context.watch<AuthProvider>();
    final categories = feedProv.categories;
    final activeCat = categories[_selectedCategoryIndex];

    // Filter products for this category
    final allProducts = feedProv.getFilteredProducts(isUser18Plus: authProv.is18Plus);
    final categoryProducts = activeCat.id == 'all'
        ? allProducts
        : allProducts.where((p) {
            final catLower = activeCat.name.toLowerCase();
            final pCatLower = p.category.toLowerCase();
            return pCatLower.contains(activeCat.id) || catLower.contains(pCatLower) || pCatLower.contains(catLower);
          }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Categories & Aisles', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: Row(
        children: [
          // ── Left Aisle Sidebar ───────────────────────────────────────────
          Container(
            width: 95,
            color: Colors.white,
            child: ListView.builder(
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = index == _selectedCategoryIndex;

                return GestureDetector(
                  onTap: () => setState(() => _selectedCategoryIndex = index),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primaryGhost : Colors.transparent,
                      border: Border(
                        left: BorderSide(
                          color: isSelected ? AppColors.primary : Colors.transparent,
                          width: 3.5,
                        ),
                        bottom: const BorderSide(color: AppColors.borderSubtle),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(cat.emoji, style: const TextStyle(fontSize: 22)),
                        const SizedBox(height: 4),
                        Text(
                          cat.name.replaceAll('\n', ' '),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const VerticalDivider(width: 1, color: AppColors.border),

          // ── Right Products Grid ──────────────────────────────────────────
          Expanded(
            child: categoryProducts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(activeCat.emoji, style: const TextStyle(fontSize: 48)),
                        const SizedBox(height: 8),
                        Text(
                          'No products found in ${activeCat.name.replaceAll('\n', ' ')}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: categoryProducts.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 0.65,
                    ),
                    itemBuilder: (context, index) {
                      final p = categoryProducts[index];
                      final qty = cartProv.getQuantity(p.id);

                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Center(
                                  child: Image.network(
                                    p.imageUrl,
                                    fit: BoxFit.contain,
                                    errorBuilder: (_, __, ___) => const Text('📦', style: TextStyle(fontSize: 28)),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                p.name,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(p.unit, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '₹${p.sellingPrice.toInt()}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
                                  ),
                                  qty > 0
                                      ? Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            '$qty in Cart',
                                            style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                                          ),
                                        )
                                      : GestureDetector(
                                          onTap: () => cartProv.addToCart(p),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: AppColors.primaryGhost,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: AppColors.borderOrange),
                                            ),
                                            child: const Text(
                                              'ADD',
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w900,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                        ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
