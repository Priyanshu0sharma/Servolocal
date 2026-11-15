import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class BenefitsStrip extends StatelessWidget {
  const BenefitsStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: const [
          _BenefitPill(
            icon: Icons.bolt_rounded,
            iconColor: AppColors.primary,
            title: 'In 30 Mins\nDelivery',
          ),
          SizedBox(width: 8),
          _BenefitPill(
            icon: Icons.storefront_rounded,
            iconColor: Color(0xFFD97706),
            title: 'Local\nShops',
          ),
          SizedBox(width: 8),
          _BenefitPill(
            icon: Icons.verified_user_rounded,
            iconColor: AppColors.primary,
            title: 'Fresh &\nGenuine',
          ),
          SizedBox(width: 8),
          _BenefitPill(
            icon: Icons.percent_rounded,
            iconColor: Color(0xFFE55A00),
            title: 'Best\nPrices',
          ),
        ],
      ),
    );
  }
}

class _BenefitPill extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;

  const _BenefitPill({
    required this.icon,
    required this.iconColor,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 16),
          ),
          const SizedBox(width: 7),
          Text(
            title,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}
