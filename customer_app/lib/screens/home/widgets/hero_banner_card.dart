import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class HeroBannerCard extends StatefulWidget {
  final VoidCallback onShopNow;

  const HeroBannerCard({super.key, required this.onShopNow});

  @override
  State<HeroBannerCard> createState() => _HeroBannerCardState();
}

class _HeroBannerCardState extends State<HeroBannerCard> {
  final int _activeDot = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          height: 185,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFFFEDD5), // Soft peach / warm amber
                Color(0xFFFED7AA),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF97316).withValues(alpha: 0.12),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Left Content
              Padding(
                padding: const EdgeInsets.only(left: 20, top: 18, bottom: 18),
                child: SizedBox(
                  width: MediaQuery.of(context).size.width * 0.52,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Your\nNeighbourhood\nStores Online',
                            style: TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF291A10),
                              height: 1.15,
                              letterSpacing: -0.4,
                            ),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Groceries • Daily Needs • More',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF78513D),
                            ),
                          ),
                        ],
                      ),
                      // Shop Now Button
                      GestureDetector(
                        onTap: widget.onShopNow,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF231710),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Text(
                                'Shop Now',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Right Graphic: Grocery Bag with Fresh Produce
              Positioned(
                right: 8,
                bottom: 8,
                top: 8,
                child: Center(
                  child: Container(
                    width: 140,
                    height: 155,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Soft Glow
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.35),
                          ),
                        ),
                        // Grocery Bag Illustration with fresh vegetables emoji cluster
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Text('🥦', style: TextStyle(fontSize: 26)),
                                Text('🍅', style: TextStyle(fontSize: 28)),
                                Text('🥬', style: TextStyle(fontSize: 26)),
                              ],
                            ),
                            const Text('🛍️', style: TextStyle(fontSize: 54)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 10),

        // Carousel Dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(4, (index) {
            final isActive = index == _activeDot;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: isActive ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.border,
                borderRadius: BorderRadius.circular(10),
              ),
            );
          }),
        ),
      ],
    );
  }
}
