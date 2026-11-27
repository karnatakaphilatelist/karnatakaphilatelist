import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app_shell.dart' show AppTabBar;
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/account_avatar.dart' show displayName;
import '../auth/sign_in_sheet.dart';
import '../../data/auth_controller.dart' show SignInReason;

const int maxProfileName = 60;

/// Port of src/components/auth/EditProfileView.tsx.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _nameController;
  bool _busy = false;
  String? _error;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    final user = Supabase.instance.client.auth.currentUser;
    final current = user == null ? '' : (displayName(user) ?? '');
    _nameController = TextEditingController(text: current);
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final value = _nameController.text.trim();
    if (value.isEmpty) {
      setState(() => _error = 'Please enter a name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(data: {'full_name': value.substring(0, value.length.clamp(0, maxProfileName))}),
      );
      if (!mounted) return;
      setState(() {
        _busy = false;
        _saved = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Could not save your name. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).padding;
    final user = Supabase.instance.client.auth.currentUser;
    return Scaffold(
      backgroundColor: AppColors.paper,
      bottomNavigationBar: const AppTabBar(index: 3),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, insets.top + 24, 16, 40),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => Navigator.of(context).maybePop(),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 44),
                    alignment: Alignment.centerLeft,
                    child: const Text('← Account', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.muted)),
                  ),
                ),
                const SizedBox(height: 8),
                Transform.translate(
                  offset: const Offset(-2, 0),
                  child: const Text('YOUR PROFILE',
                      style: TextStyle(fontSize: 48, height: 52 / 48, fontWeight: FontWeight.w500, letterSpacing: 0.48, color: AppColors.ink)),
                ),
                const SizedBox(height: 16),
                GlassCard(
                  borderRadius: BorderRadius.circular(18),
                  padding: const EdgeInsets.all(20),
                  child: user == null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Sign in to edit your profile.', style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                            const SizedBox(height: 16),
                            GestureDetector(
                              onTap: () => showSignInSheet(context, reason: SignInReason.manual),
                              child: Container(
                                constraints: const BoxConstraints(minHeight: 44),
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
                                child: const Center(
                                  widthFactor: 1,
                                  child: Text('Sign in', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                                ),
                              ),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text('Your name', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                            const SizedBox(height: 4),
                            ProfileTextField(
                              controller: _nameController,
                              maxLength: maxProfileName,
                              onChanged: (_) => setState(() => _saved = false),
                            ),
                            if (_error != null) ...[
                              const SizedBox(height: 8),
                              Text(_error!, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.warn)),
                            ],
                            if (_saved) ...[
                              const SizedBox(height: 8),
                              const Text('Saved.', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.visitedInk)),
                            ],
                            const SizedBox(height: 16),
                            GestureDetector(
                              onTap: _busy ? null : _save,
                              child: Opacity(
                                opacity: _busy ? 0.6 : 1,
                                child: Container(
                                  constraints: const BoxConstraints(minHeight: 62),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(999),
                                    gradient: const LinearGradient(
                                        begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.postalTop, AppColors.postal]),
                                  ),
                                  child: Text(_busy ? 'SAVING…' : 'SAVE',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 16 * 0.12, color: Colors.white)),
                                ),
                              ),
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// `min-h-12 rounded-xl border border-line-strong bg-white px-4 text-base`.
class ProfileTextField extends StatelessWidget {
  final TextEditingController controller;
  final int? maxLength;
  final bool obscure;
  final ValueChanged<String>? onChanged;
  const ProfileTextField({super.key, required this.controller, this.maxLength, this.obscure = false, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: TextField(
        controller: controller,
        obscureText: obscure,
        onChanged: onChanged,
        inputFormatters: maxLength == null ? null : [LengthLimitingTextInputFormatter(maxLength)],
        cursorColor: AppColors.ink,
        style: const TextStyle(fontSize: 16, color: AppColors.ink),
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lineStrong)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.ink, width: 2)),
        ),
      ),
    );
  }
}
