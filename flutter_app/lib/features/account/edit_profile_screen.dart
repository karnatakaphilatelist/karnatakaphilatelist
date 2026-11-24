import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../theme/app_theme.dart';

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
    final current = (user?.userMetadata?['full_name'] as String?) ?? '';
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
    return Scaffold(
      appBar: AppBar(title: const Text('Your profile')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _nameController,
              maxLength: maxProfileName,
              onChanged: (_) => setState(() => _saved = false),
              decoration: const InputDecoration(labelText: 'Your name', border: OutlineInputBorder()),
            ),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.postalDark)),
            if (_saved)
              const Text('Saved.', style: TextStyle(color: AppColors.visitedInk, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _busy ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.postal,
                minimumSize: const Size.fromHeight(56),
                shape: const StadiumBorder(),
              ),
              child: Text(_busy ? 'Saving…' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }
}
