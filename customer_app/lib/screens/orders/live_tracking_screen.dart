import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../providers/order_provider.dart';

class LiveTrackingScreen extends StatelessWidget {
  final OrderModel order;

  const LiveTrackingScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final orderProv = context.watch<OrderProvider>();
    final currentOrder = orderProv.activeOrder ?? order;
    final currentStep = currentOrder.status.stepIndex;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              currentOrder.orderNumber,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            Text(
              '${currentOrder.items.length} items • ₹${currentOrder.totalAmount.toInt()}',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Delivery PIN Security Box (Crucial for fake delivery prevention!) ─
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFF7ED), Color(0xFFFFEDD5)],
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.borderOrange),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.pin_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Delivery Verification PIN',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF7C2D12),
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Share only when rider arrives at your door',
                          style: TextStyle(fontSize: 10.5, color: Color(0xFF9A3412)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primary),
                    ),
                    child: Text(
                      currentOrder.deliveryPin,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 4,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Live ETA & Status Header ─────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentOrder.status.displayTitle,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            currentOrder.status.description,
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.successLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          currentOrder.status == OrderStatus.delivered ? 'Completed' : '⚡ 10 mins',
                          style: const TextStyle(
                            color: AppColors.success,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 22),

                  // ── 5-Stage Live Stepper ─────────────────────────────────
                  _buildStepper(currentStep),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── Delivery Partner Contact Card ──────────────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.primaryGhost,
                    child: const Text('🚴', style: TextStyle(fontSize: 22)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentOrder.riderName ?? 'ServoFleet Rider',
                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 1),
                        const Text(
                          'Vaccinated • Temperature Checked',
                          style: TextStyle(fontSize: 10.5, color: AppColors.success, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.phone_rounded, color: AppColors.primary),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Calling rider at ${currentOrder.riderPhone}...'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── Destination Address Card ────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Delivering to',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          currentOrder.deliveryAddress,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepper(int activeStep) {
    final stages = [
      'Placed',
      'Accepted',
      'Packed',
      'On Way',
      'Delivered',
    ];

    return Row(
      children: List.generate(stages.length, (index) {
        final isPassed = index <= activeStep;
        final isLast = index == stages.length - 1;

        return Expanded(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: isPassed ? AppColors.success : AppColors.border,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: isPassed
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : Text(
                              '${index + 1}',
                              style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        height: 3,
                        color: index < activeStep ? AppColors.success : AppColors.border,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                stages[index],
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isPassed ? FontWeight.w800 : FontWeight.w500,
                  color: isPassed ? AppColors.textPrimary : AppColors.textMuted,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
