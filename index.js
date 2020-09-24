const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

var jsonParser = bodyParser.json();

const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

app.use(cors());


const PerformanceMetricSchema = new mongoose.Schema({
    ttfb: Number,
    fcp: Number,
    dom_load: Number,
    window_load_events: Number,
    created_at: Date
});
const PerformanceMetric = mongoose.model('performance_metrics', PerformanceMetricSchema);


app.post('/analytics', jsonParser, (req, res) => {
    let metric = new PerformanceMetric({...req.body, created_at: Date.now()});
    metric.save(function (err) {
        if (err) {
            console.log(err);
        }
        ;
    });
    res.send("Metrics are saved.");
});


app.get('/analytics', (req, res) => {
    const today = new Date();
    const thirtyMinutes = new Date(today.valueOf() - (1000 * 60 * 30));

    PerformanceMetric.aggregate(
        [
            {
                $match: {
                    created_at: {
                        $gt: thirtyMinutes
                    }
                }
            },
            {
                $group: {
                    dom_load: { $avg: "$dom_load" },
                    window_load_events: { $avg: "$window_load_events" },
                    fcp: { $avg: "$fcp" },
                    ttfb: { $avg: "$ttfb" },
                    created_at: { $max: "$created_at" },
                    _id: {
                        minute: {
                                        "$subtract": [
                                            { "$minute": "$created_at" },
                                            { "$mod": [{ "$minute": "$created_at"}, 1] }
                                        ]
                                    }
                    },
                    count: {"$sum": 1}
                }
            },
            {
                $sort: {
                    created_at: 1
                }
            }
        ], function (err, metrics) {
            res.send({data: metrics});
        })

});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});