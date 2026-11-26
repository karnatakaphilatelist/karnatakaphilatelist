/// Exact port of formatPlaceName() in src/lib/format.ts.
const _acronyms = {'so', 'bo', 'ho', 'gpo', 'hpo', 'mdg', 'pb', 'po', 'nal', 'sgs'};
const _smallWords = {'of', 'the', 'and', 'at', 'in', 'on', 'for'};

String _capitalise(String word) =>
    word.isEmpty ? word : word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();

/// Tidies a place name for display: consistent capitals, "h o" written as
/// "HO", and postal terms such as SO / BO / HO in capitals. Spelling is left
/// alone, so "shivmogga" becomes "Shivmogga".
String formatPlaceName(String raw) {
  final cleaned = raw
      .trim()
      .replaceAll(RegExp(r'\s+'), ' ')
      .replaceAllMapped(RegExp(r'\b([hsb]) o\b', caseSensitive: false), (m) => '${m[1]}o');

  // JS split with a capturing group keeps the separators; rebuild that.
  final tokens = <String>[];
  var last = 0;
  for (final m in RegExp(r'(\s+|-)').allMatches(cleaned)) {
    tokens
      ..add(cleaned.substring(last, m.start))
      ..add(m[0]!);
    last = m.end;
  }
  tokens.add(cleaned.substring(last));

  var isFirstWord = true;
  return tokens.map((token) {
    if (token.isEmpty || RegExp(r'^(\s+|-)$').hasMatch(token)) return token;
    final lower = token.toLowerCase();
    final wasFirst = isFirstWord;
    isFirstWord = false;
    if (_acronyms.contains(lower)) return lower.toUpperCase();
    if (!wasFirst && _smallWords.contains(lower)) return lower;
    return _capitalise(token);
  }).join();
}
