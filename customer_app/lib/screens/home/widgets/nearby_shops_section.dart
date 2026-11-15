import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/feed_provider.dart';
import '../../../models/shop_model.dart';

class NearbyShopsSection extends StatelessWidget {
  final ValueChanged<ShopModel> onSelectShop;
  final VoidCallback onViewAll;

  const NearbyShopsSection({
    super.key,
    required this.onSelectShop,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final shops = feedProv.shops;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: const [
                Text('🏪', style: TextStyle(fontSize: 18)),
                SizedBox(width: 8),
                Text(
                  'Shop from Nearby Stores',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
            GestureDetector(
              onTap: onViewAll,
              child: Row(
                children: const [
                  Text(
                    'View All',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.textSecondary),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Horizontal Shop Cards List
        SizedBox(
          height: 94,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: shops.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final shop = shops[index];
              return _NearbyShopCard(
                shop: shop,
                onTap: () => onSelectShop(shop),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _NearbyShopCard extends StatefulWidget {
  final ShopModel shop;
  final VoidCallback onTap;

  const _NearbyShopCard({required this.shop, required this.onTap});

  @override
  State<_NearbyShopCard> createState() => _NearbyShopCardState();
}

class _NearbyShopCardState extends State<_NearbyShopCard> {
  bool _isFavorite = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        width: 265,
        padding: const EdgeInsets.all(9),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Shop Front Image / Icon
            Container(
              width: 74,
              height: 74,
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: widget.shop.imageUrl != null && widget.shop.imageUrl!.isNotEmpty
                    ? Image.network(
                        widget.shop.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultShopGraphic(),
                      )
                    : _defaultShopGraphic(),
              ),
            ),

            const SizedBox(width: 10),

            // Shop Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.shop.name,
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() => _isFavorite = !_isFavorite);
                        },
                        child: Icon(
                          _isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          size: 16,
                          color: _isFavorite ? Colors.red : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  // Open & Distance Tag
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: widget.shop.isOpen ? AppColors.success : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        widget.shop.isOpen ? 'Open' : 'Closed',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: widget.shop.isOpen ? AppColors.success : Colors.grey,
                        ),
                      ),
                      const Text(' • ', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      Flexible(
                        child: Text(
                          '${widget.shop.distanceKm} km',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Rating / ETA
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 14, color: AppColors.starGold),
                      const SizedBox(width: 2),
                      Flexible(
                        child: Text(
                          '${widget.shop.rating} (${widget.shop.ratingCount})',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultShopGraphic() {
    return Container(
      color: AppColors.primaryLight,
      child: const Center(
        child: Text('🏪', style: TextStyle(fontSize: 32)),
      ),
    );
  }
}
