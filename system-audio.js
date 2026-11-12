// Read and change the system speaker volume/mute on Windows, so Focus Pocus can
// warn when alerts would be silent and (if the user opts in) unmute for an alert.
//
// Uses Windows Core Audio through a small PowerShell + C# shim, so no native
// npm module has to be rebuilt for Electron. Each call takes about a second.
// On other platforms every function resolves to null ("unknown").
const { execFile } = require('child_process');

const TYPES = `
using System; using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int f(); int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class FPAudio {
  static IAudioEndpointVolume Vol() {
    var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice d = null; Marshal.ThrowExceptionForHR(e.GetDefaultAudioEndpoint(0, 1, out d));
    IAudioEndpointVolume v = null; var id = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(d.Activate(ref id, 23, 0, out v)); return v;
  }
  public static float GetVolume() { float x; Marshal.ThrowExceptionForHR(Vol().GetMasterVolumeLevelScalar(out x)); return x; }
  public static bool GetMute() { bool m; Marshal.ThrowExceptionForHR(Vol().GetMute(out m)); return m; }
  public static void SetVolume(float x) { Marshal.ThrowExceptionForHR(Vol().SetMasterVolumeLevelScalar(x, Guid.Empty)); }
  public static void SetMute(bool m) { Marshal.ThrowExceptionForHR(Vol().SetMute(m, Guid.Empty)); }
}`;

function run(action) {
  if (process.platform !== 'win32') return Promise.resolve(null);
  const script =
    `Add-Type -TypeDefinition @'\n${TYPES}\n'@\n${action}\n` +
    `'{"muted":' + ([FPAudio]::GetMute()).ToString().ToLower() + ',"volume":' + [FPAudio]::GetVolume().ToString([Globalization.CultureInfo]::InvariantCulture) + '}'`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise(resolve => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      { windowsHide: true, timeout: 10000 },
      (err, stdout) => {
        if (err) { console.error('[Audio]', err.message); resolve(null); return; }
        try { resolve(JSON.parse(stdout.trim().split(/\r?\n/).pop())); }
        catch (e) { console.error('[Audio] Unexpected output:', stdout); resolve(null); }
      });
  });
}

// -> { muted: boolean, volume: 0..1 } or null if unknown
function getAudio() {
  return run('');
}

// Apply { muted?, volume? } and return the new state (or null)
function setAudio({ muted, volume } = {}) {
  const lines = [];
  if (typeof volume === 'number' && volume >= 0 && volume <= 1) {
    lines.push(`[FPAudio]::SetVolume([single]${volume.toFixed(3)})`);
  }
  if (typeof muted === 'boolean') {
    lines.push(`[FPAudio]::SetMute($${muted})`);
  }
  return run(lines.join('\n'));
}

module.exports = { getAudio, setAudio };
