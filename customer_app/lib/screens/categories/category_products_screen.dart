import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/feed_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/floating_cart_bar.dart';
import '../product/product_detail_screen.dart';

class CategoryProductsScreen extends StatefulWidget {
  final CategoryItem category;

  const CategoryProductsScreen({super.key, required this.category});

  @override
  State<CategoryProductsScreen> createState() => _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends State<CategoryProductsScreen> {
  String _selectedSubcategory = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final cartProv = context.watch<CartProvider>();
    final authProv = context.watch<AuthProvider>();

    // Get products for this category using the master category matching logic
    final allCategoryProducts = feedProv
        .getFilteredProducts(isUser18Plus: authProv.is18Plus)
        .where((p) => FeedProvider.matchesCategory(widget.category.id, p.category, p.subCategory))
        .toList();

    // Extract subcategories
    final Set<String> subcats = {'All'};
    for (var p in allCategoryProducts) {
      if (p.subCategory.isNotEmpty) {
        subcats.add(p.subCategory);
      }
    }

    // Filter by subcategory and search
    final displayedProducts = allCategoryProducts.where((p) {
      if (_selectedSubcategory != 'All') {
        if (p.subCategory != _selectedSubcategory) return false;
      }
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().contains(q) ||
            p.brand.toLowerCase().contains(q) ||
            p.subCategory.toLowerCase().contains(q);
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.category.emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 8),
            Text(
              widget.category.name.replaceAll('\n', ' '),
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 16,
              ),
            ),
          ],
        ),
        centerTitle: false,
      ),
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── Search In This Category ──────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            onChanged: (val) {
                              setState(() => _searchQuery = val);
                            },
                            decoration: InputDecoration(
                              hintText: 'Search in ${widget.category.name.replaceAll('\n', ' ')}...',
                              hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Sub-Category Horizontal Filter ─────────────────────────────
              if (subcats.length > 1)
                SliverToBoxAdapter(
                  child: Container(
                    height: 44,
                    margin: const EdgeInsets.only(top: 6, bottom: 8),
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      physics: const BouncingScrollPhysics(),
                      children: subcats.map((sc) {
                        final isSelected = _selectedSubcategory == sc;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(sc),
                            selected: isSelected,
                            onSelected: (_) => setState(() => _selectedSubcategory = sc),
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                            selectedColor: AppColors.primary,
                            backgroundColor: AppColors.surface,
                            side: BorderSide(
                              color: isSelected ? AppColors.primary : AppColors.border,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

              // ── Header count ───────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${displayedProducts.length} Items Available',
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Row(
                        children: const [
                          Icon(Icons.bolt_rounded, size: 16, color: AppColors.warning),
                          Text(
                            'Delivery in 10-15 mins',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ── Products Grid ──────────────────────────────────────────────
              displayedProducts.isEmpty
                  ? SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: const [
                            Icon(Icons.search_off_rounded, size: 48, color: AppColors.textMuted),
                            SizedBox(height: 12),
                            Text(
                              'No products match your filter',
                              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.68,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final product = displayedProducts[index];
                            final qty = cartProv.getQuantity(product.id);

                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(product: product),
                                  ),
                                );
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: AppColors.border),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.all(10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Product Image
                                    Expanded(
                                      child: Stack(
                                        children: [
                                          Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.surfaceMuted,
                                              borderRadius: BorderRadius.circular(14),
                                            ),
                                            child: ClipRRect(
                                              borderRadius: BorderRadius.circular(14),
                                              child: Image.network(
                                                product.imageUrl,
                                                fit: BoxFit.cover,
                                                width: double.infinity,
                                                height: double.infinity,
                                                errorBuilder: (_, __, ___) => const Center(
                                                  child: Icon(Icons.shopping_bag_outlined, color: AppColors.textMuted),
                                                ),
                                              ),
                                            ),
                                          ),
                                          if (product.mrp > product.sellingPrice)
                                            Positioned(
                                              top: 6,
                                              left: 6,
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF166534),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  '${(((product.mrp - product.sellingPrice) / product.mrp) * 100).round()}% OFF',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w900,
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),

                                    const SizedBox(height: 8),

                                    // Weight Tag
                                    Text(
                                      product.unit,
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textMuted,
                                      ),
                                    ),

                                    const SizedBox(height: 2),

                                    // Product Title
                                    Text(
                                      product.name,
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textPrimary,
                                        height: 1.2,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),

                                    const SizedBox(height: 4),

                                    // Store Tag
                                    Row(
                                      children: [
                                        const Icon(Icons.storefront_outlined, size: 11, color: AppColors.textMuted),
                                        const SizedBox(width: 3),
                                        Expanded(
                                          child: Text(
                                            product.shopName,
                                            style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.textMuted,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 8),

                                    // Price & Add Button
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '₹${product.sellingPrice.toStringAsFixed(0)}',
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w900,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                            if (product.mrp > product.sellingPrice)
                                              Text(
                                                '₹${product.mrp.toStringAsFixed(0)}',
                                                style: const TextStyle(
                                                  fontSize: 10.5,
                                                  decoration: TextDecoration.lineThrough,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                          ],
                                        ),

                                        // Action Button: Add or Stepper
                                        qty == 0
                                            ? ElevatedButton(
                                                onPressed: () {
                                                  cartProv.addItem(product);
                                                },
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: AppColors.primaryGhost,
                                                  foregroundColor: AppColors.primary,
                                                  elevation: 0,
                                                  side: const BorderSide(color: AppColors.borderOrange),
                                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                                  minimumSize: Size.zero,
                                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                ),
                                                child: const Text(
                                                  'ADD',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w900,
                                                  ),
                                                ),
                                              )
                                            : Container(
                                                decoration: BoxDecoration(
                                                  color: AppColors.primary,
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    GestureDetector(
                                                      onTap: () => cartProv.updateQuantity(product.id, qty - 1),
                                                      child: const Padding(
                                                        padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                                        child: Icon(Icons.remove, color: Colors.white, size: 14),
                                                      ),
                                                    ),
                                                    Text(
                                                      '$qty',
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontWeight: FontWeight.w800,
                                                        fontSize: 11.5,
                                                      ),
                                                    ),
                                                    GestureDetector(
                                                      onTap: () => cartProv.updateQuantity(product.id, qty + 1),
                                                      child: const Padding(
                                                        padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                                        child: Icon(Icons.add, color: Colors.white, size: 14),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                          childCount: displayedProducts.length,
                        ),
                      ),
                    ),
            ],
          ),

          // ── Bottom Floating Cart Bar ────────────────────────────────────────
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: FloatingCartBar(),
          ),
        ],
      ),
    );
  }
}
