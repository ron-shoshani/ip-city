var express = require('express');
var router = express.Router();
var path = require('path');
var csv = require('csv');
const fs = require('fs');
var parse = require('csv-parse');
var maxmind = require('maxmind');
var multer = require('multer');
var json2csv = require('json2csv');

var upload = multer({
  dest: path.join(__dirname, '/uploads')
}).any();


/* GET users listing. */
router.post('/' , function(req, res) {
    console.log(req);
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return
        }
        else {
            var fileLocation = req.files[0].path;
            console.log(req.files);

            fs.readFile(fileLocation, function (err, data) {
                console.log(data);
                parse(data, {columns: true, trim: true}, function (err, rows) {
                    console.log(rows);
                    maxmind.open('GeoLite2-City.mmdb', function (err, cityLookup) {

                        //creating object with data to pass
                        var appendThis = [];
                        for (var i = 0; i < rows.length; i++) {
                            var ip = rows[i]["ip"];
                            var result = cityLookup.get(ip);
                            var city = result["city"];
                            var verifiedCity = city ? city.names.en : "City does not exist for IP";
                            var row = {};
                            row["ip"] = ip;
                            row["city"] = verifiedCity;
                            appendThis.push(row);
                        };


                        //creating input data
                        var fields = ["ip", "city"];
                        var fieldName = ["ip", "city"]; //duplicate
                        var toCsv = {
                            data: appendThis,
                            fields: fields,
                            fieldNames: fieldName,
                            quotes: ''
                        };

                        //inserting data to file
                        console.log(toCsv);
                        var newCsv = json2csv(toCsv);
                        console.log(newCsv);
                        // won't work with multiple users
                        fs.writeFile('routes/outputs/output.csv', newCsv, function (err) {
                            if (err) throw err;
                            console.log('The "data to append" was appended to file!');
                        });

                        //sending data to client in response
                        res.send(appendThis);


                    });
                });
            });
        };
    });
});



module.exports = router;


