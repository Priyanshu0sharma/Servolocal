import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'config.dart';
import 'native_bridge.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set immersive status bar matching flavor theme
  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: AppConfig.statusBarBrightness,
      systemNavigationBarColor: AppConfig.splashBackgroundColor,
      systemNavigationBarIconBrightness: AppConfig.statusBarBrightness,
    ),
  );

  runApp(const ServoAppRoot());
}

class ServoAppRoot extends StatelessWidget {
  const ServoAppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppConfig.splashBackgroundColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConfig.primaryColor,
          brightness: AppConfig.isPartner ? Brightness.dark : Brightness.light,
        ),
      ),
      home: const MainWebViewWrapper(),
    );
  }
}

class MainWebViewWrapper extends StatefulWidget {
  const MainWebViewWrapper({super.key});

  @override
  State<MainWebViewWrapper> createState() => _MainWebViewWrapperState();
}

class _MainWebViewWrapperState extends State<MainWebViewWrapper>
    with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  late final ServoNativeBridge _nativeBridge;

  bool _isPageLoading = true;
  bool _showSplashScreen = true;
  bool _hasConnectionError = false;
  late final AnimationController _splashAnimController;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // ── Setup Splash Animations ─────────────────────────────────────
    _splashAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _splashAnimController,
        curve: Curves.easeOutBack,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _splashAnimController,
        curve: Curves.easeIn,
      ),
    );

    _splashAnimController.forward();

    // ── Setup WebView & Native Bridge ──────────────────────────────
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppConfig.splashBackgroundColor)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isPageLoading = true;
              _hasConnectionError = false;
            });
          },
          onPageFinished: (String url) {
            setState(() => _isPageLoading = false);
            _nativeBridge.injectWindowBridges();

            // Dismiss splash screen after brief branding pause
            Future.delayed(const Duration(milliseconds: 1400), () {
              if (mounted) {
                setState(() => _showSplashScreen = false);
              }
            });
          },
          onWebResourceError: (WebResourceError error) {
            if (error.isForMainFrame ?? true) {
              setState(() {
                _hasConnectionError = true;
                _isPageLoading = false;
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) async {
            // Native UPI Intent Interception
            final handled = await _nativeBridge.handleUpiNavigation(request.url);
            if (handled) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      );

    _nativeBridge = ServoNativeBridge(webViewController: _controller);

    // Add JavaScript Channel for bidirectional native bridge
    _controller.addJavaScriptChannel(
      'ServoNativeBridge',
      onMessageReceived: _nativeBridge.handleJavaScriptMessage,
    );

    _loadTargetApp();
    _nativeBridge.initialize();
  }

  void _loadTargetApp() {
    _controller.loadRequest(Uri.parse(AppConfig.targetWebUrl));
  }

  @override
  void dispose() {
    _splashAnimController.dispose();
    _nativeBridge.dispose();
    super.dispose();
  }

  // Handle hardware Android back-button
  Future<bool> _handleBackPress() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // Don't exit app
    }
    return true; // Exit app
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _handleBackPress();
        if (shouldPop && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: AppConfig.splashBackgroundColor,
        body: SafeArea(
          child: Stack(
            children: [
              // ── 1. Main WebView ────────────────────────────────────
              RefreshIndicator(
                color: AppConfig.primaryColor,
                backgroundColor: AppConfig.splashBackgroundColor,
                onRefresh: () async {
                  await _controller.reload();
                },
                child: WebViewWidget(controller: _controller),
              ),

              // ── 2. Offline / Connection Error Screen ──────────────
              if (_hasConnectionError && !_showSplashScreen)
                _buildOfflineErrorView(),

              // ── 3. Page Loading Progress Indicator ─────────────────
              if (_isPageLoading && !_showSplashScreen)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    color: AppConfig.primaryColor,
                    backgroundColor: Colors.transparent,
                    minHeight: 2.5,
                  ),
                ),

              // ── 4. Branded Animated Splash Screen ──────────────────
              if (_showSplashScreen)
                _buildAnimatedSplashScreen(),
            ],
          ),
        ),
      ),
    );
  }

  /// Branded Splash Screen tailored per flavor
  Widget _buildAnimatedSplashScreen() {
    return Container(
      color: AppConfig.splashBackgroundColor,
      width: double.infinity,
      height: double.infinity,
      child: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo Card
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: AppConfig.isPartner
                        ? const Color(0xFF020617)
                        : Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: AppConfig.primaryColor.withOpacity(0.25),
                        blurRadius: 30,
                        spreadRadius: 2,
                        offset: const Offset(0, 10),
                      ),
                    ],
                    border: Border.all(
                      color: AppConfig.primaryColor.withOpacity(0.3),
                      width: 1.5,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(26),
                    child: Image.asset(
                      AppConfig.logoAsset,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        AppConfig.isPartner
                            ? Icons.storefront_rounded
                            : Icons.bolt_rounded,
                        size: 54,
                        color: AppConfig.primaryColor,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // App Name
                Text(
                  AppConfig.appName,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: AppConfig.splashTextColor,
                  ),
                ),
                const SizedBox(height: 6),

                // Tagline
                Text(
                  AppConfig.appTagline,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                    color: AppConfig.splashTextColor.withOpacity(0.6),
                  ),
                ),
                const SizedBox(height: 36),

                // Subtle Loader
                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppConfig.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Offline Error State with Retry Button
  Widget _buildOfflineErrorView() {
    return Container(
      color: AppConfig.splashBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.red.withOpacity(0.1),
                border: Border.all(color: Colors.red.withOpacity(0.2)),
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                size: 48,
                color: Colors.redAccent,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              "Connection Lost",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppConfig.splashTextColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Unable to connect to ${AppConfig.appName} servers. Please check your internet connection.",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppConfig.splashTextColor.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() => _isPageLoading = true);
                _loadTargetApp();
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text(
                "Tap to Retry",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
