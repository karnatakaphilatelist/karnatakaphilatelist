import 'package:flutter/material.dart';

/// Ported directly from the `--color-*` custom properties in
/// `src/app/globals.css`, reconciled against the live code on 2026-11-24 (see
/// DESIGN.md's "Rule: the shipped code is the source of truth"). If this file
/// and `globals.css` ever disagree again, re-run that reconciliation — don't
/// guess, and don't trust DESIGN.md's prose over the CSS.
class AppColors {
  AppColors._();

  static const paper = Color(0xFFFBF3E2);
  static const sand = Color(0xFFF1E8D3);
  static const card = Color(0xFFFFFFFF);
  static const ink = Color(0xFF16204F);
  static const muted = Color(0xFF5D6283);
  static const line = Color(0xFFE6DCC3);
  static const lineStrong = Color(0xFFD9CFB6);

  static const coral = Color(0xFFE8583A);

  static const postal = Color(0xFFCF1830);
  static const postalDark = Color(0xFFA8122A);
  static const postalSoft = Color(0xFFFBE7EA);

  static const visited = Color(0xFF17794B);
  static const visitedSoft = Color(0xFFDDF3E7);
  static const visitedInk = Color(0xFF14653F);

  static const planned = Color(0xFFFFC94D);
  static const plannedSoft = Color(0xFFFFF1C7);
  static const plannedInk = Color(0xFF6B4B00);

  static const warn = Color(0xFF8A4306);
  static const warnSoft = Color(0xFFFDEBD3);

  static const focus = Color(0xFF16204F);

  /// Not a global token on the web app — a one-off (#f7c96b) used only on
  /// red "kp-red" surfaces (Passport header stamped count/progress bar,
  /// sign-in sheet's gold tagline). Keep it separate from `planned`.
  static const goldOnRed = Color(0xFFF7C96B);

  // ── One-off literals the web components use directly (not @theme tokens),
  // named here so every screen uses the exact same value. ──

  /// `#2f4aa8` — unvisited pins, clusters, Plan flag, in-panel text links.
  static const pinBlue = Color(0xFF2F4AA8);

  /// `#1f8a4d` — visited pins/clusters, list check marks, Explore progress fill.
  static const stampGreen = Color(0xFF1F8A4D);

  /// `#785a1e` — the warm brown used at low alpha for dividers, the sheet's
  /// pill button, planned list marks and progress tracks.
  static const warmBrown = Color(0xFF785A1E);

  /// `#b8861b` — the thin gold separators between meta values.
  static const goldRule = Color(0xFFB8861B);

  /// `#c7c7cc` — sheet grab handles.
  static const handle = Color(0xFFC7C7CC);

  /// `#f3e2bd` — the active filter chip fill.
  static const chipActive = Color(0xFFF3E2BD);

  /// `#8f640f` — "Not yet stamped" badge text/tint.
  static const unstampedGold = Color(0xFF8F640F);

  /// `#e0334a` — top stop of the red CTA gradient (bottom stop is postal).
  static const postalTop = Color(0xFFE0334A);

  /// `#fffaf0` — warm white (glass bottom stop, lite-mode solid surface).
  static const warmWhite = Color(0xFFFFFAF0);
}

/// Converts a CSS `box-shadow` (blur radius in CSS px) to a Flutter
/// [BoxShadow]. CSS blurs with sigma = blur/2; Flutter derives sigma from
/// blurRadius as `r * 0.57735 + 0.5`, so the radius is converted rather than
/// copied, or every shadow comes out ~15% softer and larger than the web's.
BoxShadow cssShadow(double x, double y, double blur, double spread, Color color) {
  final sigma = blur / 2;
  final radius = sigma <= 0.5 ? 0.0 : (sigma - 0.5) / 0.57735;
  return BoxShadow(color: color, offset: Offset(x, y), blurRadius: radius, spreadRadius: spread);
}

/// Font families match `--font-display` (Fraunces, headlines), `--font-sans`
/// (Figtree, body) and `--font-mono` (Courier Prime, tabular/postal details —
/// pincodes, distances, dates, stamp counts) exactly as shipped in
/// `globals.css`. The font files are vendored at assets/fonts/ (same
/// @fontsource-variable builds the web app loads) and declared in
/// pubspec.yaml.
class AppFonts {
  AppFonts._();

  static const display = 'Fraunces';
  static const sans = 'Figtree';
  static const mono = 'CourierPrime';
}

ThemeData buildAppTheme() {
  const colorScheme = ColorScheme.light(
    surface: AppColors.paper,
    primary: AppColors.postal,
    onPrimary: Colors.white,
    secondary: AppColors.visited,
    onSecondary: Colors.white,
    error: AppColors.postalDark,
    onSurface: AppColors.ink,
  );

  return ThemeData(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.paper,
    fontFamily: AppFonts.sans,
    textTheme: const TextTheme(
      // Headlines: Fraunces, weight 500 — matches the reconciled DESIGN.md note
      // (there is no live Figtree-only headline treatment anywhere in the app).
      headlineLarge: TextStyle(
        fontFamily: AppFonts.display,
        fontWeight: FontWeight.w500,
        color: AppColors.ink,
      ),
      headlineMedium: TextStyle(
        fontFamily: AppFonts.display,
        fontWeight: FontWeight.w500,
        color: AppColors.ink,
      ),
      titleLarge: TextStyle(
        fontFamily: AppFonts.display,
        fontWeight: FontWeight.w500,
        color: AppColors.ink,
      ),
      // Body: Figtree.
      bodyLarge: TextStyle(fontFamily: AppFonts.sans, color: AppColors.ink),
      bodyMedium: TextStyle(fontFamily: AppFonts.sans, color: AppColors.ink),
      bodySmall: TextStyle(fontFamily: AppFonts.sans, color: AppColors.muted),
      // Tabular/postal details (pincode, distance, dates, stamp counts): Courier Prime.
      labelMedium: TextStyle(fontFamily: AppFonts.mono, color: AppColors.muted),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.postal,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
      ),
    ),
    // DESIGN.md's "Secondary button" is pill-shaped like the primary one, just
    // outlined instead of filled — matches the web app's secondary buttons.
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.ink,
        side: const BorderSide(color: AppColors.lineStrong, width: 1.5),
        shape: const StadiumBorder(),
      ),
    ),
    dividerColor: AppColors.line,
  );
}
