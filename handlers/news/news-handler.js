const fs = require('fs');
const mime = require('mime-types');
const systempath = require('path');

const arrObj = require('../../utils/array-object');

const SQLiteDAO = require('../../db/sqlite3/sqlite-dao');

const dbFile = './db/database/news-v1.db';
const db = new SQLiteDAO(dbFile);

class ResourceHandler {

    getMediaFile(req, res) {
        let path = req.pathName
        let params = path.substring('/site-manager/news/get-file/'.length);
        let fileRead = params.replace('/', systempath.sep);
        let contentType;

        if (mime.lookup(fileRead)) contentType = mime.lookup(fileRead);

        fs.readFile(fileRead, { flag: 'r' }, (error, data) => {
            if (!error) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(error));
            }
        });
    }

    getNewsList(req, res) {
        //req.user,
        //req.json_data.follows,
        //req.json_data.limit
        //req.json_data.offset
        let users = "";
        if (req.json_data.follows.length > 0) {
            req.json_data.follows.forEach(el => {
                users += (users === "" ? "" : ",") + "'" + el + "'";
            });
        }
        //console.log("users: ", users)
        db.getRsts("select *\
                    from news\
                    where user in ("+ users + ")\
                    order by time desc\
                    LIMIT "+ (req.json_data && req.json_data.limit ? req.json_data.limit : 6) + "\
                    OFFSET "+ (req.json_data && req.json_data.offset ? req.json_data.offset : 0) + "\
                    ")
            .then(results => {
                //lay file chi tiet tra cho nhom
                let detailsPromise = new Promise((resolve, reject) => {
                    if (!results || results.length === 0) {
                        resolve();
                    } else {
                        let countDetails = 0;
                        for (let idx = 0; idx < results.length; idx++) {
                            db.getRsts("select *\
                                from news_files\
                                where group_id = '"+ results[idx].group_id + "'\
                                ")
                                .then(files => {
                                    countDetails++;
                                    results[idx].medias = files;
                                    if (countDetails == results.length) {
                                        resolve();
                                    };
                                })
                                .catch(err => reject(err))
                        }
                    }
                })
                detailsPromise.then(data => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(results
                        , (key, value) => {
                            if (value === null) { return undefined; }
                            return value
                        }
                    ));
                })
                    .catch(err => {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(JSON.stringify(err));
                    })
            }).catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(JSON.stringify(err));
            })
    }

    postNewsFiles(req, res) {
        console.log("post: ", req.form_data)
        let groupId = req.form_data.params.group_id ? req.form_data.params.group_id : req.user.username + '-' + new Date().getTime();
        var count_max = req.form_data.params.count_file;
        let saveDb = new Promise((resolve, reject) => {
            let sqlInsertGroup = arrObj.convertSqlFromJson(
                "news",
                {
                    group_id: groupId
                    , content: req.form_data.params.content ? req.form_data.params.content : ""
                    , share_status: req.form_data.params.share_status
                    , title: req.form_data.params.title
                    , user: req.user.username
                    , time: new Date().getTime()
                }
            );
            db.insert(sqlInsertGroup)
                .then(data => {
                    if (count_max > 0) {
                        for (let key in req.form_data.files) {
                            let sqlInsert = arrObj.convertSqlFromJson(
                                "news_files",
                                {
                                    group_id: groupId
                                    , url: req.form_data.files[key].url
                                    , file_name: req.form_data.files[key].file_name
                                    , file_type: req.form_data.files[key].file_type
                                    , file_date: req.form_data.params['origin_date_' + key]
                                    , file_size: req.form_data.files[key].file_size
                                    , user: req.user.username
                                    , time: new Date().getTime()
                                }
                                , ["url"]
                            );
                            db.insert(sqlInsert)
                                .then(data1 => {
                                    resolve(data1);
                                })
                                .catch(err => {
                                    if (err.code === "SQLITE_CONSTRAINT") {
                                        db.update(sqlInsert)
                                            .then(data2 => {
                                                resolve(data2);
                                            })
                                            .catch(err1 => {
                                                reject(err1);
                                            })
                                    } else {
                                        reject(err);
                                    }
                                })
                        }
                    } else {
                        resolve("insert news without any file")
                    }
                })
                .catch(err => reject(err))
        })
        saveDb.then(data => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
        })
            .catch(err => {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: err, message: "error insert db" }));
            })
    }
}

module.exports = {
    ResourceHandler: new ResourceHandler()
};