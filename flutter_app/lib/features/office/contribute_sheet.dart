import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/contributions_repository.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';
import '../auth/sign_in_sheet.dart';
import '../../data/auth_controller.dart';
import 'visit_dialog.dart';

/// Port of src/components/contribute/ContributeForm.tsx +
/// ContributeSheet.tsx, merged into one sheet since Flutter's showAppSheet
/// already provides the header/close-button chrome ContributeSheet.tsx hand-built.
Future<void> showContributeSheet(BuildContext context, {required PostOffice office}) {
  final auth = authControllerOf(context);
  if (auth.user == null) {
    return showSignInSheet(context, reason: SignInReason.manual);
  }
  return showAppSheet<void>(
    context,
    title: 'Contribute',
    builder: (sheetContext) => _ContributeForm(office: office),
  );
}

const _options = <(ContributionType, String, String)>[
  (ContributionType.betterStampImage, 'Better stamp photo', "Share a clearer photo of this office's PPC stamp"),
  (ContributionType.coordinatesCorrection, 'Fix location pin', 'The map pin is in the wrong place'),
  (ContributionType.officeInfoUpdate, 'Update office info', 'Name, pincode or district is wrong'),
  (ContributionType.newOfficeSuggestion, 'Suggest a new office', 'This post office should be on Philatrail'),
];

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
    final file = await ImagePicker().pickImage(source: ImageSource.camera, maxWidth: 1600, maxHeight: 1600, imageQuality: 82);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() => _photoBytes = bytes);
  }

  Future<void> _submit() async {
    final type = _selected;
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (type == null || userId == null) return;
    setState(() => _state = _SubmitState.loading);
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
      await Future<void>.delayed(const Duration(milliseconds: 1400));
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
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, color: AppColors.visited, size: 48),
            SizedBox(height: 12),
            Text('Thanks for your help!', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            SizedBox(height: 6),
            Text("We'll review your contribution and update the app.",
                textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
          ],
        ),
      );
    }

    final photoRelevant = _selected == ContributionType.betterStampImage || _selected == ContributionType.newOfficeSuggestion;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(widget.office.name, style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 12),
        const Text('What would you like to contribute?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 6),
        RadioGroup<ContributionType>(
          groupValue: _selected,
          onChanged: (v) => setState(() => _selected = v),
          child: Column(
            children: [
              for (final (type, label, hint) in _options)
                RadioListTile<ContributionType>(
                  value: type,
                  title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: Text(hint, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  contentPadding: EdgeInsets.zero,
                ),
            ],
          ),
        ),
        if (photoRelevant) ...[
          const SizedBox(height: 8),
          const Text('Photo (optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 6),
          if (_photoBytes != null)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.memory(_photoBytes!, height: 140, fit: BoxFit.cover),
                ),
                Positioned(
                  right: 6,
                  top: 6,
                  child: IconButton(
                    onPressed: () => setState(() => _photoBytes = null),
                    icon: const Icon(Icons.close),
                    style: IconButton.styleFrom(backgroundColor: Colors.white, minimumSize: const Size(28, 28)),
                  ),
                ),
              ],
            )
          else
            OutlinedButton.icon(
              onPressed: _pickPhoto,
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text('Attach a photo'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(64)),
            ),
        ],
        const SizedBox(height: 12),
        const Text('Note (optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(height: 6),
        TextField(
          controller: _noteController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Any extra detail that helps us review your contribution…',
            border: OutlineInputBorder(),
          ),
        ),
        if (_state == _SubmitState.error) ...[
          const SizedBox(height: 10),
          Text(_errorMsg, style: const TextStyle(color: AppColors.postalDark)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _selected == null || _state == _SubmitState.loading ? null : _submit,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.ink,
            minimumSize: const Size.fromHeight(56),
            shape: const StadiumBorder(),
          ),
          child: Text(_state == _SubmitState.loading ? 'Sending…' : 'Send contribution'),
        ),
      ],
    );
  }
}
