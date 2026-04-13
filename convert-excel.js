const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 读取Excel文件
const excelPath = process.argv[2];
if (!excelPath) {
    console.error('请提供Excel文件路径');
    process.exit(1);
}

console.log('读取Excel文件:', excelPath);

if (!fs.existsSync(excelPath)) {
    console.error('文件不存在:', excelPath);
    process.exit(1);
}

const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('读取到', data.length, '条数据');

// 转换为GameBox-Client格式
const games = data.map((row, index) => {
    const now = new Date();
    const updateDate = now.toISOString().split('T')[0];
    const updateTime = now.getTime();
    
    return {
        id: index + 1,
        cn: row['游戏名称'] || '',
        en: row['英文名'] || '',
        cover: `https://picsum.photos/800/600?${index + 1}`,
        type: row['游戏类型'] || '未分类',
        size: '',
        update: updateDate,
        updateTime: updateTime,
        hot: Math.floor(Math.random() * 5000) + 1000,
        desc: '',
        link1: row['百度网盘下载地址1'] || '',
        link2: row['百度网盘下载地址2'] || '',
        link3: row['迅雷云盘下载地址'] || ''
    };
});

// 输出到GameBox-Client目录
const outputPath = path.join(__dirname, 'game-data.json');
fs.writeFileSync(outputPath, JSON.stringify(games, null, 4));

console.log('转换完成！已保存到:', outputPath);
console.log('共导入', games.length, '款游戏');
