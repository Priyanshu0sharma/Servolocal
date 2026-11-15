import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  UserModel? _user;
  bool _isLoading = false;
  String _errorMessage = '';

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  bool get is18Plus => _user?.is18Plus ?? true;

  AuthProvider() {
    loadUserFromPrefs();
  }

  Future<void> loadUserFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('servo_user');
      if (userStr != null) {
        _user = UserModel.fromJson(jsonDecode(userStr));
        notifyListeners();
        // Sync fresh profile from DB in background
        fetchUserProfile();
      }
    } catch (_) {}
  }

  Future<bool> sendOtp(String email) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      await _api.post(ApiConstants.sendOtp, {
        'email': email.trim().toLowerCase(),
        'role': 'customer',
        'intent': 'login',
      });
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtp(String email, String otpCode) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.verifyOtp, {
        'email': email.trim().toLowerCase(),
        'otp_code': otpCode.trim(),
        'role': 'customer',
      });

      if (res is Map && res.containsKey('access_token')) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('servo_token', res['access_token']);

        if (res.containsKey('user')) {
          _user = UserModel.fromJson(res['user']);
          await prefs.setString('servo_user', jsonEncode(_user!.toJson()));
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Invalid response from verification server.');
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchUserProfile() async {
    try {
      final res = await _api.get(ApiConstants.profile);
      if (res is Map && res.containsKey('user')) {
        _user = UserModel.fromJson(res['user']);
      } else if (res is Map && res.containsKey('id')) {
        _user = UserModel.fromJson(Map<String, dynamic>.from(res));
      }
      if (_user != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('servo_user', jsonEncode(_user!.toJson()));
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> updateProfile({
    String? name,
    String? phone,
    bool? is18Plus,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.updateProfile, {
        if (name != null) 'name': name.trim(),
        if (phone != null) 'phone': phone.trim(),
        if (is18Plus != null) 'is_18_plus': is18Plus,
      });

      if (res is Map && res.containsKey('user')) {
        _user = UserModel.fromJson(res['user']);
      } else {
        _user = _user?.copyWith(
          name: name,
          phone: phone,
          is18Plus: is18Plus,
        );
      }

      if (_user != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('servo_user', jsonEncode(_user!.toJson()));
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('servo_token');
    await prefs.remove('servo_user');
    _user = null;
    notifyListeners();
  }
}
