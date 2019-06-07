/**
 * Tao database sqlite from excel
 * file nay chay mot lan bang tay khi muon tao mot csdl bang file exel
 * Thuc hien doc cau truc file excel roi tao database ban dau
 * sau do cac service se lay de handle db sau
 */

const excel_db = require('./db/sqlite3/excel-sqlite-service');

const excelFilename = "./db/excel/ql-tram.cuongdq.sqlite.v8.xlsx"; //ten file excel cau hinh
const dbFilename = "./db/database/mlmt-site-manager-v8.db";     //ten database muon tao

excel_db.Excel2Sqlite.createDatabase(excelFilename, dbFilename);