const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressIcon() {
  const inputPath = path.join(__dirname, 'app-icon.png');
  const outputPath = path.join(__dirname, 'app-icon-compressed.png');
  
  try {
    console.log('正在压缩图标...');
    
    // 获取原始图片信息
    const metadata = await sharp(inputPath).metadata();
    console.log(`原始尺寸: ${metadata.width}x${metadata.height}`);
    console.log(`原始大小: ${(fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // 压缩：调整尺寸为 512x512（对于图标足够大），使用高质量压缩
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'inside',
        withoutEnlargement: false
      })
      .png({
        quality: 85,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(outputPath);
    
    const compressedSize = fs.statSync(outputPath).size;
    console.log(`压缩后大小: ${(compressedSize / 1024).toFixed(2)} KB`);
    
    // 如果压缩成功且小于 500KB，替换原文件
    if (compressedSize < 500 * 1024) {
      fs.renameSync(outputPath, inputPath);
      console.log('✅ 图标压缩成功！');
    } else {
      console.log('⚠️ 压缩后仍大于 500KB，尝试进一步压缩...');
      
      // 进一步压缩
      await sharp(inputPath)
        .resize(256, 256, {
          fit: 'inside'
        })
        .png({
          quality: 80,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      const finalSize = fs.statSync(outputPath).size;
      console.log(`最终大小: ${(finalSize / 1024).toFixed(2)} KB`);
      
      fs.renameSync(outputPath, inputPath);
      console.log('✅ 图标压缩完成！');
    }
    
    // 删除旧的 icon.png（如果存在且与 app-icon.png 相同）
    const iconPath = path.join(__dirname, 'icon.png');
    if (fs.existsSync(iconPath)) {
      // 检查是否为同一文件（通过比较文件大小）
      const appIconSize = fs.statSync(inputPath).size;
      const iconSize = fs.statSync(iconPath).size;
      
      if (Math.abs(appIconSize - iconSize) < 1024) { // 大小相近则认为是重复
        fs.unlinkSync(iconPath);
        console.log('✅ 删除了重复的 icon.png');
      } else {
        console.log('ℹ️ icon.png 与 app-icon.png 不同，保留两者');
      }
    }
    
  } catch (error) {
    console.error('压缩失败:', error);
    process.exit(1);
  }
}

compressIcon();
