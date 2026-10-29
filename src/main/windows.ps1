# Watches the top-level windows so Capri can sit on them.
# Prints one JSON line whenever something changes: the foreground window and the visible
# windows in z-order (front first), as physical-pixel frame bounds. No titles, no contents.
#
#   powershell -File windows.ps1 <capri hwnd> <capri pid>

param([long]$Self = 0, [int]$ParentPid = 0)
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Diagnostics;

public static class CapriWindows {
  delegate bool EnumProc(IntPtr hwnd, IntPtr lParam);

  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }

  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string title);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hwnd);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr hwnd);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr hwnd, int index);
  [DllImport("user32.dll")] static extern int GetClassName(IntPtr hwnd, StringBuilder name, int max);
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr hwnd, int attr, out RECT value, int size);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr hwnd, int attr, out int value, int size);

  const int GWL_EXSTYLE = -20;
  const int WS_EX_TOOLWINDOW = 0x80;
  const int WS_EX_NOACTIVATE = 0x08000000;
  const int DWMWA_EXTENDED_FRAME_BOUNDS = 9;
  const int DWMWA_CLOAKED = 14;

  public static void Init() {
    SetProcessDpiAwarenessContext(new IntPtr(-4)); // per-monitor v2: real pixels everywhere
  }

  public static long DesktopList() {
    IntPtr list = IntPtr.Zero;
    EnumWindows((h, l) => {
      var view = FindWindowEx(h, IntPtr.Zero, "SHELLDLL_DefView", null);
      if (view == IntPtr.Zero) return true;
      list = FindWindowEx(view, IntPtr.Zero, "SysListView32", null);
      return list == IntPtr.Zero;
    }, IntPtr.Zero);
    return list != IntPtr.Zero && IsWindowVisible(list) ? list.ToInt64() : 0;
  }

  public static string Snapshot(long self, int parentPid) {
    var sb = new StringBuilder();
    sb.Append("{\"fg\":").Append(GetForegroundWindow().ToInt64()).Append(",\"wins\":[");
    int count = 0;
    EnumWindows((h, l) => {
      if (count >= 40) return false;
      if (h.ToInt64() == self || !IsWindowVisible(h) || IsIconic(h)) return true;
      int ex = GetWindowLong(h, GWL_EXSTYLE);
      if ((ex & WS_EX_TOOLWINDOW) != 0 || (ex & WS_EX_NOACTIVATE) != 0) return true;
      int cloaked;
      if (DwmGetWindowAttribute(h, DWMWA_CLOAKED, out cloaked, 4) == 0 && cloaked != 0) return true;
      var cls = new StringBuilder(64);
      GetClassName(h, cls, 64);
      string c = cls.ToString();
      if (c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd" || c == "Shell_SecondaryTrayWnd") return true;
      RECT r;
      if (DwmGetWindowAttribute(h, DWMWA_EXTENDED_FRAME_BOUNDS, out r, 16) != 0) return true;
      if (r.Right - r.Left < 200 || r.Bottom - r.Top < 120) return true;
      if (count > 0) sb.Append(',');
      count++;
      string kind = "", context = "";
      uint windowPid; GetWindowThreadProcessId(h, out windowPid);
      try {
        string name = Process.GetProcessById((int)windowPid).ProcessName.ToLowerInvariant();
        if(name=="cyberpunk2077")context="cyberpunk";
        else if(name=="blender"||name=="robloxstudiobeta"||name=="robloxstudio")context="creator";
        else if(name=="spotify"||name=="musicbee"||name=="foobar2000")context="music";
        else if(name=="league of legends"||name=="leagueclientux")context="league";
        if (windowPid == parentPid) kind = "capri";
        else if (name == "codex" || name == "chatgpt") kind = "codex";
        else if (name == "explorer") kind = "explorer";
        else if (name == "league of legends" || name == "valorant-win64-shipping"
          || name == "robloxplayerbeta" || name == "brawlhalla" || name == "osu!"
          || name == "celeste" || name == "polaris-win64-shipping" || name == "tekken 8"
          || name == "monsterhunterworld" || name == "gmod" || name == "hl2"
          || name == "ultrakill" || name == "cyberpunk2077" || name == "thefirstberserker"
          || name == "bbq-win64-shipping" || name == "khazan-win64-shipping") kind = "game";
      } catch {}
      sb.Append("{\"kind\":\"").Append(kind).Append("\",\"id\":").Append(h.ToInt64())
        .Append(",\"context\":\"").Append(context).Append("\"")
        .Append(",\"x\":").Append(r.Left).Append(",\"y\":").Append(r.Top)
        .Append(",\"w\":").Append(r.Right - r.Left).Append(",\"h\":").Append(r.Bottom - r.Top)
        .Append(",\"max\":").Append(IsZoomed(h) ? "true" : "false").Append('}');
      return true;
    }, IntPtr.Zero);
    sb.Append("]}");
    return sb.ToString();
  }
}
"@

