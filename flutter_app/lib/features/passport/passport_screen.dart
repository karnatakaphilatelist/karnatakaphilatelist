import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/office_status.dart';
import '../../core/states.dart';
import '../../data/state_controller.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../explore/explore_screen.dart';
import '../office/visit_dialog.dart';
import 'district_progress.dart';
import 'share_progress_sheet.dart';
import 'stamp_detail_sheet.dart';

enum _StampFilter { all, stamped, togo }

/// Port of src/components/passport/PassportView.tsx: progress header with
/// state switcher, "up next", "your stamps" (+ full "see all" view), and
/// district progress. Stale note from an earlier stage removed: there is no
/// sign-in stub here, and none is needed — GuestSignInNudge (wrapping the
/// whole app shell) already prompts guests on a timer, and Account has a
/// manual "sign in" button, so this screen doesn't need its own.
class PassportScreen extends StatefulWidget {
  const PassportScreen({super.key});

  @override
  State<PassportScreen> createState() => _PassportScreenState();
}

class _PassportScreenState extends State<PassportScreen> {
  bool _showAll = false;
  _StampFilter _stampFilter = _StampFilter.all;

  @override
  Widget build(BuildContext context) {
    final officesController = officesControllerOf(context);
    final stateController = stateControllerOf(context);
    final visitsController = visitsControllerOf(context);

    return AnimatedBuilder(
      animation: Listenable.merge([officesController, stateController, visitsController]),
      builder: (context, _) {
        if (officesController.loading || !visitsController.isReady) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final states = stateController.statesFor(officesController.offices);
        final stateCode = stateController.stateCodeFor(officesController.offices);
        final stateOffices = stateController.officesFor(officesController.offices);
        final offices = withStatus(
          stateOffices,
          visitsController.visits,
          visitsController.plannedIds,
          null,
        );
        final total = offices.length;
        final visited = offices.where((o) => visitsController.visits.containsKey(o.id)).toList();
        final upNext = offices.where((o) => !visitsController.visits.containsKey(o.id)).take(3).toList();

        if (_showAll) {
          return _buildShowAll(context, offices, visited, total, stateCode);
        }
        return _buildMain(context, offices, visited, upNext, total, states, stateCode, stateController);
      },
    );
  }

