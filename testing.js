var fs = require('fs');
var c = require('./c-converter');

const folder = 'tests/'
let c_code = 'a = b(c, d);';


console.log(c.convert(c_code));

// fs.readdir(folder, (err, files) => {
// 	if (err) console.error('nope', err);
// 	files.filter(f => f.endsWith('.c')).slice(0, 7).forEach((fname) => {
// 		fs.readFile(folder + fname, 'utf-8', (err, data) => {
// 			if (err) console.error('nope', err);
// 			console.log(`----------------------------------------------------------------------------------\nC:\n${data}\nPYTHON:\n`)
// 			console.log(`${c.convert(data)}\n----------------------------------------------------------------------------------`);
// 		})
// 	});
// });

//TODO test 8: multi line comments
//TODO test 10: it's huge
//TODO test 11: arrays
//TODO test 15: multiple assignment failing
