import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

/// Port of src/lib/contributions.ts.
enum ContributionType { betterStampImage, coordinatesCorrection, officeInfoUpdate, newOfficeSuggestion }

extension ContributionTypeDb on ContributionType {
  String get dbValue => switch (this) {
        ContributionType.betterStampImage => 'better_stamp_image',
        ContributionType.coordinatesCorrection => 'coordinates_correction',
        ContributionType.officeInfoUpdate => 'office_info_update',
        ContributionType.newOfficeSuggestion => 'new_office_suggestion',
      };
}

Future<void> submitContribution(
  SupabaseClient client, {
  required String userId,
  required int? officeId,
  required ContributionType type,
  required String note,
  Uint8List? photoBytes,
}) async {
  String? photoUrl;
  if (photoBytes != null) {
    final path = '$userId/${DateTime.now().millisecondsSinceEpoch}.jpg';
    try {
      await client.storage.from('contribution-photos').uploadBinary(path, photoBytes);
      photoUrl = client.storage.from('contribution-photos').getPublicUrl(path);
    } catch (e) {
      throw Exception('Photo upload failed. Please try again.');
    }
  }

  try {
    await client.from('contributions').insert({
      'user_id': userId,
      'office_id': officeId,
      'type': type.dbValue,
      'note': note.trim().isEmpty ? null : note.trim(),
      'photo_url': photoUrl,
    });
  } catch (e) {
    throw Exception('Could not send your contribution. Please try again.');
  }
}