  Widget _buildMain(
    BuildContext context,
    List<OfficeWithStatus> offices,
    List<OfficeWithStatus> visited,
    List<OfficeWithStatus> upNext,
    int total,
    List<StateOption> states,
    String stateCode,
    StateController stateController,
  ) {
    final toGo = total - visited.length;
    final percent = total > 0
        ? (visited.length / total * 100).clamp(visited.isNotEmpty ? 4 : 0, 100).toDouble()
        : 0.0;

    return Scaffold(
      backgroundColor: AppColors.paper,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.postal,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 24, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('MY PASSPORT',
                          style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.4)),
                      const SizedBox(width: 14),
                      Container(width: 1, height: 14, color: Colors.white38),
                      const SizedBox(width: 14),
                      TextButton(
                        style: TextButton.styleFrom(padding: EdgeInsets.zero, foregroundColor: Colors.white),
                        onPressed: () => showShareProgressSheet(
                          context,
                          stamped: visited.length,
                          total: total,
                          stateName: stateName(stateCode),
                          onResult: (_) {},
                        ),
                        child: const Text('SHARE PROGRESS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.4)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: stateCode,
                      dropdownColor: AppColors.card,
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w600),
                      iconEnabledColor: Colors.white,
                      isExpanded: true,
                      items: states
                          .map((s) => DropdownMenuItem(value: s.code, child: Text(s.name.toUpperCase())))
                          .toList(),
                      onChanged: (code) {
                        if (code != null) stateController.choose(code);
                      },
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${visited.length} of $total',
                    style: const TextStyle(
                      color: Color(0xFFF7C96B),
                      fontWeight: FontWeight.bold,
                      fontStyle: FontStyle.italic,
                      fontSize: 20,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: percent / 100,
                      minHeight: 4,
                      backgroundColor: Colors.white24,
                      valueColor: const AlwaysStoppedAnimation(Color(0xFFF7C96B)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text('$toGo TO GO',
                        style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.6)),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                if (upNext.isNotEmpty) ...[
                  const _SectionHeading('Up next'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: upNext
                        .map((o) => Chip(
                              label: Text(o.name),
                              backgroundColor: AppColors.card,
                              side: BorderSide.none,
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 28),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const _SectionHeading('Your stamps'),
                    TextButton(
                      onPressed: () => setState(() => _showAll = true),
                      child: const Text('See all', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (visited.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      children: [
                        const Text('No stamps yet. Find a post office and tap Stamp it.', textAlign: TextAlign.center),
                        const SizedBox(height: 14),
                        FilledButton(
                          style: FilledButton.styleFrom(backgroundColor: AppColors.postal, shape: const StadiumBorder()),
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const ExploreScreen()),
                          ),
                          child: const Text('Open the map'),
                        ),
                      ],
                    ),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      childAspectRatio: 0.9,
                    ),
                    itemCount: visited.length > 6 ? 6 : visited.length,
                    itemBuilder: (context, i) {
                      final office = visited[i];
                      return GestureDetector(
                        onTap: () => showStampDetailSheet(context, office: office),
                        child: Column(
                          children: [
                            Expanded(
                              child: Stack(
                                children: [
                                  Container(
                                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
                                  ),
                                  const Positioned(
                                    left: 10,
                                    top: 10,
                                    child: CircleAvatar(
                                      radius: 12,
                                      backgroundColor: AppColors.visited,
                                      child: Icon(Icons.check, size: 14, color: Colors.white),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(office.name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 28),
                const _SectionHeading('By district'),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(18)),
                  child: DistrictProgress(offices: stateController.officesFor(officesControllerOf(context).offices), visits: visitsControllerOf(context).visits),
                ),
                const SizedBox(height: 32),
                Center(
                  child: Text(
                    disclaimer,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShowAll(
    BuildContext context,
    List<OfficeWithStatus> offices,
    List<OfficeWithStatus> visited,
    int total,
    String stateCode,
  ) {
    final toGo = total - visited.length;
    final shown = switch (_stampFilter) {
      _StampFilter.stamped => visited,
      _StampFilter.togo => offices.where((o) => !visited.contains(o)).toList(),
      _StampFilter.all => offices,
    };

    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        backgroundColor: AppColors.paper,
        elevation: 0,
        leading: BackButton(onPressed: () => setState(() => _showAll = false)),
        title: const Text('Your stamps'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                ChoiceChip(
                  label: Text('All $total'),
                  selected: _stampFilter == _StampFilter.all,
                  onSelected: (_) => setState(() => _stampFilter = _StampFilter.all),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Text('Stamped ${visited.length}'),
                  selected: _stampFilter == _StampFilter.stamped,
                  onSelected: (_) => setState(() => _stampFilter = _StampFilter.stamped),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: Text('To go $toGo'),
                  selected: _stampFilter == _StampFilter.togo,
                  onSelected: (_) => setState(() => _stampFilter = _StampFilter.togo),
                ),
              ],
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.85,
              ),
              itemCount: shown.length,
              itemBuilder: (context, i) {
                final office = shown[i];
                final isVisited = visited.contains(office);
                return GestureDetector(
                  onTap: isVisited ? () => showStampDetailSheet(context, office: office) : null,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isVisited ? AppColors.card : null,
                      borderRadius: BorderRadius.circular(16),
                      border: isVisited
                          ? null
                          : Border.all(color: AppColors.lineStrong, style: BorderStyle.solid, width: 1.5),
                    ),
                    alignment: Alignment.center,
                    child: Text(office.name, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  final String text;
  const _SectionHeading(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.ink),
    );
  }
}
