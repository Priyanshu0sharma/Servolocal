import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../providers/order_provider.dart';
import '../../providers/cart_provider.dart';
import 'live_tracking_screen.dart';
import 'review_dialog.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderProv = context.watch<OrderProvider>();
    final cartProv = context.read<CartProvider>();
    final orders = orderProv.orderHistory;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'My Orders',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
        ),
      ),
      body: orders.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text('📦', style: TextStyle(fontSize: 54)),
                  SizedBox(height: 12),
                  Text(
                    'No orders placed yet',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Your order history will appear here.',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final o = orders[index];
                final isDelivered = o.status == OrderStatus.delivered;

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
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
                      // Header: Order ID & Status Badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                o.orderNumber,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
                              ),
                              Text(
                                DateFormat('dd MMM, hh:mm a').format(o.createdAt),
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDelivered ? AppColors.successLight : AppColors.primaryGhost,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              o.status.displayTitle,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: isDelivered ? AppColors.success : AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),
                      const Divider(color: AppColors.border, height: 1),
                      const SizedBox(height: 10),

                      // Store & Total Amount
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.storefront_rounded, size: 16, color: AppColors.textMuted),
                              const SizedBox(width: 6),
                              Text(
                                o.shopName,
                                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          Text(
                            '₹${o.totalAmount.toInt()}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Actions
                      Row(
                        children: [
                          if (!isDelivered)
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => LiveTrackingScreen(order: o)),
                                  );
                                },
                                icon: const Icon(Icons.navigation_rounded, size: 16),
                                label: const Text('Track Live'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                ),
                              ),
                            )
                          else ...[
                            // Reorder Button
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  for (var item in o.items) {
                                    cartProv.addToCart(item.product, qty: item.quantity);
                                  }
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Items added to cart!'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                                style: OutlinedButton.styleFrom(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  side: const BorderSide(color: AppColors.primary),
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                ),
                                child: const Text(
                                  'Reorder',
                                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 12),
                                ),
                              ),
                            ),

                            const SizedBox(width: 8),

                            // Review Button
                            Expanded(
                              child: ElevatedButton(
                                onPressed: o.isReviewed
                                    ? null
                                    : () {
                                        showDialog(
                                          context: context,
                                          builder: (_) => ReviewDialog(
                                            order: o,
                                            onSubmit: (p, s, d, comment) {
                                              orderProv.submitReview(
                                                orderId: o.id,
                                                productRating: p,
                                                shopRating: s,
                                                deliveryRating: d,
                                                comment: comment,
                                              );
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(
                                                  content: Text('Verified review submitted. Thank you!'),
                                                  behavior: SnackBarBehavior.floating,
                                                ),
                                              );
                                            },
                                          ),
                                        );
                                      },
                                child: Text(
                                  o.isReviewed ? 'Reviewed ★' : 'Rate Order',
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