[CapriWindows]::Init()
Add-Type -AssemblyName Accessibility
Add-Type -ReferencedAssemblies 'Accessibility' -IgnoreWarnings -WarningAction SilentlyContinue -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
using Accessibility;
public static class CapriDesktopIcons {
  [DllImport("oleacc.dll")]
  static extern int AccessibleObjectFromWindow(IntPtr hwnd, uint id, ref Guid iid,
    [MarshalAs(UnmanagedType.Interface)] out IAccessible accessible);
  public static string Read(long handle) {
    if (handle == 0) return "[]";
    IAccessible accessible = null;
    try {
      Guid iid = new Guid("618736E0-3C3D-11CF-810C-00AA00389B71");
      if (AccessibleObjectFromWindow(new IntPtr(handle), 0xFFFFFFFC, ref iid, out accessible) != 0) return "[]";
      var json = new StringBuilder("[");
      int count = 0;
      for (int i = 1; i <= Math.Min(accessible.accChildCount, 300); i++) {
        try {
        int state = Convert.ToInt32(accessible.get_accState(i));
        if ((state & 0x18000) != 0) continue;
        int x, y, w, h; accessible.accLocation(out x, out y, out w, out h, i);
        if (w <= 0 || h <= 0) continue;
        if (count++ > 0) json.Append(',');
        json.Append("{\"id\":\"icon:").Append(handle).Append(':').Append(i)
          .Append("\",\"kind\":\"desktop-icon\",\"x\":").Append(x).Append(",\"y\":").Append(y)
          .Append(",\"w\":").Append(w).Append(",\"h\":").Append(h).Append(",\"max\":false}");
        } catch (ArgumentException) { } catch (COMException) { }
      }
      return json.Append(']').ToString();
    } catch { return "[]"; }
    finally { if (accessible != null) Marshal.ReleaseComObject(accessible); }
  }
}
"@

function DesktopIcons {
  try {
    return [CapriDesktopIcons]::Read([CapriWindows]::DesktopList())
  } catch { return '[]' } # Explorer may restart or hide its icons.
}

$last = ''
$tick = 0
$icons = '[]'
while ($true) {
  if ($tick % 12 -eq 0) { $icons = DesktopIcons }
  $snap = [CapriWindows]::Snapshot($Self, $ParentPid)
  $snap = $snap.Substring(0, $snap.Length - 1) + ',"icons":' + $icons + '}'
  if ($snap -ne $last -or $tick % 12 -eq 0) {
    [Console]::Out.WriteLine($snap)
    [Console]::Out.Flush()
    $last = $snap
  }
  # stop with Capri, even if she crashed without telling us
  $tick++
  if ($ParentPid -and ($tick % 20 -eq 0) -and -not (Get-Process -Id $ParentPid -ErrorAction SilentlyContinue)) { break }
  Start-Sleep -Milliseconds 150
}
