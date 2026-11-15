import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/address_model.dart';

class LocationProvider extends ChangeNotifier {
  String _currentLocality = 'Kanti Nagar, Sindhi Camp, Jaipur';
  double _currentLat = 27.0544;
  double _currentLng = 75.8942;

  final List<AddressModel> _savedAddresses = [
    AddressModel(
      id: 'addr_home',
      label: 'Home',
      flatAndBuilding: 'Flat 402, Shiv Shakti Enclave',
      locality: 'Kanti Nagar, Sindhi Camp',
      landmark: 'Near Metro Pillar 124',
      city: 'Jaipur',
      lat: 27.0544,
      lng: 75.8942,
      isDefault: true,
    ),
    AddressModel(
      id: 'addr_work',
      label: 'Work',
      flatAndBuilding: 'Floor 3, Tech Park Tower',
      locality: 'Malviya Nagar',
      landmark: 'Opposite World Trade Park',
      city: 'Jaipur',
      lat: 26.8524,
      lng: 75.8052,
      isDefault: false,
    ),
  ];

  String get currentLocality => _currentLocality;
  double get currentLat => _currentLat;
  double get currentLng => _currentLng;
  List<AddressModel> get savedAddresses => _savedAddresses;

  LocationProvider() {
    loadLocationFromPrefs();
  }

  Future<void> loadLocationFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final loc = prefs.getString('servo_locality');
      if (loc != null && loc.isNotEmpty) {
        _currentLocality = loc;
      }
      final lat = prefs.getDouble('servo_lat');
      final lng = prefs.getDouble('servo_lng');
      if (lat != null && lng != null) {
        _currentLat = lat;
        _currentLng = lng;
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<void> setLocation({
    required String locality,
    required double lat,
    required double lng,
  }) async {
    _currentLocality = locality;
    _currentLat = lat;
    _currentLng = lng;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('servo_locality', locality);
      await prefs.setDouble('servo_lat', lat);
      await prefs.setDouble('servo_lng', lng);
    } catch (_) {}
  }

  void addAddress(AddressModel newAddress) {
    _savedAddresses.add(newAddress);
    setLocation(
      locality: '${newAddress.locality}, ${newAddress.city}',
      lat: newAddress.lat,
      lng: newAddress.lng,
    );
  }
}
