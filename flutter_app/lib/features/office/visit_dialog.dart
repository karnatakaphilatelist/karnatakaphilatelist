import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/auth_controller.dart';
import '../../data/guest_visits.dart';
import '../../data/offices_controller.dart';
import '../../data/state_controller.dart';
import '../../data/visits_repository.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/dashed_border.dart';
import '../auth/sign_in_sheet.dart';

/// Port of src/components/office/VisitDialog.tsx: the "Your visit" sheet —
/// note, stamp photo (sign-in prompt for guests), who can see it, save.
/// image_picker's maxWidth/imageQuality stand in for the web's
/// compressImage() (max edge 1600px, JPEG quality 0.82).
Future<void> showVisitDialog(
  BuildContext context, {
  required int officeId,
  required String officeName,
}) {
  final controller = visitsControllerOf(context);
  final visit = controller.visits[officeId];
  if (visit == null) return Future.value();
  return showAppSheet<void>(
    context,
    title: 'Your visit',
    description: '$officeName · ${visit.visitedAt}',
    // Keyed so the form state resets for every office it is opened on.
    builder: (sheetContext) => _VisitForm(key: ValueKey(officeId), visit: visit),
  );
}

/// Static lookup (not a reactive dependency) — safe to call from both
/// build methods and callbacks. Screens that need to rebuild on controller
/// changes wrap themselves in `AnimatedBuilder(animation: controller, ...)`
/// instead of relying on InheritedWidget's own notify mechanism; the
/// controller instance itself never changes during the app's lifetime, so
/// InheritedWidget's dependency tracking would add nothing here.
VisitsController visitsControllerOf(BuildContext context) {
  final scope = context.findAncestorWidgetOfExactType<VisitsScope>();
  assert(scope != null, 'No VisitsScope found in context — wrap the app with one in main.dart.');
  return scope!.controller;
}

/// Same static-lookup reasoning as [visitsControllerOf] — see its doc comment.
StateController stateControllerOf(BuildContext context) {
  final scope = context.findAncestorWidgetOfExactType<VisitsScope>();
  assert(scope != null, 'No VisitsScope found in context — wrap the app with one in main.dart.');
  return scope!.stateController;
}

OfficesController officesControllerOf(BuildContext context) {
  final scope = context.findAncestorWidgetOfExactType<VisitsScope>();
  assert(scope != null, 'No VisitsScope found in context — wrap the app with one in main.dart.');
  return scope!.officesController;
}

/// Same static-lookup reasoning as [visitsControllerOf] — see its doc comment.
AuthController authControllerOf(BuildContext context) {
  final scope = context.findAncestorWidgetOfExactType<VisitsScope>();
  assert(scope != null, 'No VisitsScope found in context — wrap the app with one in main.dart.');
  return scope!.authController;
}

/// Minimal InheritedWidget so this screen doesn't need a full app-wide
/// provider package yet — now also holds Stage 4's AuthController, the
/// natural point this was going to be reconsidered anyway (see the earlier
/// doc comment on this class).
/// Holds all four app-level controllers now that Explore, Passport and
/// Account all need shared state (office list, selected-state preference,
/// visits, and sign-in).
class VisitsScope extends InheritedWidget {
  final VisitsController controller;
  final StateController stateController;
  final OfficesController officesController;
  final AuthController authController;
  const VisitsScope({
    super.key,
    required this.controller,
    required this.stateController,
    required this.officesController,
    required this.authController,
    required super.child,
  });

  @override
  bool updateShouldNotify(VisitsScope oldWidget) => oldWidget.controller != controller;
}

const _fieldLabel = TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w700, color: AppColors.ink);

class _VisitForm extends StatefulWidget {
  final Visit visit;
  const _VisitForm({super.key, required this.visit});

  @override
  State<_VisitForm> createState() => _VisitFormState();
}

class _VisitFormState extends State<_VisitForm> {
  late final TextEditingController _noteController;
  late bool _isPublic;
  Uint8List? _newPhotoBytes;
  bool _removePhoto = false;
  bool _isSaving = false;
  Future<String>? _savedPhotoUrl;

  bool get _hasPhoto => _newPhotoBytes != null || (widget.visit.photoPath != null && !_removePhoto);

  @override
  void initState() {
    super.initState();
    _noteController = TextEditingController(text: widget.visit.note);
    _isPublic = widget.visit.isPublic;
    final path = widget.visit.photoPath;
    if (path != null && Supabase.instance.client.auth.currentUser != null) {
      _savedPhotoUrl = Supabase.instance.client.storage.from('stamp-photos').createSignedUrl(path, 3600);
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  /// The phone's own "take or choose" prompt, like the web app's native camera sheet.
  Future<void> _pickPhoto() async {
    final source = await showAppSheet<ImageSource>(
      context,
      title: 'Add a photo',
      builder: (sheetContext) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ChoiceRow(icon: AppIcon.camera, label: 'Take a photo', onTap: () => Navigator.of(sheetContext).pop(ImageSource.camera)),
          const SizedBox(height: 8),
          _ChoiceRow(icon: AppIcon.note, label: 'Choose from gallery', onTap: () => Navigator.of(sheetContext).pop(ImageSource.gallery)),
        ],
      ),
    );
    if (source == null || !mounted) return;
    final file = await ImagePicker().pickImage(source: source, maxWidth: 1600, maxHeight: 1600, imageQuality: 82);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    if (!mounted) return;
    setState(() {
      _newPhotoBytes = bytes;
      _removePhoto = false;
    });
  }

