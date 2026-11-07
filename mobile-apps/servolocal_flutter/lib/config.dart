import 'package:flutter/material.dart';

/// Central Compile-Time Flavor & URL Configuration
/// Supports:
///   --dart-define=APP_FLAVOR=customer (default)
///   --dart-define=APP_FLAVOR=partner
///   --dart-define=WEB_URL=https://...
///   --dart-define=API_URL=https://...
class AppConfig {
  // Read flavor at compile time
  static const String flavor = String.fromEnvironment(
    'APP_FLAVOR',
    defaultValue: 'customer',
  );

  static bool get isPartner => flavor.toLowerCase() == 'partner';
  static bool get isCustomer => !isPartner;

  // App Identity
  static String get appName => isPartner ? 'ServoPartner' : 'ServoLocal';
  static String get appTagline => isPartner
      ? 'Shopkeeper • Rider • Field Fleet'
      : '15-Min Instant Delivery & Pan-India';

  // Production and Local URLs (configurable via --dart-define)
  static const String defaultApiUrl = 'https://servolocal-api.onrender.com';
  static const String defaultCustomerUrl = 'https://servolocal.in';
  static const String defaultPartnerUrl = 'https://partner.servolocal.in';

  static String get apiBaseUrl => const String.fromEnvironment(
        'API_URL',
        defaultValue: defaultApiUrl,
      );

  static String get targetWebUrl {
    const customUrl = String.fromEnvironment('WEB_URL');
    if (customUrl.isNotEmpty) return customUrl;
    return isPartner ? defaultPartnerUrl : defaultCustomerUrl;
  }

  // Theme & Styling per flavor
  static Color get primaryColor =>
      isPartner ? const Color(0xFF6366F1) : const Color(0xFF10B981);

  static Color get accentColor =>
      isPartner ? const Color(0xFF10B981) : const Color(0xFFF59E0B);

  static Color get splashBackgroundColor =>
      isPartner ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF);

  static Color get splashTextColor =>
      isPartner ? Colors.white : const Color(0xFF0F172A);

  static Brightness get statusBarBrightness =>
      isPartner ? Brightness.light : Brightness.dark;

  // Asset Logos
  static String get logoAsset => isPartner
      ? 'assets/partner_logo.jpeg'
      : 'assets/customer_logo.jpeg';
}
