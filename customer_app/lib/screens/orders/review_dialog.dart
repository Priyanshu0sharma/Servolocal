import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/order_model.dart';

class ReviewDialog extends StatefulWidget {
  final OrderModel order;
  final Function(double productRating, double shopRating, double deliveryRating, String comment) onSubmit;

  const ReviewDialog({super.key, required this.order, required this.onSubmit});

  @override
  State<ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<ReviewDialog> {
  double _productRating = 5;
  double _shopRating = 5;
  double _deliveryRating = 5;
  final TextEditingController _commentCtrl = TextEditingController();

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Rate Your Order',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Text(
                'Order ${widget.order.orderNumber} • ${widget.order.shopName}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),

              // 1. Product Quality Rating
              _ratingSection('1. Product Quality & Freshness', _productRating, (val) {
                setState(() => _productRating = val);
              }),

              const SizedBox(height: 12),

              // 2. Shopkeeper Service Rating
              _ratingSection('2. Shopkeeper Packaging & Service', _shopRating, (val) {
                setState(() => _shopRating = val);
              }),

              const SizedBox(height: 12),

              // 3. Delivery Fleet Experience Rating
              _ratingSection('3. Delivery Speed & Rider Conduct', _deliveryRating, (val) {
                setState(() => _deliveryRating = val);
              }),

              const SizedBox(height: 16),

              // Written Feedback
              TextField(
                controller: _commentCtrl,
                maxLines: 3,
                style: const TextStyle(fontSize: 13),
                decoration: const InputDecoration(
                  hintText: 'Share details of your experience (optional)...',
                ),
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    widget.onSubmit(
                      _productRating,
                      _shopRating,
                      _deliveryRating,
                      _commentCtrl.text,
                    );
                    Navigator.pop(context);
                  },
                  child: const Text('Submit Verified Review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _ratingSection(String title, double current, ValueChanged<double> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Row(
          children: List.generate(5, (index) {
            final starIndex = index + 1;
            final isFilled = starIndex <= current;
            return GestureDetector(
              onTap: () => onChanged(starIndex.toDouble()),
              child: Icon(
                isFilled ? Icons.star_rounded : Icons.star_outline_rounded,
                color: isFilled ? AppColors.starGold : AppColors.border,
                size: 28,
              ),
            );
          }),
        ),
      ],
    );
  }
}
