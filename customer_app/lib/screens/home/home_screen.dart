import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/feed_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/location_provider.dart';
import 'widgets/location_header.dart';
import 'widgets/search_bar_widget.dart';
import 'widgets/benefits_strip.dart';
import 'widgets/hero_banner_card.dart';
import 'widgets/categories_grid.dart';
import 'widgets/nearby_shops_section.dart';
import 'widgets/today_offers_section.dart';
import '../product/product_detail_screen.dart';
import '../cart/cart_screen.dart';
import '../shop/shop_detail_screen.dart';
import '../categories/category_products_screen.dart';
import '../../widgets/floating_cart_bar.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onOpenCategories;
  final VoidCallback onOpenOrders;
  final VoidCallback onOpenAccount;

  const HomeScreen({
    super.key,
    required this.onOpenCategories,
    required this.onOpenOrders,
    required this.onOpenAccount,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showLocationSheet(BuildContext context) {
    final locationProv = context.read<LocationProvider>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Select Delivery Location',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Choose a saved address or use current GPS location for ultra-fast 10-15 minute delivery.',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 18),

              // GPS Detect Button
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AppColors.borderOrange),
                ),
                tileColor: AppColors.primaryGhost,
                leading: const Icon(Icons.my_location_rounded, color: AppColors.primary),
                title: const Text(
                  'Use Current GPS Location',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.primary),
                ),
                subtitle: const Text('Detects current area automatically', style: TextStyle(fontSize: 11)),
                onTap: () {
                  locationProv.setLocation(
                    locality: 'Kanti Nagar, Sindhi Camp, Jaipur',
                    lat: 27.0544,
                    lng: 75.8942,
                  );
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 14),

              // Saved Addresses
              ...locationProv.savedAddresses.map((addr) {
                final isSelected = locationProv.currentLocality.contains(addr.locality);
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primaryGhost : AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: ListTile(
                    leading: Icon(
                      addr.label == 'Home' ? Icons.home_rounded : Icons.work_rounded,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                    title: Text(
                      addr.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: isSelected ? AppColors.primary : AppColors.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      addr.fullAddress,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      maxLines: 2,
                    ),
                    onTap: () {
                      locationProv.setLocation(
                        locality: '${addr.locality}, ${addr.city}',
                        lat: addr.lat,
                        lng: addr.lng,
                      );
                      Navigator.pop(ctx);
                    },
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final authProv = context.watch<AuthProvider>();
    final cartProv = context.watch<CartProvider>();
    final products = feedProv.getFilteredProducts(isUser18Plus: authProv.is18Plus);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () => feedProv.fetchDiscoveryFeed(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header with Brand, Bell & Deliver To Bar
                LocationHeader(
                  onOpenDrawer: () => Scaffold.of(context).openDrawer(),
                  onOpenNotifications: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('⚡ 10-15 Min Express Delivery active in Sindhi Camp, Jaipur!'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  onOpenCart: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CartScreen()),
                    );
                  },
                  onSelectLocation: () => _showLocationSheet(context),
                ),

                const SizedBox(height: 14),

                // 2. Search Bar
                SearchBarWidget(
                  controller: _searchCtrl,
                  onChanged: (q) => feedProv.setSearchQuery(q),
                ),

                const SizedBox(height: 14),

                // 3. Delivery Benefits Strip
                const BenefitsStrip(),

                const SizedBox(height: 16),

                // 4. Hero Banner
                HeroBannerCard(
                  onShopNow: widget.onOpenCategories,
                ),

                const SizedBox(height: 20),

                // 5. 10 Product Categories Grid (2 Rows of 5)
                CategoriesGrid(
                  onSelectCategory: (cat) {
                    if (cat.id == 'all') {
                      widget.onOpenCategories();
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CategoryProductsScreen(category: cat),
                        ),
                      );
                    }
                  },
                ),

                const SizedBox(height: 22),

                // 6. Shop from Nearby Stores Section
                NearbyShopsSection(
                  onSelectShop: (shop) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ShopDetailScreen(shop: shop),
                      ),
                    );
                  },
                  onViewAll: widget.onOpenCategories,
                ),

                const SizedBox(height: 22),

                // 7. Today's Offers Section
                TodayOffersSection(
                  onViewAll: widget.onOpenCategories,
                ),

                const SizedBox(height: 24),

                // 8. Trending Essentials Shelf
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Text('⚡', style: TextStyle(fontSize: 18)),
                        SizedBox(width: 8),
                        Text(
                          'Trending Essentials',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '${products.length} Items',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Product Cards Grid
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: products.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.68,
                  ),
                  itemBuilder: (context, index) {
                    final p = products[index];
                    final qtyInCart = cartProv.getQuantity(p.id);

                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(product: p),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.border),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Product Image & Badges
                            Expanded(
                              child: Stack(
                                children: [
                                  Center(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: Image.network(
                                        p.imageUrl,
                                        fit: BoxFit.contain,
                                        errorBuilder: (_, __, ___) => const Center(
                                          child: Text('📦', style: TextStyle(fontSize: 38)),
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (p.discountPct > 0)
                                    Positioned(
                                      top: 4,
                                      left: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.success,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '${p.discountPct}% OFF',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                  if (p.is18Plus)
                                    Positioned(
                                      top: 4,
                                      right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.badgeYellow,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: AppColors.warning),
                                        ),
                                        child: const Text(
                                          '🔞 18+',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.badgeText,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 8),

                            // ETA & Store Tag
                            Text(
                              '⚡ 10 mins • ${p.shopName}',
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),

                            const SizedBox(height: 2),

                            // Product Name
                            Text(
                              p.name,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),

                            const SizedBox(height: 4),

                            // Unit
                            Text(
                              p.unit,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textMuted,
                              ),
                            ),

                            const SizedBox(height: 8),

                            // Price and Add to Cart Action Button
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '₹${p.sellingPrice.toInt()}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    if (p.mrp > p.sellingPrice)
                                      Text(
                                        '₹${p.mrp.toInt()}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          decoration: TextDecoration.lineThrough,
                                          color: AppColors.textMuted,
                                        ),
                                      ),
                                  ],
                                ),

                                // Add to Cart Pill Controller
                                qtyInCart > 0
                                    ? Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.primary,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                        child: Row(
                                          children: [
                                            GestureDetector(
                                              onTap: () => cartProv.updateQuantity(p.id, qtyInCart - 1),
                                              child: const Icon(Icons.remove, size: 14, color: Colors.white),
                                            ),
                                            Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 6),
                                              child: Text(
                                                '$qtyInCart',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ),
                                            GestureDetector(
                                              onTap: () => cartProv.updateQuantity(p.id, qtyInCart + 1),
                                              child: const Icon(Icons.add, size: 14, color: Colors.white),
                                            ),
                                          ],
                                        ),
                                      )
                                    : GestureDetector(
                                        onTap: () => cartProv.addToCart(p),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: AppColors.primaryGhost,
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: AppColors.borderOrange),
                                          ),
                                          child: const Text(
                                            'ADD',
                                            style: TextStyle(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 11.5,
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
              ],
            ),
          ),
        ),
        const Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: FloatingCartBar(),
        ),
      ],
    ),
  ),
);
  }
}
