Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\86973\Desktop\GameBox-Client\app-icon.png"
$outputPath = "C:\Users\86973\Desktop\GameBox-Client\app-icon-new.png"

Write-Host "正在压缩图标..."

# 加载原图
$image = [System.Drawing.Image]::FromFile($inputPath)
Write-Host "原始尺寸: $($image.Width)x$($image.Height)"
Write-Host "原始大小: $([math]::Round((Get-Item $inputPath).Length / 1MB, 2)) MB"

# 创建 256x256 的新图（足够用于图标）
$newSize = 256
$bitmap = New-Object System.Drawing.Bitmap($newSize, $newSize)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.DrawImage($image, 0, 0, $newSize, $newSize)

# 保存为 PNG
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 清理资源
$graphics.Dispose()
$bitmap.Dispose()
$image.Dispose()

# 替换原文件
Move-Item $outputPath $inputPath -Force

$newSize = [math]::Round((Get-Item $inputPath).Length / 1KB, 2)
Write-Host "压缩后大小: $newSize KB"
Write-Host "✅ 图标压缩完成！"
