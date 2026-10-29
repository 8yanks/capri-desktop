'use strict';
// Codex's documented lifecycle events -> Capri's animation vocabulary.
// Never read transcripts or forward arbitrary tool arguments/output.
const EVENTS = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse',
  'PermissionRequest', 'Stop', 'Interrupt', 'PreCompact', 'SubagentStart', 'SubagentStop', 'SessionEnd'];
const clip = (value, limit = 180) => typeof value === 'string' ? value.slice(0, limit) : '';

function normalize(event) {
  if (!event || typeof event !== 'object' || !EVENTS.includes(event.hook_event_name)) return null;
  const out = { hook_event_name: event.hook_event_name, source_app: 'codex',
    session_id: clip(event.session_id, 100), cwd: clip(event.cwd, 500) };
  if (event.source) out.source = clip(event.source, 30);
  if (event.agent_type) out.agent_type = clip(event.agent_type, 60);
  if (event.hook_event_name === 'UserPromptSubmit') out.prompt = clip(event.prompt);
  if (event.hook_event_name === 'Stop') out.last_assistant_message = clip(event.last_assistant_message, 6000);
  if (event.hook_event_name === 'PermissionRequest') {
    out.hook_event_name = 'Notification';
    out.notification_type = 'permission_prompt';
    out.message = 'Codex is waiting for your approval in its own window.';
    // A decorative notification only: no permission decision is ever returned.
  }
  if (event.hook_event_name === 'PreToolUse' && /(?:^|__|\.)request_user_input(?:_async)?$/.test(event.tool_name || '')) {
    out.hook_event_name = 'Notification';
    out.notification_type = 'agent_needs_input';
    out.message = 'Codex has a question for you in its own window.';
  }
  if (event.tool_name) {
    out.tool_name = clip(event.tool_name, 120);
    const input = event.tool_input && typeof event.tool_input === 'object' ? event.tool_input : {};
    out.tool_input = {};
    if (event.tool_name === 'apply_patch') {
      const patch = typeof event.tool_input === 'string' ? event.tool_input : input.command;
      const paths = typeof patch === 'string' ? [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((m) => m[1].slice(0, 500)) : [];
      out.tool_name = 'Edit';
      out.tool_input.file_path = paths[0] || '';
      out.edited_files = paths.slice(0, 30);
    } else if (event.tool_name === 'Bash' || event.tool_name === 'exec_command') {
      out.tool_name = 'Bash';
      out.tool_input.description = clip(input.description, 90) || 'Runs a local command';
    } else if (event.tool_name === 'web_search') {
      out.tool_name = 'WebSearch';
      out.tool_input.query = clip(input.query, 100);
    } else if (typeof input.file_path === 'string') out.tool_input.file_path = clip(input.file_path, 500);
    if (event.hook_event_name === 'PostToolUse') {
      let response = event.tool_response;
      if (typeof response === 'string') {
        try { response = JSON.parse(response); } catch { response = {}; }
      }
      const code = response?.exit_code ?? response?.exitCode;
      if (response?.isError === true || response?.is_error === true || response?.error || (typeof code === 'number' && code !== 0)) {
        out.hook_event_name = 'PostToolUseFailure';
        out.error = 'The tool reported a failure. See the result in Codex.';
      } else return null; // successful tools were already counted by PreToolUse
    }
  }
  return out;
}
module.exports = { EVENTS, normalize };
