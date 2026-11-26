import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/auth_controller.dart';
import '../../data/contributions_repository.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/dashed_border.dart';
import '../../widgets/glass_card.dart';
import '../auth/sign_in_sheet.dart';
import 'visit_dialog.dart';

const _blueTop = AppColors.pinBlue;
const _blueBottom = Color(0xFF243A8A);

/// Port of src/components/contribute/ContributeSheet.tsx: its own glass panel
/// rising over the office card (black/20 scrim), with the form for signed-in
/// people and a "sign in to contribute" note for guests.
Future<void> showContributeSheet(BuildContext context, {required PostOffice office}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    barrierColor: const Color(0x33000000),
    elevation: 0,
    builder: (sheetContext) {
      final media = MediaQuery.of(sheetContext);
      return Padding(
        padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: media.size.height * 0.9),
          child: GlassCard(
            kind: GlassKind.panel,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: AppColors.handle, borderRadius: BorderRadius.circular(999)),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Contribute', style: TextStyle(fontSize: 17, height: 1.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                            Text(office.name, style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted)),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(sheetContext).pop(),
                        child: const GlassCard(
                          borderRadius: BorderRadius.all(Radius.circular(999)),
                          child: SizedBox(
                            width: 32,
                            height: 32,
                            child: Center(child: AppIconView(AppIcon.close, size: 11, color: AppColors.ink, strokeWidth: 2.8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Flexible(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + media.padding.bottom),
                    child: AnimatedBuilder(
                      animation: authControllerOf(context),
                      builder: (context, _) => authControllerOf(context).user != null
                          ? _ContributeForm(office: office)
                          : _SignInToContribute(onSignIn: () => showSignInSheet(context, reason: SignInReason.manual)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

class _SignInToContribute extends StatelessWidget {
  final VoidCallback onSignIn;
  const _SignInToContribute({required this.onSignIn});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      child: Column(
        children: [
          const Text('Sign in to contribute', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.ink)),
          const SizedBox(height: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: const Text(
              'You need an account so we can credit your contribution and reach you if we have questions.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: onSignIn,
            child: Container(
              height: 48,
              constraints: const BoxConstraints(maxWidth: 260),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_blueTop, _blueBottom]),
              ),
              child: const Text('SIGN IN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 14 * 0.12, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}

const _options = <(ContributionType, String, String)>[
  (ContributionType.betterStampImage, 'Better stamp photo', "Share a clearer photo of this office's PPC stamp"),
  (ContributionType.coordinatesCorrection, 'Fix location pin', 'The map pin is in the wrong place'),
  (ContributionType.officeInfoUpdate, 'Update office info', 'Name, pincode or district is wrong'),
  (ContributionType.newOfficeSuggestion, 'Suggest a new office', 'This post office should be on Philatrail'),
];

const _label = TextStyle(fontSize: 13, height: 1.5, fontWeight: FontWeight.w600, letterSpacing: 13 * 0.1, color: AppColors.muted);

class _ContributeForm extends StatefulWidget {
  final PostOffice office;
  const _ContributeForm({required this.office});

  @override
  State<_ContributeForm> createState() => _ContributeFormState();
}

enum _SubmitState { idle, loading, success, error }

class _ContributeFormState extends State<_ContributeForm> {
  ContributionType? _selected;
  final _noteController = TextEditingController();
  Uint8List? _photoBytes;
  _SubmitState _state = _SubmitState.idle;
  String _errorMsg = '';

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600, maxHeight: 1600, imageQuality: 82);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() => _photoBytes = bytes);
  }

  Future<void> _submit() async {
    final type = _selected;
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (type == null || userId == null || _state == _SubmitState.loading) return;
    setState(() {
      _state = _SubmitState.loading;
      _errorMsg = '';
    });
    try {
      await submitContribution(
        Supabase.instance.client,
        userId: userId,
        officeId: widget.office.id,
        type: type,
        note: _noteController.text,
        photoBytes: _photoBytes,
      );
      if (!mounted) return;
      setState(() => _state = _SubmitState.success);
      await Future<void>.delayed(const Duration(milliseconds: 1800));
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _state = _SubmitState.error;
        _errorMsg = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_state == _SubmitState.success) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: const BoxDecoration(color: AppColors.visitedSoft, shape: BoxShape.circle),
              child: const AppIconView(AppIcon.check, size: 28, color: AppColors.visitedInk, strokeWidth: 2.5),
            ),
            const SizedBox(height: 16),
            const Text('Thanks for your help!', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.ink)),
            const SizedBox(height: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 260),
              child: const Text("We'll review your contribution and update the app.",
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
            ),
          ],
        ),
      );
    }

    final photoRelevant = _selected == ContributionType.betterStampImage || _selected == ContributionType.newOfficeSuggestion;
    final canSubmit = _selected != null && _state != _SubmitState.loading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('WHAT WOULD YOU LIKE TO CONTRIBUTE?', style: _label),
        const SizedBox(height: 8),
        for (final (type, label, hint) in _options) ...[
          _Option(label: label, hint: hint, selected: _selected == type, onTap: () => setState(() => _selected = type)),
          const SizedBox(height: 8),
        ],
        if (photoRelevant) ...[
          const SizedBox(height: 8),
          const Text('PHOTO (OPTIONAL)', style: _label),
          const SizedBox(height: 8),
          if (_photoBytes != null)
            Align(
              alignment: Alignment.centerLeft,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    clipBehavior: Clip.antiAlias,
                    constraints: const BoxConstraints(maxHeight: 180),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.ink.withValues(alpha: 0.1)),
                    ),
                    child: Image.memory(_photoBytes!, fit: BoxFit.contain),
                  ),
                  Positioned(
                    right: -8,
                    top: -8,
                    child: GestureDetector(
                      onTap: () => setState(() => _photoBytes = null),
                      child: Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [cssShadow(0, 4, 6, -1, Colors.black.withValues(alpha: 0.1))],
                        ),
                        child: const AppIconView(AppIcon.close, size: 10, color: AppColors.ink, strokeWidth: 2.5),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            GestureDetector(
              onTap: _pickPhoto,
              child: DashedBorder(
                color: AppColors.ink.withValues(alpha: 0.2),
                strokeWidth: 1,
                dash: 4,
                gap: 3,
                child: const SizedBox(
                  height: 72,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppIconView(AppIcon.camera, size: 20, color: AppColors.muted, strokeWidth: 1.5),
                      SizedBox(width: 8),
                      Text('Attach a photo', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.muted)),
                    ],
                  ),
                ),
              ),
            ),
        ],
        const SizedBox(height: 16),
        const Text('NOTE (OPTIONAL)', style: _label),
        const SizedBox(height: 8),
        TextField(
          controller: _noteController,
          minLines: 3,
          maxLines: 3,
          cursorColor: AppColors.ink,
          style: const TextStyle(fontSize: 14, height: 21 / 14, color: AppColors.ink),
          decoration: InputDecoration(
            hintText: 'Any extra detail that helps us review your contribution…',
            hintStyle: TextStyle(fontSize: 14, height: 21 / 14, color: AppColors.muted.withValues(alpha: 0.6)),
            filled: true,
            fillColor: AppColors.ink.withValues(alpha: 0.015),
            contentPadding: const EdgeInsets.all(14),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: AppColors.ink.withValues(alpha: 0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: AppColors.pinBlue.withValues(alpha: 0.4)),
            ),
          ),
        ),
        if (_state == _SubmitState.error) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.warnSoft, borderRadius: BorderRadius.circular(12)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(padding: EdgeInsets.only(top: 2), child: AppIconView(AppIcon.alert, size: 16, color: AppColors.warn)),
                const SizedBox(width: 8),
                Expanded(child: Text(_errorMsg, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.warn))),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        Opacity(
          opacity: canSubmit ? 1 : 0.4,
          child: GestureDetector(
            onTap: canSubmit ? _submit : null,
            child: Container(
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_blueTop, _blueBottom]),
                boxShadow: [cssShadow(0, 6, 14, -6, _blueTop.withValues(alpha: 0.5))],
              ),
              child: _state == _SubmitState.loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('SEND CONTRIBUTION',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 16 * 0.12, color: Colors.white)),
            ),
          ),
        ),
      ],
    );
  }
}

class _Option extends StatelessWidget {
  final String label;
  final String hint;
  final bool selected;
  final VoidCallback onTap;
  const _Option({required this.label, required this.hint, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.pinBlue.withValues(alpha: 0.06) : AppColors.ink.withValues(alpha: 0.015),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? AppColors.pinBlue.withValues(alpha: 0.4) : AppColors.ink.withValues(alpha: 0.08)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 2),
              width: 20,
              height: 20,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.pinBlue : null,
                border: Border.all(color: selected ? AppColors.pinBlue : AppColors.ink.withValues(alpha: 0.3), width: 2),
              ),
              child: selected ? const AppIconView(AppIcon.check, size: 12, color: Colors.white, strokeWidth: 3) : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                  const SizedBox(height: 2),
                  Text(hint, style: const TextStyle(fontSize: 12, height: 16 / 12, color: AppColors.muted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
