class ShopModel {
  final int id;
  final String name;
  final String category;
  final String? imageUrl;
  final bool isOpen;
  final double rating;
  final String ratingCount;
  final double distanceKm;
  final String etaMins;
  final String localityName;
  final bool isVerified;

  ShopModel({
    required this.id,
    required this.name,
    required this.category,
    this.imageUrl,
    this.isOpen = true,
    this.rating = 4.8,
    this.ratingCount = '500+',
    this.distanceKm = 1.0,
    this.etaMins = '⚡ 10-15 mins',
    this.localityName = 'Local Market',
    this.isVerified = true,
  });

  factory ShopModel.fromJson(Map<String, dynamic> json) {
    return ShopModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '1') ?? 1,
      name: json['name'] ?? 'Local Store',
      category: json['category'] ?? 'General Kirana',
      imageUrl: json['image_url'],
      isOpen: json['is_open'] ?? true,
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 4.8,
      ratingCount: json['rating_count']?.toString() ?? '500+',
      distanceKm: (json['distance_km'] is num)
          ? (json['distance_km'] as num).toDouble()
          : 0.8,
      etaMins: json['local_eta_mins'] ?? json['eta_mins'] ?? '⚡ 10-15 mins',
      localityName: json['locality_name'] ?? 'Local Area',
      isVerified: json['is_verified'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'image_url': imageUrl,
      'is_open': isOpen,
      'rating': rating,
      'rating_count': ratingCount,
      'distance_km': distanceKm,
      'eta_mins': etaMins,
      'locality_name': localityName,
      'is_verified': isVerified,
    };
  }
}
