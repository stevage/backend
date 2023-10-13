import express from 'express';
const app = express();
import db from './db.js';
import { mkConfig, generateCsv } from 'export-to-csv';
app.use(express.json());
import cors from 'cors';
app.use(cors());
// 1

const csvConfig = mkConfig({ useKeysAsHeaders: true });

app.router.post('/event', async (req, res) => {
    const b = req.body;
    console.log(`#${b.gamenumber}`, b.event, b.guesscount, b.data?.guess || '');
    if (!b || !b.site || !b.event || !b.gamenumber) {
        console.log('bad request');
        res.sendStatus(400);
        return;
    }
    const params = [
        String(b.site),
        Date.now(),
        String(b.event),
        +b.gamenumber,
        String(b.target),
        +b.guesscount,
        JSON.stringify(b.data),
        JSON.stringify(b.options),
        String(b.sessionid),
    ];
    //console.log(params);
    try {
        await db().run(
            `INSERT INTO events (site, time, type, gamenumber, target, guesscount, data,options,sessionid) VALUES (?, ?, ?, ?,?,?,?,?,?)`,
            ...params
        );
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

const getPlays = async () =>
    await db().all(
        `SELECT * FROM events WHERE type = 'giveup' OR type = 'win' ORDER BY time ASC`
    );

app.router.get('/plays.csv', async (req, res) => {
    res.type('text/csv').send(generateCsv(csvConfig)(await getPlays()));
});

app.router.get('/plays', async (req, res) => {
    console.log(await getPlays());
    res.json(await getPlays());
});

app.router.get('/stats', async (req, res) => {
    const stats = await db().all(
        `SELECT site, type, gamenumber,  count(*) as count,
            (SELECT count(*) as wincount FROM events e WHERE e.type='win' AND e.gamenumber=ev.gamenumber) as wincount,
            round(AVG(guesscount),1) as avgguesscount,
            round(AVG(json_extract(data, '$.hintCount')), 1) as avghintcount

        FROM events ev
        WHERE type='win' OR type='giveup'
        GROUP BY gamenumber, target, site
        `
    );
    res.json(stats);
});

app.router.get('/all', async (req, res) => {
    res.json(await db().all(`SELECT * FROM events`));
});

app.router.get('/stations', async (req, res) => {
    const stations = await db().all(
        `SELECT json_extract(data, '$.guess') as station, count(*) as count
        FROM events
        WHERE type='guess'
        GROUP BY station
        ORDER BY count DESC`
    );
    res.json(stations);
});

app.router.get('/first-guesses', async (req, res) => {
    const stations = await db().all(
        `SELECT json_extract(data, '$.guess') as station, count(*) as count
        FROM events
        WHERE type='first-guess'
        GROUP BY station
        ORDER BY count DESC`
    );
    res.json(stations);
});

app.router.get('/', (req, res) => {
    res.send('Backend for https://stevage.github.io/trainle');
});

app.listen(process.env.PORT || 3080);
console.log('runningl');
