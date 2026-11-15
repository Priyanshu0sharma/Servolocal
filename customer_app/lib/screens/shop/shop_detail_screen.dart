import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/shop_model.dart';
import '../../providers/feed_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/floating_cart_bar.dart';
import '../product/product_detail_screen.dart';

class ShopDetailScreen extends StatefulWidget {
  final ShopModel shop;

  const ShopDetailScreen({super.key, required this.shop});

  @override
  State<ShopDetailScreen> createState() => _ShopDetailScreenState();
}

class _ShopDetailScreenState extends State<ShopDetailScreen> {
  String _selectedSubcategory = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final cartProv = context.watch<CartProvider>();
    final authProv = context.watch<AuthProvider>();

    // Get all products of this shop
    final shopProducts = feedProv
        .getFilteredProducts(isUser18Plus: authProv.is18Plus)
        .where((p) => p.shopId == widget.shop.id || p.shopName.toLowerCase() == widget.shop.name.toLowerCase())
        .toList();

    // Extract subcategories
    final Set<String> subcats = {'All'};
    for (var p in shopProducts) {
      if (p.subCategory.isNotEmpty) {
        subcats.add(p.subCategory);
      } else if (p.category.isNotEmpty) {
        subcats.add(p.category);
      }
    }

    // Filter by subcategory and search
    final displayedProducts = shopProducts.where((p) {
      if (_selectedSubcategory != 'All') {
        if (p.subCategory != _selectedSubcategory && p.category != _selectedSubcategory) {
          return false;
        }
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
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── Slivers App Bar with Store Graphic ──────────────────────────
              SliverAppBar(
                expandedHeight: 180,
                pinned: true,
                backgroundColor: AppColors.surface,
                elevation: 0,
                leading: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      widget.shop.imageUrl != null && widget.shop.imageUrl!.isNotEmpty
                          ? Image.network(
                              widget.shop.imageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: AppColors.primaryLight,
                                child: const Center(
                                  child: Icon(Icons.storefront_rounded, size: 64, color: AppColors.primary),
                                ),
                              ),
                            )
                          : Container(
                              color: AppColors.primaryLight,
                              child: const Center(
                                child: Icon(Icons.storefront_rounded, size: 64, color: AppColors.primary),
                              ),
                            ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.3),
                              Colors.black.withValues(alpha: 0.7),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        bottom: 16,
                        right: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: widget.shop.isOpen ? AppColors.success : Colors.grey,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    widget.shop.isOpen ? 'OPEN NOW' : 'CLOSED',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    widget.shop.etaMins,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.shop.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              '${widget.shop.localityName} • ${widget.shop.distanceKm} km away',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Store Rating & Guarantee Banner ────────────────────────────
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, color: AppColors.starGold, size: 20),
                          const SizedBox(width: 4),
                          Text(
                            '${widget.shop.rating} (${widget.shop.ratingCount})',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                        ],
                      ),
                      Container(width: 1, height: 24, color: AppColors.border),
                      Row(
                        children: const [
                          Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                          SizedBox(width: 4),
                          Text(
                            'Verified Partner',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                          ),
                        ],
                      ),
                      Container(width: 1, height: 24, color: AppColors.border),
                      Row(
                        children: const [
                          Icon(Icons.electric_bolt_rounded, color: AppColors.warning, size: 18),
                          SizedBox(width: 4),
                          Text(
                            '10-15 Min Delivery',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ── Search In This Store ──────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
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
                              hintText: 'Search items in ${widget.shop.name}...',
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

              // ── Category Pills Filter ──────────────────────────────────────
              SliverToBoxAdapter(
                child: Container(
                  height: 44,
                  margin: const EdgeInsets.only(top: 14, bottom: 8),
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

              // ── Product Count Title ────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Text(
                    '${displayedProducts.length} Items Available',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ),

              // ── Store Products Grid ────────────────────────────────────────
              displayedProducts.isEmpty
                  ? SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: const [
                            Icon(Icons.inventory_2_outlined, size: 48, color: AppColors.textMuted),
                            SizedBox(height: 12),
                            Text(
                              'No products found in this category',
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

                                    const SizedBox(height: 8),

                                    // Price & Add to Cart Stepper
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
