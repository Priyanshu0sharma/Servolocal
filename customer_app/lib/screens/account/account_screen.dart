import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/location_provider.dart';
import '../auth/login_sheet.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  void _openLoginSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => const LoginSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProv = context.watch<AuthProvider>();
    final locationProv = context.watch<LocationProvider>();
    final user = authProv.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Account', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Profile Header Card ──────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
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
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primaryLight,
                    child: Text(
                      user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : '👤',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'Guest Customer',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'Sign in to sync your orders & addresses',
                          style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted),
                        ),
                        if (user != null && user.phone.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            '+91 ${user.phone}',
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (!authProv.isAuthenticated)
                    ElevatedButton(
                      onPressed: () => _openLoginSheet(context),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('Sign In', style: TextStyle(fontSize: 11)),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── 18+ Age Restriction & Legal Safety Switch ────────────────────
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Text('🔞', style: TextStyle(fontSize: 20)),
                          SizedBox(width: 8),
                          Text(
                            '18+ Verified (Adult Mode)',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      Switch(
                        value: authProv.is18Plus,
                        activeThumbColor: AppColors.primary,
                        onChanged: (val) {
                          authProv.updateProfile(is18Plus: val);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                val
                                    ? '18+ adult products unlocked for this account.'
                                    : 'Safe mode active: 18+ adult products are strictly hidden.',
                              ),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    authProv.is18Plus
                        ? 'Full store access: You can browse sexual wellness and adult pharmacy items.'
                        : 'Minor safe mode: Adult wellness and age-restricted items are hidden from search and aisles.',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── Saved Addresses Section ──────────────────────────────────────
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
                  const Text('Saved Addresses', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  ...locationProv.savedAddresses.map((addr) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        addr.label == 'Home' ? Icons.home_rounded : Icons.work_rounded,
                        color: AppColors.primary,
                      ),
                      title: Text(addr.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      subtitle: Text(addr.fullAddress, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    );
                  }),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── Legal & Policies ─────────────────────────────────────────────
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
                  const Text('About & Legal Terms', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  _navTile(Icons.shield_outlined, 'Privacy Policy & DPDP Compliance'),
                  _navTile(Icons.description_outlined, 'Customer Terms of Service (18+ Clause)'),
                  _navTile(Icons.help_outline_rounded, 'Help & Customer Dispute Support'),
                  _navTile(Icons.info_outline_rounded, 'ServoLocal App Version 1.0.0 (Production)'),
                ],
              ),
            ),

            if (authProv.isAuthenticated) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => authProv.logout(),
                  icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
                  label: const Text('Sign Out', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.dangerLight),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _navTile(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600))),
          const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textMuted),
        ],
      ),
    );
  }
}
