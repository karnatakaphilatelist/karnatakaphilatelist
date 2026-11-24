/// Port of src/lib/states.ts. Keep in sync by hand (same boundary note as
/// models/post_office.dart — no shared codegen step).
const Map<String, String> stateNames = {
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CG': 'Chhattisgarh',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OD': 'Odisha',
  'PB': 'Punjab',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TS': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UK': 'Uttarakhand',
  'WB': 'West Bengal',
  'DL': 'Delhi',
  'JK': 'Jammu and Kashmir',
  'LA': 'Ladakh',
  'PY': 'Puducherry',
  'CH': 'Chandigarh',
  'AN': 'Andaman and Nicobar Islands',
  'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'LD': 'Lakshadweep',
};

const String defaultState = 'KA';

/// States announced but not yet browsable — currently empty, matching the
/// live web source (src/lib/states.ts) read fresh this stage.
const List<String> comingSoonStates = [];

String stateName(String code) => stateNames[code] ?? code;

const Map<String, String> _stateGreetings = {'KA': 'Namaskara', 'TN': 'Vanakkam'};

/// Regional greeting word for the current state. Falls back to "Namaskara".
String greetingWord(String code) => _stateGreetings[code] ?? 'Namaskara';

class StateOption {
  final String code;
  final String name;
  final int count;
  const StateOption({required this.code, required this.name, required this.count});
}

/// The states a person can browse, with office counts, ordered by name.
List<StateOption> liveStates(Iterable<String> officeStateCodes) {
  final counts = <String, int>{};
  for (final code in officeStateCodes) {
    if (comingSoonStates.contains(code)) continue;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  final options = counts.entries
      .map((e) => StateOption(code: e.key, name: stateName(e.key), count: e.value))
      .toList();
  options.sort((a, b) => a.name.compareTo(b.name));
  return options;
}

/// Picks the state to show: the stored choice if it still exists, else
/// Karnataka, else the first live state.
String resolveState(String? stored, List<StateOption> live) {
  if (stored != null && live.any((s) => s.code == stored)) return stored;
  if (live.any((s) => s.code == defaultState)) return defaultState;
  return live.isNotEmpty ? live.first.code : defaultState;
}
