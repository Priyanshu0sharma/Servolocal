class UserModel {
  final int id;
  final String email;
  final String name;
  final String phone;
  final String role;
  final bool is18Plus;
  final double walletBalance;
  final int servoCoins;
  final bool isActive;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.phone = '',
    this.role = 'customer',
    this.is18Plus = true,
    this.walletBalance = 0.0,
    this.servoCoins = 0,
    this.isActive = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      email: json['email'] ?? '',
      name: json['name'] ?? 'Customer',
      phone: json['phone'] ?? json['mobile_number'] ?? '',
      role: json['role'] ?? 'customer',
      is18Plus: json['is_18_plus'] ?? true,
      walletBalance: (json['wallet_balance'] is num) ? (json['wallet_balance'] as num).toDouble() : 0.0,
      servoCoins: json['servo_coins'] is int ? json['servo_coins'] : 0,
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'role': role,
      'is_18_plus': is18Plus,
      'wallet_balance': walletBalance,
      'servo_coins': servoCoins,
      'is_active': isActive,
    };
  }

  UserModel copyWith({
    String? name,
    String? phone,
    bool? is18Plus,
    double? walletBalance,
    int? servoCoins,
  }) {
    return UserModel(
      id: id,
      email: email,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      role: role,
      is18Plus: is18Plus ?? this.is18Plus,
      walletBalance: walletBalance ?? this.walletBalance,
      servoCoins: servoCoins ?? this.servoCoins,
      isActive: isActive,
    );
  }
}
