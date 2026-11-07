import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'config.dart';

/// Background message handler for FCM
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print("[FCM BACKGROUND MESSAGE] ${message.messageId} - ${message.notification?.title}");
  }
}

class ServoNativeBridge {
  final WebViewController webViewController;
  Timer? _riderGpsTimer;
  String? _fcmToken;

  ServoNativeBridge({required this.webViewController});

  /// Initialize native sensors, FCM, and background loops
  Future<void> initialize() async {
    await _initFirebaseAndFCM();
    if (AppConfig.isPartner) {
      _startRiderTelemetryLoop();
    }
  }

  /// ── 1. Firebase Cloud Messaging Setup ──────────────────────────────────
  Future<void> _initFirebaseAndFCM() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        _fcmToken = await messaging.getToken();
        if (_fcmToken != null) {
          sendFcmTokenToWebView(_fcmToken!);
        }

        // Listen for token refreshes
        messaging.onTokenRefresh.listen((newToken) {
          _fcmToken = newToken;
          sendFcmTokenToWebView(newToken);
        });

        // Foreground messages: trigger loud notification / vibration
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          _handleForegroundNotification(message);
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print("[FCM INIT WARNING] (Dev/Demo Mode without google-services.json): $e");
      }
      // Inject fallback token in dev/demo so the webapp functions smoothly
      sendFcmTokenToWebView("fcm_native_${AppConfig.flavor}_mock_token");
    }
  }

  void _handleForegroundNotification(RemoteMessage message) {
    HapticFeedback.heavyImpact();
    final title = message.notification?.title ?? "ServoLocal Update";
    final body = message.notification?.body ?? "";

    webViewController.runJavaScript('''
      if (window.onNativePushNotification) {
        window.onNativePushNotification(${jsonEncode({
          'title': title,
          'body': body,
          'data': message.data,
        })});
      }
    ''');
  }

  /// Sends FCM token to webapp for database syncing
  void sendFcmTokenToWebView(String token) {
    webViewController.runJavaScript('''
      if (window.onNativeFcmTokenReceived) {
        window.onNativeFcmTokenReceived("$token");
      }
      localStorage.setItem("servo_fcm_token", "$token");
    ''');
  }

  /// ── 2. Native GPS Streaming ──────────────────────────────────────────
  Future<Position?> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        await Geolocator.openLocationSettings();
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return null;
      }

      if (permission == LocationPermission.deniedForever) return null;

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      if (kDebugMode) print("[GPS ERROR] $e");
      return null;
    }
  }

  /// Streams single GPS coordinate directly into WebView
  Future<void> injectCurrentGps() async {
    final pos = await getCurrentLocation();
    if (pos != null) {
      webViewController.runJavaScript('''
        if (window.onNativeGpsUpdate) {
          window.onNativeGpsUpdate(${pos.latitude}, ${pos.longitude}, ${pos.heading}, ${pos.accuracy});
        }
      ''');
    }
  }

  /// Background Rider GPS Telemetry loop (runs every 10 seconds for on-duty riders)
  void _startRiderTelemetryLoop() {
    _riderGpsTimer?.cancel();
    _riderGpsTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      final pos = await getCurrentLocation();
      if (pos != null) {
        // Inject into WebView
        webViewController.runJavaScript('''
          if (window.onNativeGpsUpdate) {
            window.onNativeGpsUpdate(${pos.latitude}, ${pos.longitude}, ${pos.heading}, ${pos.accuracy});
          }
        ''');

        // Post to backend partner duty GPS if user has partner token stored
        try {
          final uri = Uri.parse("${AppConfig.apiBaseUrl}/api/partner/duty-gps");
          await http.post(
            uri,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({"lat": pos.latitude, "lng": pos.longitude}),
          );
        } catch (_) {}
      }
    });
  }

  /// ── 3. Native UPI Intent Launcher ────────────────────────────────────
  Future<bool> handleUpiNavigation(String url) async {
    if (url.startsWith('upi://') ||
        url.startsWith('gpay://') ||
        url.startsWith('phonepe://') ||
        url.startsWith('paytmmp://') ||
        url.startsWith('bhim://')) {
      final uri = Uri.parse(url);
      try {
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          return true;
        } else {
          // Fallback: try launching with external non-browser mode
          await launchUrl(uri, mode: LaunchMode.externalNonBrowserApplication);
          return true;
        }
      } catch (e) {
        if (kDebugMode) print("[UPI LAUNCH ERROR] $e");
        return false;
      }
    }
    return false;
  }

  /// ── 4. JavaScript Channel Handler (`ServoNativeBridge`) ─────────────
  void handleJavaScriptMessage(JavaScriptMessage message) async {
    try {
      final data = jsonDecode(message.message);
      final action = data['action'] as String?;

      switch (action) {
        case 'getLocation':
          await injectCurrentGps();
          break;

        case 'openUPI':
          final upiUrl = data['url'] as String?;
          if (upiUrl != null) {
            await handleUpiNavigation(upiUrl);
          }
          break;

        case 'vibrateBuzzer':
          HapticFeedback.heavyImpact();
          Future.delayed(const Duration(milliseconds: 300), () {
            HapticFeedback.heavyImpact();
          });
          break;

        case 'getAppInfo':
          webViewController.runJavaScript('''
            if (window.onNativeAppInfo) {
              window.onNativeAppInfo(${jsonEncode({
                'appName': AppConfig.appName,
                'flavor': AppConfig.flavor,
                'version': '1.0.0',
                'platform': 'android',
              })});
            }
          ''');
          break;

        default:
          if (kDebugMode) print("[UNKNOWN JS ACTION] $action");
      }
    } catch (e) {
      if (kDebugMode) print("[JS CHANNEL PARSE ERROR] $e");
    }
  }

  /// Injects native bridge hooks into window object
  void injectWindowBridges() {
    webViewController.runJavaScript('''
      window.isServoNativeApp = true;
      window.servoAppFlavor = "${AppConfig.flavor}";
      window.servoAppVersion = "1.0.0";

      // Bridge for requesting location from webapp
      window.requestNativeLocation = function() {
        if (window.ServoNativeBridge) {
          window.ServoNativeBridge.postMessage(JSON.stringify({ action: "getLocation" }));
        }
      };

      // Bridge for native UPI intent invocation
      window.launchNativeUpi = function(upiUrl) {
        if (window.ServoNativeBridge) {
          window.ServoNativeBridge.postMessage(JSON.stringify({ action: "openUPI", url: upiUrl }));
        }
      };

      // Bridge for loud vibration
      window.triggerNativeBuzzer = function() {
        if (window.ServoNativeBridge) {
          window.ServoNativeBridge.postMessage(JSON.stringify({ action: "vibrateBuzzer" }));
        }
      };
    ''');

    // Provide initial token & GPS
    if (_fcmToken != null) {
      sendFcmTokenToWebView(_fcmToken!);
    }
    injectCurrentGps();
  }

  void dispose() {
    _riderGpsTimer?.cancel();
  }
}
