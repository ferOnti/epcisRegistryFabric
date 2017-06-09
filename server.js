var express = require('express')
var app = express()
var path = require('path');

var exphbs = require('express-handlebars');
let hbsOptions = {
  defaultLayout: 'main', 
  layoutsDir:"api/views/layouts/",
  partialsDir:"api/views/partials/"
}
app.engine('handlebars', exphbs(hbsOptions));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'api/views/'));
port = process.env.PORT || 3000,

bodyParser = require('body-parser'),
helper = require('./api/helper.js'),
config = require('./config.json');
couchdb = require('./api/services/couchdb')
logger = helper.getLogger('server.js');

var options = { dotfiles: 'ignore', etag: false,
    extensions: ['htm', 'html'],
    index: false
};

app.use(express.static(path.join(__dirname, 'api/public') , options  ));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];

  var data = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.rawBody = data;
    next();
  });
});

var routes = require('./api/routes/epcisRoutes');
routes(app);

app.use(function(req, res) {
	console.log(req.originalUrl, req.url);
    res.status(404).send({url: req.originalUrl + ' not found'})
});

couchdb.createViews()
  .then(couchdb.getStats)
  .then(() => {
    helper.getOrg("org1")
  })
  .then(() => {
    logger.info('*** server running on port %d ***', port)
    app.listen(port);
  })

