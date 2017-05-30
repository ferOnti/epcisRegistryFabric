// Require the lib, get a working terminal
let term = require( 'terminal-kit' ).terminal;
let fabric = require( './fabric' );
let log4js = require('log4js');
let logger = log4js.getLogger('DEPLOY');

term.windowTitle('Epcis Registry - Fabric');
term.clear();
term.bgWhite.eraseLine.black( 'EPCIS Registry - Console panel with Fabric SDK-nodejs' );
/*
term.moveTo(1,2).defaultColor( 'channel:' ) ;
term.moveTo(1,3).defaultColor( 'chaincode:' ) ;
term.moveTo(12,2).defaultColor( 'xyz' ) ;
term.moveTo(12,3).defaultColor( 'xyz' ) ;
*/

// printf() style formating everywhere: this will output 'My name is Jack, I'm 32.' in green
// term.moveTo(term.width-20,2).green( "Chaincode %s:%s.\n" , 'mycc' , "v1.0" ) ;


fabric.init().then( function() {
	fabric.getSubmitter();
}, function(e) {
	term.bgWhite.red(e);
	process.exit();
}).catch(function(e) {
	term.bgWhite.red(e);
	log.error(e);
});


// on app exit
process.on('exit', function() {
	term.nextLine(1).defaultColor('==== end application ====\n');
});

