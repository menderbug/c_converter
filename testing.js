var fs = require('fs');
var c = require('./c-converter');

const tests = 'tests/';
const txts = 'txts/';
let c_code = 'int b[50], int a[50] = {1 + 1, 2 + 2, 3 + 3, 4 + 4}';
// let c_code = 'f(f(a, b), b);

console.log(c.convert(c_code));

function test(tname) {	
	// let expected = fs.readFileSync(folder + tname + '.txt').toString('utf-8');
	let actual = c.convert(fs.readFileSync(tests + tname + '.c').toString('utf-8'));
	console.log(actual);
}

function write(tname) {
	let ccode = fs.readFileSync(tests + tname + '.c').toString('utf-8');
	let python =  c.convert(ccode);
	fs.writeFileSync(txts + tname + '.txt', python);
	console.log(`----------------------------------------------------------------------------------\nC:\n${ccode}\nPYTHON:\n`);
	console.log(`${python}\n----------------------------------------------------------------------------------`);
}

// write('Addition');
// write('Addressof1DArray');
// write('AllTempScalesConv');
// write('alphabetTriangle');

// write('SquareRoot');


// console.log(c.convert(c_code));

// fs.readdir(folder, (err, files) => {
// 	if (err) console.error('nope', err);
// 	files.filter(f => f.endsWith('.c')).slice(11, 12).forEach((fname) => {
// 		fs.readFile(folder + fname, 'utf-8', (err, data) => {
// 			if (err) console.error('nope', err);
// 			console.log(`----------------------------------------------------------------------------------\nC:\n${data}\nPYTHON:\n`)
// 			console.log(`${c.convert(data)}\n----------------------------------------------------------------------------------`);
// 		})
// 	});
// });



//TODO test 8: multi line comments
//TODO test 10: it's huge
//TODO test 11: arraysda
