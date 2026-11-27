/// Build-time config. The Supabase URL and publishable key are public by
/// design (the web app ships the same pair in every page), so they default
/// here; without a default, a build made without --dart-define (the CI
/// release workflow) started with no backend at all. An empty define counts
/// as unset.
const String _urlDefine = String.fromEnvironment('SUPABASE_URL');
const String _keyDefine = String.fromEnvironment('SUPABASE_ANON_KEY');

const String supabaseUrl =
    _urlDefine == '' ? 'https://yboveezqovgvphvpeelq.supabase.co' : _urlDefine;
const String supabaseAnonKey =
    _keyDefine == '' ? 'sb_publishable_TL6E_mR_zx_RXF0lZaHoEA_Va4wmREY' : _keyDefine;
