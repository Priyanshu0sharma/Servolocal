class AddressModel {
  final String id;
  final String label; // Home, Work, Other
  final String flatAndBuilding;
  final String locality;
  final String landmark;
  final String city;
  final double lat;
  final double lng;
  final bool isDefault;

  AddressModel({
    required this.id,
    required this.label,
    required this.flatAndBuilding,
    required this.locality,
    this.landmark = '',
    this.city = 'Jaipur',
    this.lat = 27.0544,
    this.lng = 75.8942,
    this.isDefault = false,
  });

  String get fullAddress =>
      '$flatAndBuilding, $locality${landmark.isNotEmpty ? ', Near $landmark' : ''}, $city';

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] ?? 'addr_1',
      label: json['label'] ?? 'Home',
      flatAndBuilding: json['flat_and_building'] ?? json['address_line1'] ?? '',
      locality: json['locality'] ?? 'Sindhi Camp',
      landmark: json['landmark'] ?? '',
      city: json['city'] ?? 'Jaipur',
      lat: (json['lat'] is num) ? (json['lat'] as num).toDouble() : 27.0544,
      lng: (json['lng'] is num) ? (json['lng'] as num).toDouble() : 75.8942,
      isDefault: json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'flat_and_building': flatAndBuilding,
      'locality': locality,
      'landmark': landmark,
      'city': city,
      'lat': lat,
      'lng': lng,
      'is_default': isDefault,
    };
  }
}
