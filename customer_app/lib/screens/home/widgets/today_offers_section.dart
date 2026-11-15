import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class TodayOffersSection extends StatelessWidget {
  final VoidCallback onViewAll;

  const TodayOffersSection({super.key, required this.onViewAll});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: const [
                Text('🔥', style: TextStyle(fontSize: 18)),
                SizedBox(width: 8),
                Text(
                  "Today's Offers",
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

        // Offers Cards Slider
        SizedBox(
          height: 130,
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            children: const [
              _OfferBannerCard(
                badge: 'Up to',
                highlight: '50% OFF',
                title: 'On Daily Groceries',
                emoji: '🥗',
                bgColor: Color(0xFFFFF7ED),
                borderColor: Color(0xFFFFEDD5),
              ),
              SizedBox(width: 10),
              _OfferBannerCard(
                badge: 'Buy 1 Get 1',
                highlight: 'FREE',
                title: 'Snacks & Beverages',
                emoji: '🥤',
                bgColor: Color(0xFFFEF2F2),
                borderColor: Color(0xFFFEE2E2),
              ),
              SizedBox(width: 10),
              _OfferBannerCard(
                badge: 'Flat',
                highlight: '₹100 OFF',
                title: 'On Orders Above ₹499',
                emoji: '🏷️',
                bgColor: Color(0xFFF0FDF4),
                borderColor: Color(0xFFDCFCE7),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OfferBannerCard extends StatelessWidget {
  final String badge;
  final String highlight;
  final String title;
  final String emoji;
  final Color bgColor;
  final Color borderColor;

  const _OfferBannerCard({
    required this.badge,
    required this.highlight,
    required this.title,
    required this.emoji,
    required this.bgColor,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 190,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    badge,
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMuted,
                    ),
                  ),
                  Text(
                    highlight,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFDC2626),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
              // Mini Action Pill
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: Color(0xFF291A10),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
              ),
            ],
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Text(
              emoji,
              style: const TextStyle(fontSize: 42),
            ),
          ),
        ],
      ),
    );
  }
}
