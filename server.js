var express = require('express')
var app = express()

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
port = process.env.PORT || 3000,

//mongoose = require('mongoose'),
Task = require('./api/models/todoListModel'),
path = require('path')
bodyParser = require('body-parser'),
helper = require('./api/helper.js'),
config = require('./config.json');
couchdb = require('./api/services/couchdb')
logger = helper.getLogger('server.js');

var options = { dotfiles: 'ignore', etag: false,
    extensions: ['htm', 'html'],
    index: false
};

app.use(express.static(path.join(__dirname, 'public') , options  ));

//app.get('/', function(req, res) {
//    res.render('hello');   // this is the important part
//});

//mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost/Tododb');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];

  //console.log(mime)
  //if (mime != 'text/plain' ) {
  //  return next();
  //}

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


helper.getOrg("org1")
  .then(() => {
    logger.info('*** server running on port %d ***', port)
    app.listen(port);
  })
  .then(() => {
    couchdb.getEpcid("urn:epc:id:sgtin:41065887.79796.0000000001")
   })
  //.then(couchdb.checkViewForChaincode)
  //.then(couchdb.getEpcisStatesIds)
  //.then(couchdb.getEpcisStates)
  //.then(couchdb.getStats)
  .then((n) => {console.log(n); logger.info("ready " + n + " Docs")})

/*

couchdb.view(chaincodeId, 'states', {'include_docs': true}, function(err, body){    
    if(err){
      console.log(err)
    } else {
        var rows = body.rows; //the rows returned
        for (var i=0; i<rows.length; i++ ) {
          console.log (rows[i].doc)
        }
    }
});

      }
  }

})

})
*/

// mycc45\u0000urn:epc:id:sgtin:01544848:05926:0000000000000001
// mycc45%5c00urn%3Aepc%3Aid%3Asgtin%3A01544848%3A05926%3A0000000000000001

// mychannel/mycc45%00urn:epc:id:sgtin:01544848:05926:0000000000000001
//http://10.100.0.108:5984/mychannel/mycc45%00urn:epc:id:sgtin:01544848:05926:0000000000000001

//http://10.100.0.108:5984/mychannel/mycc45%00urn%3aepc%3aid%3asgtin%3a01544848%3a05926%3a0000000000000001





