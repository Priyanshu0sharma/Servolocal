import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../cart/cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedUnitIdx = 0;

  @override
  Widget build(BuildContext context) {
    final cartProv = context.watch<CartProvider>();
    final authProv = context.watch<AuthProvider>();
    final p = widget.product;
    final qty = cartProv.getQuantity(p.id);
    final isRestricted = p.is18Plus && !authProv.is18Plus;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          p.brand,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Product link copied to clipboard!'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.shopping_cart_outlined),
                if (cartProv.itemCount > 0)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${cartProv.itemCount}',
                        style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── HD Product Packshot ──────────────────────────────────────────
            Container(
              width: double.infinity,
              height: 280,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Image.network(
                        p.imageUrl,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Text('📦', style: TextStyle(fontSize: 64)),
                      ),
                    ),
                  ),
                  if (p.discountPct > 0)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${p.discountPct}% OFF',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── 18+ Age Restriction Warning Banner ──────────────────────────
            if (p.is18Plus) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: const [
                    Text('🔞', style: TextStyle(fontSize: 22)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '18+ Restricted Product: This item contains wellness or medical supplies restricted to adult customers (18+) under statutory compliance.',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // ── Product Title & Meta ────────────────────────────────────────
            Text(
              p.name,
              style: const TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.badgeYellow,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 14, color: AppColors.starGold),
                      const SizedBox(width: 2),
                      Text(
                        '${p.rating}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Text('•', style: TextStyle(color: AppColors.textMuted)),
                const SizedBox(width: 8),
                Text(
                  '⚡ 10 mins • ${p.shopName}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.success),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ── Select Unit / Pack Size ─────────────────────────────────────
            const Text(
              'Select Pack Size',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textMuted),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _UnitOption(
                  label: p.unit,
                  price: '₹${p.sellingPrice.toInt()}',
                  isSelected: _selectedUnitIdx == 0,
                  onTap: () => setState(() => _selectedUnitIdx = 0),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ── Key Product Details Specs ───────────────────────────────────
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Product Highlights', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  _specRow('Brand', p.brand),
                  _specRow('Department', p.category),
                  _specRow('Seller', p.shopName),
                  _specRow('Fulfillment', '⚡ 10-15 Min Instant Delivery'),
                  _specRow('Return Policy', 'Instant 100% replacement upon delivery'),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '₹${p.sellingPrice.toInt()}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                    ),
                    if (p.mrp > p.sellingPrice) ...[
                      const SizedBox(width: 6),
                      Text(
                        '₹${p.mrp.toInt()}',
                        style: const TextStyle(
                          fontSize: 13,
                          decoration: TextDecoration.lineThrough,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
                const Text(
                  'Inclusive of all taxes',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ],
            ),

            // Age restricted lock or Add to cart button
            if (isRestricted)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.dangerLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.danger),
                ),
                child: const Text(
                  '🔞 Restricted for Under 18',
                  style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              )
            else if (qty > 0)
              Container(
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => cartProv.updateQuantity(p.id, qty - 1),
                      child: const Icon(Icons.remove, size: 20, color: Colors.white),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        '$qty',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => cartProv.updateQuantity(p.id, qty + 1),
                      child: const Icon(Icons.add, size: 20, color: Colors.white),
                    ),
                  ],
                ),
              )
            else
              ElevatedButton.icon(
                onPressed: () => cartProv.addToCart(p),
                icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                label: const Text('Add to Cart'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _specRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          Text(value, style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _UnitOption extends StatelessWidget {
  final String label;
  final String price;
  final bool isSelected;
  final VoidCallback onTap;

  const _UnitOption({
    required this.label,
    required this.price,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGhost : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              price,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
