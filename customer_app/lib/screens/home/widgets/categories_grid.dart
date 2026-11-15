import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/feed_provider.dart';

class CategoriesGrid extends StatelessWidget {
  final ValueChanged<CategoryItem> onSelectCategory;

  const CategoriesGrid({super.key, required this.onSelectCategory});

  @override
  Widget build(BuildContext context) {
    final feedProv = context.watch<FeedProvider>();
    final items = feedProv.categories;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        mainAxisSpacing: 12,
        crossAxisSpacing: 8,
        childAspectRatio: 0.72,
      ),
      itemBuilder: (context, index) {
        final cat = items[index];
        final isSelected = feedProv.selectedCategory == cat.id;

        return GestureDetector(
          onTap: () => onSelectCategory(cat),
          child: Column(
            children: [
              // Icon Box with pastel bg & rounded corners
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primaryLight : cat.bgColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.border,
                    width: isSelected ? 1.5 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    cat.emoji,
                    style: const TextStyle(fontSize: 26),
                  ),
                ),
              ),
              const SizedBox(height: 5),
              // Category Name (2 lines, centered)
              Text(
                cat.name,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                  height: 1.15,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }
}
