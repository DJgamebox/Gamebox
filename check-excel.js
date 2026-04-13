const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 读取Excel文件
const excelPath = process.argv[2] || '游戏列表2026年3月23.xlsx';
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
console.log('\n列名:', Object.keys(data[0] || {}));
console.log('\n第一条数据:');
console.log(JSON.stringify(data[0], null, 2));