  Future<void> _save(VisitsController controller) async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    final saved = await controller.saveDetails(
      widget.visit.officeId,
      VisitDetailsInput(note: _noteController.text, isPublic: _isPublic, newPhoto: _newPhotoBytes, removePhoto: _removePhoto),
    );
    if (!mounted) return;
    setState(() => _isSaving = false);
    if (saved) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    final signedIn = Supabase.instance.client.auth.currentUser != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('Note', style: _fieldLabel),
        const SizedBox(height: 6),
        SizedBox(
          height: 96,
          child: TextField(
            controller: _noteController,
            inputFormatters: [LengthLimitingTextInputFormatter(maxNoteLength)],
            maxLines: null,
            expands: true,
            textAlignVertical: TextAlignVertical.top,
            cursorColor: AppColors.ink,
            style: const TextStyle(fontSize: 16, height: 1.5, color: AppColors.ink),
            decoration: InputDecoration(
              hintText: 'Special cancellation? Counter timing? Anything to remember.',
              hintStyle: const TextStyle(fontSize: 16, height: 1.5, color: Color(0xFF9CA3AF)),
              contentPadding: const EdgeInsets.all(12),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.lineStrong),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.ink, width: 2),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Photo of your stamp', style: _fieldLabel),
        const SizedBox(height: 6),
        if (!signedIn)
          _DashedButton(label: 'Sign in to add photos', onTap: () => showSignInSheet(context, reason: SignInReason.manual))
        else if (_hasPhoto)
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(border: Border.all(color: AppColors.lineStrong), borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 56,
                    height: 56,
                    child: _newPhotoBytes != null
                        ? Image.memory(_newPhotoBytes!, fit: BoxFit.cover)
                        : FutureBuilder<String>(
                            future: _savedPhotoUrl,
                            builder: (context, snap) => snap.data != null
                                ? Image.network(snap.data!, fit: BoxFit.cover)
                                : const ColoredBox(
                                    color: AppColors.sand,
                                    child: Center(child: AppIconView(AppIcon.camera, size: 20, color: AppColors.muted)),
                                  ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(child: Text('Stamp photo added', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink))),
                GestureDetector(
                  onTap: () => setState(() {
                    _newPhotoBytes = null;
                    _removePhoto = true;
                  }),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 44),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.center,
                    child: const Text('Remove', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.postalDark)),
                  ),
                ),
              ],
            ),
          )
        else
          _DashedButton(label: 'Take or upload a photo', onTap: _pickPhoto),
        const SizedBox(height: 16),
        const Text('Who can see this', style: _fieldLabel),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(16)),
          child: Row(
            children: [
              Expanded(
                child: _VisibilityOption(checked: !_isPublic, label: 'Private', icon: AppIcon.lock, onSelect: () => setState(() => _isPublic = false)),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _VisibilityOption(checked: _isPublic, label: 'Public', icon: AppIcon.globe, onSelect: () => setState(() => _isPublic = true)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _isPublic
              ? "Your note and photo show on this office's Public tab for other collectors to see."
              : 'Only you can see this note and photo.',
          style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted),
        ),
        const SizedBox(height: 20),
        Opacity(
          opacity: _isSaving ? 0.6 : 1,
          child: GestureDetector(
            onTap: () => _save(controller),
            child: Container(
              constraints: const BoxConstraints(minHeight: 52),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
              child: Text(_isSaving ? 'Saving…' : 'Save to my passport',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ),
      ],
    );
  }
}

class _DashedButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _DashedButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: DashedBorder(
        color: AppColors.lineStrong,
        strokeWidth: 1.5,
        dash: 5,
        gap: 4,
        fill: AppColors.paper,
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const AppIconView(AppIcon.camera, size: 20, color: AppColors.ink),
              const SizedBox(width: 8),
              Flexible(child: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink))),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChoiceRow extends StatelessWidget {
  final AppIcon icon;
  final String label;
  final VoidCallback onTap;
  const _ChoiceRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 56),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.line)),
        child: Row(
          children: [
            AppIconView(icon, size: 20, color: AppColors.ink),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
          ],
        ),
      ),
    );
  }
}

class _VisibilityOption extends StatelessWidget {
  final bool checked;
  final String label;
  final AppIcon icon;
  final VoidCallback onSelect;
  const _VisibilityOption({required this.checked, required this.label, required this.icon, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: checked,
      button: true,
      child: GestureDetector(
        onTap: onSelect,
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          decoration: BoxDecoration(
            color: checked ? Colors.white : null,
            borderRadius: BorderRadius.circular(12),
            boxShadow: checked ? [cssShadow(0, 1, 2, 0, Colors.black.withValues(alpha: 0.05))] : null,
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppIconView(icon, size: 16, color: AppColors.ink),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
            ],
          ),
        ),
      ),
    );
  }
}
