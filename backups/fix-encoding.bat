@echo off
chcp 65001 >nul
echo 修复文件编码...

:: 使用 PowerShell 进行编码转换
powershell -Command "
$utf8 = [System.Text.Encoding]::UTF8;
$latin1 = [System.Text.Encoding]::GetEncoding('ISO-8859-1');

:: 读取文件字节
$bytes = [System.IO.File]::ReadAllBytes('F:\openclaw-backups\admin-system_before-reimport_2026-04-01_16-49-47\admin.html');

:: 跳过 BOM
$start = 0;
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $start = 3;
}

:: 提取内容字节
$contentBytes = New-Object byte[] ($bytes.Length - $start);
[System.Array]::Copy($bytes, $start, $contentBytes, 0, $contentBytes.Length);

:: 使用 BinaryReader 来避免字符丢失
$ms = New-Object System.IO.MemoryStream(,$contentBytes);
$reader = New-Object System.IO.BinaryReader($ms);
$allBytes = $reader.ReadBytes($contentBytes.Length);
$reader.Close();

:: 将字节作为 Latin1 字符读取
$mangled = $latin1.GetString($allBytes);

:: 将 Latin1 字符串转回字节（这就是原始 UTF-8 字节）
$originalUtf8Bytes = $latin1.GetBytes($mangled);

:: 保存为 UTF-8 文件（无 BOM）
[System.IO.File]::WriteAllBytes('C:\Users\86973\Desktop\游戏盒子后台\admin.html', $originalUtf8Bytes);

Write-Host '文件编码修复完成！';
"

echo 完成！
pause
