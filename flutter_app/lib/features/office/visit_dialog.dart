import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/auth_controller.dart';
import '../../data/guest_visits.dart';
import '../../data/offices_controller.dart';
import '../../data/state_controller.dart';
import '../../data/visits_repository.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';
import '../auth/sign_in_sheet.dart';

/// Port of src/components/office/VisitDialog.tsx. Signed-in only (hasPhoto/
/// sign-in-to-add-photos branch collapses to that, since this build has no
/// separate guest-vs-signed-in gate yet beyond VisitsController's own
/// userId check — functionally identical outcome for a guest: no photo UI).
///
/// Substitution, noted rather than silently diverged: the web app's
/// compressImage() (canvas downscale + JPEG re-encode, max edge 1600px,
/// quality 0.82) is replaced here by image_picker's own maxWidth/imageQuality
/// options at pick time — same practical effect (small, JPEG, same max edge
/// and quality), no separate compression pass needed.
Future<void> showVisitDialog(
  BuildContext context, {
  required int officeId,
  required String officeName,
}) {
  final controller = visitsControllerOf(context);
  final visit = controller.visits[officeId];
  if (visit == null) return Future.value();

  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) => Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
      ),
      // Keyed so the form state resets for every office it is opened on.
      child: _VisitForm(key: ValueKey(officeId), officeName: officeName, visit: visit),
    ),
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

class _VisitForm extends StatefulWidget {
  final String officeName;
  final Visit visit;
  const _VisitForm({super.key, required this.officeName, required this.visit});

  @override
  State<_VisitForm> createState() => _VisitFormState();
}

class _VisitFormState extends State<_VisitForm> {
  late final TextEditingController _noteController;
  late bool _isPublic;
  Uint8List? _newPhotoBytes;
  bool _removePhoto = false;
  bool _isSaving = false;

  bool get _hasPhoto => _newPhotoBytes != null || (widget.visit.photoPath != null && !_removePhoto);

  @override
  void initState() {
    super.initState();
    _noteController = TextEditingController(text: widget.visit.note);
    _isPublic = widget.visit.isPublic;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final signedIn = Supabase.instance.client.auth.currentUser != null;
    if (!signedIn) return; // sign-in prompt is the button itself, below
    // The label says "take or upload", so offer both instead of only the camera.
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.of(sheetContext).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.of(sheetContext).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: source,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 82,
    );
    if (file == null) return;
    final bytes = await file.readAsBytes();
    if (!mounted) return;
    setState(() {
      _newPhotoBytes = bytes;
      _removePhoto = false;
    });
  }

  void _removePhotoTapped() {
    setState(() {
      _newPhotoBytes = null;
      _removePhoto = true;
    });
  }

  Future<void> _save(VisitsController controller) async {
    setState(() => _isSaving = true);
    final saved = await controller.saveDetails(
      widget.visit.officeId,
      VisitDetailsInput(
        note: _noteController.text,
        isPublic: _isPublic,
        newPhoto: _newPhotoBytes,
        removePhoto: _removePhoto,
      ),
    );
    if (!mounted) return;
    setState(() => _isSaving = false);
    if (saved) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    final signedIn = Supabase.instance.client.auth.currentUser != null;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Your visit', style: Theme.of(context).textTheme.titleLarge),
          Text(
            '${widget.officeName} · ${widget.visit.visitedAt}',
            style: const TextStyle(color: AppColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          const Text('Note', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 6),
          TextField(
            controller: _noteController,
            maxLength: maxNoteLength,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Special cancellation? Counter timing? Anything to remember.',
              border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
            ),
          ),
          const SizedBox(height: 12),
          const Text('Photo of your stamp', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 6),
          if (!signedIn)
            _DashedButton(
              icon: Icons.camera_alt_outlined,
              label: 'Sign in to add photos',
              onTap: () => showSignInSheet(context, reason: SignInReason.manual),
            )
          else if (_hasPhoto)
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.lineStrong),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _newPhotoBytes != null
                        ? Image.memory(_newPhotoBytes!, width: 56, height: 56, fit: BoxFit.cover)
                        : Container(
                            width: 56,
                            height: 56,
                            color: AppColors.sand,
                            child: const Icon(Icons.camera_alt_outlined, color: AppColors.muted),
                          ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('Stamp photo added', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  TextButton(
                    onPressed: _removePhotoTapped,
                    child: const Text('Remove', style: TextStyle(color: AppColors.postalDark)),
                  ),
                ],
              ),
            )
          else
            _DashedButton(
              icon: Icons.camera_alt_outlined,
              label: 'Take or upload a photo',
              onTap: _pickPhoto,
            ),
          const SizedBox(height: 16),
          const Text('Who can see this', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Expanded(
                  child: _VisibilityOption(
                    checked: !_isPublic,
                    label: 'Private',
                    icon: Icons.lock_outline,
                    onSelect: () => setState(() => _isPublic = false),
                  ),
                ),
                Expanded(
                  child: _VisibilityOption(
                    checked: _isPublic,
                    label: 'Public',
                    icon: Icons.public,
                    onSelect: () => setState(() => _isPublic = true),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isPublic
                ? 'Your note and photo can appear in the community gallery and on your public profile.'
                : 'Only you can see this note and photo.',
            style: const TextStyle(color: AppColors.muted, fontSize: 13.5),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _isSaving ? null : () => _save(controller),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.postal,
                shape: const StadiumBorder(),
              ),
              child: Text(_isSaving ? 'Saving…' : 'Save to my passport'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _DashedButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        constraints: const BoxConstraints(minHeight: 64),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.lineStrong, width: 1.5),
          borderRadius: BorderRadius.circular(16),
          color: AppColors.paper,
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: AppColors.ink),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _VisibilityOption extends StatelessWidget {
  final bool checked;
  final String label;
  final IconData icon;
  final VoidCallback onSelect;
  const _VisibilityOption({
    required this.checked,
    required this.label,
    required this.icon,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelect,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: checked ? Colors.white : null,
          borderRadius: BorderRadius.circular(12),
          boxShadow: checked
              ? const [BoxShadow(color: Color(0x1A000000), blurRadius: 3)]
              : null,
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: AppColors.ink),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
