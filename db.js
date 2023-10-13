import fs from 'fs';
const filename = './events.db';
const exists = fs.existsSync(filename);
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
// try {
//     fs.mkdirSync('data');
// } catch (e) {}
let db;
// const db = new sqlite3.Database(filename);
open({
    filename,
    driver: sqlite3.Database,
}).then(async (newdb) => {
    db = newdb;
    if (!exists) {
        try {
            await db.run(`CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site TEXT,
        time INTEGER,
        type TEXT,
        gamenumber INTEGER,
        target TEXT,
        guesscount INTEGER,
        data TEXT,
        options TEXT,
        sessionid TEXT
      )`);
            console.log('Created events table');
        } catch (e) {
            console.log('no');
            console.error(e);
        }
    } else {
        const { count } = await db.get('select count(*) as count from events');
        console.log(`Database opened. ${count} events already recorded.`);
    }
});
console.log(db);
export default () => db;
