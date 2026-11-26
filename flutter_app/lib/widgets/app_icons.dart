import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Exact port of src/components/ui/icons.tsx: same 24×24 path data, same
/// round caps/joins, default stroke 2. Rendered with flutter_svg so every
/// icon is the identical outline the web app draws — not a Material
/// look-alike.
enum AppIcon {
  search('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  mail('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  flag('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  check('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  close('<path d="M6 6l12 12M18 6L6 18"/>'),
  camera('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  lock('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
  globe('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
  navigation('<path d="M12 3l7 17-7-4-7 4z"/>'),
  compass('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
  book('<path d="M6 3h11a2 2 0 012 2v16H8a2 2 0 01-2-2z"/><path d="M6 19a2 2 0 012-2h11"/>'),
  locate('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'),
  arrowRight('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
  arrowLeft('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>'),
  user('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  chevronRight('<path d="M9 6l6 6-6 6"/>'),
  alert('<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17h.01"/>'),
  target('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>'),
  share('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7h14v-7"/>'),
  note('<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M10 8h5"/>'),
  learn('<path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z"/><path d="M12 6.5v13"/>');

  final String body;
  const AppIcon(this.body);
}

String _hex(Color c) => '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';

class AppIconView extends StatelessWidget {
  final AppIcon icon;
  final double size;
  final Color color;
  final double strokeWidth;
  const AppIconView(this.icon, {super.key, this.size = 24, required this.color, this.strokeWidth = 2});

  @override
  Widget build(BuildContext context) {
    final svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        'stroke="${_hex(color)}" stroke-opacity="${color.a}" stroke-width="$strokeWidth" '
        'stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>';
    return SvgPicture.string(svg, width: size, height: size);
  }
}

/// The small chevron the web draws inline in a 20×20 box (`m5 7.5 5 5 5-5`),
/// used by the state switcher title and the sheet's Show list/map button.
class ChevronDown20 extends StatelessWidget {
  final double size;
  final Color color;
  final double strokeWidth;
  final bool up;
  const ChevronDown20({super.key, required this.size, required this.color, this.strokeWidth = 2.4, this.up = false});

  @override
  Widget build(BuildContext context) {
    final svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" '
        'stroke="${_hex(color)}" stroke-width="$strokeWidth" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="m5 7.5 5 5 5-5"/></svg>';
    final picture = SvgPicture.string(svg, width: size, height: size);
    return up ? Transform.rotate(angle: 3.141592653589793, child: picture) : picture;
  }
}

/// The 24×24 chevron OfficeList draws (`m9 6 6 6-6 6`, stroke 2.2).
class ListChevron extends StatelessWidget {
  final Color color;
  const ListChevron({super.key, required this.color});

  @override
  Widget build(BuildContext context) {
    final svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        'stroke="${_hex(color)}" stroke-width="2.2" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
    return SvgPicture.string(svg, width: 20, height: 20);
  }
}
