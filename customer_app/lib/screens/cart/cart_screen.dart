import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/order_provider.dart';
import '../orders/live_tracking_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final TextEditingController _couponCtrl = TextEditingController();
  String _paymentMode = 'COD';

  @override
  void dispose() {
    _couponCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartProv = context.watch<CartProvider>();
    final locationProv = context.watch<LocationProvider>();
    final orderProv = context.watch<OrderProvider>();
    final items = cartProv.itemList;
    final shopsCount = cartProv.itemsByShop.keys.length;

    if (items.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('My Cart', style: TextStyle(fontWeight: FontWeight.w800))),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🛒', style: TextStyle(fontSize: 64)),
              const SizedBox(height: 14),
              const Text(
                'Your cart is empty',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'Add daily essentials from your neighbourhood shops!',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Start Shopping'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Checkout', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
            Text(
              '${cartProv.itemCount} items • Delivery in 10-15 mins',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => cartProv.clearCart(),
            child: const Text('Clear', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Multi-Store Order Notice
            if (shopsCount > 1)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGhost,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderOrange),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.alt_route_rounded, color: AppColors.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Combined multi-vendor cart: Items will be collected from $shopsCount stores and dispatched seamlessly.',
                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF9A3412)),
                      ),
                    ),
                  ],
                ),
              ),

            // Cart Items Grouped by Shop
            ...cartProv.itemsByShop.entries.map((entry) {
              final shopName = entry.value.first.shopName;
              return Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.storefront_rounded, size: 16, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Text(
                          shopName,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Divider(color: AppColors.border, height: 1),
                    const SizedBox(height: 10),

                    ...entry.value.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceMuted,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  item.product.imageUrl,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const Text('📦'),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    item.unit,
                                    style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                                  ),
                                  Text(
                                    '₹${item.totalPrice.toInt()}',
                                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  GestureDetector(
                                    onTap: () => cartProv.updateQuantity(item.inventoryId, item.quantity - 1),
                                    child: const Icon(Icons.remove, size: 16, color: Colors.white),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    child: Text(
                                      '${item.quantity}',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => cartProv.updateQuantity(item.inventoryId, item.quantity + 1),
                                    child: const Icon(Icons.add, size: 16, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              );
            }),

            // Coupon Box
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.discount_outlined, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: cartProv.appliedCoupon != null
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Coupon ${cartProv.appliedCoupon} Applied',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.success),
                              ),
                              Text(
                                'Saved ₹${cartProv.couponDiscount.toInt()}',
                                style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                              ),
                            ],
                          )
                        : TextField(
                            controller: _couponCtrl,
                            textCapitalization: TextCapitalization.characters,
                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                            decoration: const InputDecoration(
                              hintText: 'Enter coupon (SERVO50 / WELCOME)',
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                  ),
                  if (cartProv.appliedCoupon != null)
                    TextButton(
                      onPressed: () => cartProv.removeCoupon(),
                      child: const Text('Remove', style: TextStyle(color: AppColors.danger, fontSize: 11)),
                    )
                  else
                    ElevatedButton(
                      onPressed: () {
                        final ok = cartProv.applyCoupon(_couponCtrl.text);
                        if (!ok) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Invalid coupon code or minimum order condition not met.'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('Apply', style: TextStyle(fontSize: 11)),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Delivery Address Confirmation
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.home_work_rounded, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Delivering to Address',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        Text(
                          locationProv.currentLocality,
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Bill Breakdown
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bill Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  _billRow('Items Subtotal', '₹${cartProv.subtotal.toInt()}'),
                  if (cartProv.totalSavings > 0)
                    _billRow('Discounts & Savings', '-₹${cartProv.totalSavings.toInt()}', isHighlight: true),
                  _billRow(
                    'Delivery Partner Fee',
                    cartProv.deliveryFee == 0 ? 'FREE' : '₹${cartProv.deliveryFee.toInt()}',
                    isHighlight: cartProv.deliveryFee == 0,
                  ),
                  _billRow('Platform Safety Fee', '₹${cartProv.platformFee.toInt()}'),
                  const SizedBox(height: 8),
                  const Divider(color: AppColors.border, height: 1),
                  const SizedBox(height: 8),
                  _billRow(
                    'To Pay',
                    '₹${cartProv.finalTotal.toInt()}',
                    isBold: true,
                    fontSize: 15,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Payment Mode Selector
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Payment Mode', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  RadioListTile<String>(
                    value: 'COD',
                    groupValue: _paymentMode,
                    activeColor: AppColors.primary,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Cash on Delivery (Pay at Doorstep)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Pay via cash or UPI to rider', style: TextStyle(fontSize: 10.5)),
                    onChanged: (val) => setState(() => _paymentMode = val!),
                  ),
                  RadioListTile<String>(
                    value: 'ONLINE',
                    groupValue: _paymentMode,
                    activeColor: AppColors.primary,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('UPI / Credit & Debit Cards (Razorpay)', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Instant contactless payment', style: TextStyle(fontSize: 10.5)),
                    onChanged: (val) => setState(() => _paymentMode = val!),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
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
                Text(
                  '₹${cartProv.finalTotal.toInt()}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                ),
                Text(
                  'Total Amount ($_paymentMode)',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
            ElevatedButton(
              onPressed: orderProv.isLoading
                  ? null
                  : () async {
                      final success = await orderProv.placeOrder(
                        items: cartProv.itemList,
                        totalAmount: cartProv.finalTotal,
                        deliveryAddress: locationProv.currentLocality,
                        paymentMode: _paymentMode,
                      );
                      if (success && mounted) {
                        cartProv.clearCart();
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LiveTrackingScreen(order: orderProv.activeOrder!),
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              ),
              child: orderProv.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Place Order →', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _billRow(String title, String val, {bool isHighlight = false, bool isBold = false, double fontSize = 12}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              color: isHighlight ? AppColors.success : (isBold ? AppColors.textPrimary : AppColors.textMuted),
            ),
          ),
          Text(
            val,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
              color: isHighlight ? AppColors.success : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
