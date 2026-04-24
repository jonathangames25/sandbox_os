using System;
using System.Runtime.InteropServices;

class MouseController {
    [DllImport("user32.dll")]
    static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);

    private const int MOUSEEVENTF_LEFTDOWN = 0x02;
    private const int MOUSEEVENTF_LEFTUP = 0x04;

    static void Main(string[] args) {
        string line;
        while ((line = Console.ReadLine()) != null) {
            string[] parts = line.Split(' ');
            if (parts.Length > 0) {
                if (parts[0] == "MOVE" && parts.Length == 3) {
                    int x, y;
                    if (int.TryParse(parts[1], out x) && int.TryParse(parts[2], out y)) {
                        SetCursorPos(x, y);
                    }
                } else if (parts[0] == "DOWN") {
                    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
                } else if (parts[0] == "UP") {
                    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
                }
            }
        }
    }
}
