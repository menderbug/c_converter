//I'm working off the GNU C Reference Manual
//limited right now to a main function, no function definitions are possible

//TODO preprocessor directives (include can disappear) (maybe just use normal if?)
//TODO multi line comments
//TODO string whitespace handling

function lex(str) {
	let match;
	let re = /(".*?")|\s*?(\/\/.*?$|\/\*.*?\*\/|\w+\b|[^\w\s])/ms
	let toks = [];
	while(str.length > 0 && !!(match = str.match(re))) {		//!!(val) converts object/null returns to boolean
		let tok = match[2] === undefined ? match[1] : match[2];
		toks.push(tok);
		str = str.slice(match[0].length);
	}
	return toks;
}

//two type qualifiers: const and volatile as well as static functions
function parse(toks) {
	let globals = []
	while (toks.length > 0)
		if (toks[0] === '#') {		//assuming no directives are used except include
			toks.splice(0, 2)		//removes #include
			matchBrackets(toks, '<');	//these two should effectively clear out the entire include
			matchBrackets(toks, '"');
		} else if (isComment(toks[0]))
			globals.push(outStmt(toks));
		else
			globals.push(outStmt(toks));
	return globals;
}

function parseStmt(toks) {
	let t = toks.shift();
	switch(t) {
		case 'if': 			return parseIf(toks);
		case 'else':		return parseElse(toks);
		case 'switch':		return parseSwitch(toks);
		case 'while':		return parseWhile(toks);
		case 'do': 			return parseDo(toks);
		case 'for':			return parseFor(toks);
		case '{':			toks.unshift(t);
							return parseBlock(matchBrackets(toks, '{'));
		case ';': 			break;
		//case 'goto'		TODO somehow
		case 'break':		return parseBreak(toks);
		case 'continue':	return parseContinue(toks);
		case 'return':		return parseReturn(toks);
		case 'typedef':		return parseTypedef(toks);
		case 'struct':		return parseStruct(toks);
		default:			toks.unshift(t);
							return parseEtc(toks);
	}		
}

function parseIf(toks) {
	let cond = parseExpr(matchBrackets(toks, '('));
	let stmt = outStmt(toks);
	return new If(cond, stmt);
}

function parseElse(toks) {
	if (toks[0] === 'if') {
		toks.shift();
		return new Else(parseExpr(matchBrackets(toks, '(')), outStmt(toks));
	} else
		return new Else(undefined, outStmt(toks));
}

//TODO duplicate case handling
function parseSwitch(toks) {
	let header = parseExpr(matchBrackets(toks, '('));
	let arr = [];
	let caseToks = matchBrackets(toks, '{');
	while (caseToks.length > 0) {
		let v; 
		let t = caseToks.shift();
		switch (t) {
			case 'case':
				v = caseToks.shift();	//case flows into default
			case 'default':
				caseToks.shift();	//removes colon
				let caseArr = [];
				while (caseToks.length > 0 && caseToks[0] !== 'case' && caseToks[0] !== 'default') {
					caseArr.push(outStmt(caseToks));
				}
				arr.push(new Case(v, caseArr));
				break;
			default: arr.push(new Comment(t));
		}
	}
	return new Switch(header, arr);
}

function parseWhile(toks) {
	return new While(parseExpr(matchBrackets(toks, '(')), outStmt(toks));
}

function parseDo(toks) {
	let stmt = outStmt(toks);
	out = new Do(parseExpr(matchBrackets(toks, '(')), stmt);
	if (toks.length === 0 || toks.shift() !== 'while')
		throw 'a do needs a while following it';
	return out;
}

function parseFor(toks) {
	let header = matchBrackets(toks, '(');
	if (header.filter(x => x === ';').length !== 2)
		throw 'insufficient number of arguments in for header';
	return new For(header.outStmt(), header.outStmt(), header.outStmt(), outStmt(toks));	//if someone tries to put curly braces in a for header i don't know what will happen
}

function parseBlock(toks) {
	let stmts = [];
	while (toks.length > 0) {
		if (isComment(toks[0]))
			stmts.push(new Comment(toks.shift()));
		else
			stmts.push(outStmt(toks));
	}
	return stmts;
}

function parseBreak(toks) {
	if (toks.length !== 1)
		throw 'break does not take any arguments';
	return new Break();
} 

function parseContinue(toks) {
	if (toks.length !== 1)
		throw 'continue does not take any arguments';
	return new Continue();
} 

function parseReturn(toks) {
	return new Return(parseExpr(toks));
}

//TODO when doing types, consider how char = int = bool in c (how to handle)
function parseTypedef(toks) {
	if (toks.length !== 3)
		throw 'typedef needs two arguments';
	return new Typedef(toks.shift(), toks.shift());
}

function parseStruct(toks) {
	let name = toks.shift();		//TODO stretch goal
}

function parseEtc(toks) {
	if (popType(toks) !== undefined)	//discarding the type
		return parseType(toks);
	else if (/^[A-Za-z_]\w*/.test(toks[0]))
		return parseWord(toks);	
	else if (isComment(toks))
		return toks;
	else
		throw 'error here';
}

function parseType(toks) {
	let name = toks.shift();
	if (toks[0] === ('('))
		return new Def(name, matchBrackets(toks, '(').filter((x, i) => x % 3 === 1), outStmt(toks));		//note: this doesnt parse args and allows bracketless function definitions
	else if (toks[0] === ('=')) {
		toks.unshift(name)
		return parseAssign(toks);
	} else
		return '';
}

function parseWord(toks) {
	let name = toks.shift();
	if (toks[0] === ('('))
		return new Call(name, matchBrackets(toks, '(').join('').split(','));
	else if (toks[0] === ('=')) {
		toks.unshift(name)
		return parseAssign(toks);
	} else 
		return parseExpr(toks);
}

function parseAssign(toks) {
	let dict = {};
	toks[toks.length - 1] = ',';		//preps the loop operation (brittle)
	while (toks.length > 0) {
		let single = toks.splice(0, toks.indexOf(',') + 1).slice(0, -1);
		if (single.includes('='))
			dict[single[0]] = parseExpr(single.slice(2));
	}
	return new Assign(dict);
}

// im gonna try leaving expressions as arrays?
function parseExpr(toks) {
	if (!Array.isArray(toks))
		return toks;		//TODO should not be necessary, should be single element array
	let arr = [];
	let t;
	while (toks.length > 0)
		arr.push((t = popOp(toks)) !== undefined ? t : toks.shift());

	if (arr.includes('?') && arr.includes(':')) {
		let cond = arr.splice(0, arr.indexOf('?') + 1).slice(0, -1);
		let yes = arr.splice(0, arr.indexOf(':') + 1).slice(0, -1);
		arr = [...parseExpr(yes), 'if', ...parseExpr(cond), 'else', ...parseExpr(arr)];
	}

	//the below loop has to be the most brittle thing ive ever written
	for (let i = 0; i < arr.length; i++) {
		let re;

		//unary + or - handling
		if (!!(re = arr[i].match(/(\+|-)/)) && cOps.includes(arr[i - 1])) {	//instead of index out of bounds, returns undefined
			arr.splice(i, 1);
			if (re[1] === '-')
				arr[i] = '-' + arr[i];
			i--;
		}

		//prefix/postfix increment/decrement handling
		if (!!(re = arr[i].match(/(\+|-){2}/))) {
			if (i === 0 || cOps.includes(arr[i - 1])) {
				arr.splice(i, 2, '(', '(', arr[i + 1], arr[i], ')', '-', '1', ')');
				i += 3;
			}
			arr.splice(i, 1, re[1] + '=', '1');
		}

		//mixed assignment operator handling
		if (cAssOps.includes(arr[i]) && i != 1) {
			let name = arr.splice(i - 1, 1);
			arr[i] = name + ' := ' + name + ' ' + arr[i].slice(0, -1);
			i--;
		}
	}
	
	for (let i = 0; i < arr.length; i++)
		if (cOps.includes(arr[i]) && !['(', ')'].includes(arr[i]))
			arr[i] = ` ${arr[i]} `;		//remove parentheses TODO TODO

	//synactical conversions
	arr = arr.map(x => x in pyOps ? pyOps[x] : x);		//TODO this is not working?		
	return arr.join('');		//TODO UNLIKE OTHER PARSE FUNCTIONS, RETURNS STRING
}

//TODO does this function need to exist or can it be folded into outStmt?		//TODO TODO TODO THIS DOESNT WORK AT ALL
function popStmt(toks) {
	const hacky = [...toks, '{', ';']
	let i = Math.min(hacky.indexOf(';'), hacky.indexOf('{'))
	if (hacky.indexOf(';') < hacky.indexOf('{'))
		return toks.splice(0, i + 1);
	else
		return toks.splice(0, i).concat(['{', ...matchBrackets(toks, '{'), '}']);
}

//syntactic sugar
function outStmt(toks) { 
	if (isComment(toks[0])) return new Comment(toks.shift());		//TODO why do i have comment parsing everywhere
	return parseStmt(popStmt(toks));
}

//idk what to name this: splices array to give the type on the top, or undefined if not a type
function popOp(toks) {
	for (let i = 3; i >= 1; i--)
		if (toks.length >= i && cOps.includes(toks.slice(0, i).join('')))
			return toks.splice(0, i).join('');
}

function popType(toks) {
	if (toks[0] == 'const') toks.shift();		//just removing any const
	for (let i = 4; i >= 1; i--)
		if (toks.length >= i && cTypes.includes(toks.slice(0, i).join(' ')))
			return toks.splice(0, i);
}

function tabbed(objs) {
	if (objs === '') return '';		//TODO this should never be happening
	if (!Array.isArray(objs)) return '   ' + objs;		//TODO objs should always be an array
	let a = objs.map(s => s.toString());		//TODO remove
	return '    ' + objs.map(s => s.toString()).join('').replace(/\n/g, '\n    ').slice(0, -4);
}

function isComment(str) { return str.startsWith('//') || str.startsWith('/*')}

//returns a list of str tokens
function matchBrackets(toks, bracket) {

	if (toks[0] !== bracket) return;

	const pairs = {'{':'}', '(':')', '[':']', '<':'>', '"':'"'}	
	toks.shift();		//removes the open bracket	
	let count = 1;	

	for (let i = 0; i < toks.length; i++) {
		if (toks[i] === bracket)
			count++;
		else if (toks[i] === pairs[bracket])
			count--;
		if (count === 0)
			return toks.splice(0, i + 1).slice(0, -1);
	}
	throw 'Mismatched brackets';
}


class If {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
	toString() {
		return `if ${this.cond}:\n${tabbed(this.stmt)}\n`;
	}
}

class Else {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
	toString() {
		if (this.cond)
			return `elif:(${this.cond})\n${tabbed(this.stmt)}\n`;
		else
			return `else:\n${tabbed(this.stmt)}\n`;
	}
}

class Switch {
	constructor(x, cases) {
		Object.assign(this, {x, cases});
	}
	toString() {	//TODO remove
		let a = this.cases.map(c => c.toString());
		return `match ${this.x.trim()}:\n${tabbed(this.cases.map(c => c.toString()).join(''))}`
	}
}

class Case {
	constructor(val, stmt) {
		Object.assign(this, {val, stmt});
	}
	toString() {
		if (this.val)
			return `case ${this.val}:\n${tabbed(this.stmt)}\n`
		else
			return `default:\b\n${tabbed(this.stmt)}\n`
	}
} 

class While {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
	toString() {
		const bools = {'1':'True', '0':'False'};
		if (this.cond in bools) this.cond = bools[this.cond];
		return `while ${this.cond}:\n${tabbed(this.stmt)}\n`;
	}
}

class Do {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
	toString() {
		return `while True:\n${tabbed(this.stmt + 'if ' + this.cond) + ':\n\tbreak'}\n`;
	}
}

class For {
	constructor(init, cond, iter, stmt) {
		Object.assign(this, {init, cond, iter, stmt});
	}
	toString() {
		return `THIS ONE IS ACTUALLY HARD\n`;
	}
}

class Goto {}	//TODO

class Break { toString() { return 'break\n'; } }
class Continue { toString() { return 'continue\n';} }

class Return {
	constructor(val) {
		Object.assign(this, {val});
	}	
	toString() {
		return `return ${this.val}\n`;
	}
}

class Typedef {
	constructor(old, name) {
		Object.assign(this, {old, name});
	}
	toString() {
		return `${this.name} = ${this.old}`;
	}
}

//unidentified args are not handled
class Def {
	constructor(name, args, stmt) {
		Object.assign(this, {name, args, stmt});
	}
	toString() {
		if (!this.stmt) return '';
		return `func ${this.name} (${this.args.join()}):\n${tabbed(this.stmt)}`;
	}
}

class Call {
	constructor(name, args) {
		Object.assign(this, {name, args});
	}
	toString() {

		switch (this.name) {
			case 'printf':
				const re = /%(-|\+| |#|\.[0-9]+|\.\*){0,6}[hlL]?[cdieEfgGosuxXp]/;
				for (let i = 1; i < this.args.length; i++)
					this.args[0] = this.args[0].replace(re, `{${this.args[i]}}`);
				return `print(${this.args.length > 1 ? 'f' : ''}${this.args[0]})\n`;
			case 'scanf':
				let out = ''
				for (let i = 1; i < this.args.length; i++)
					out += `${this.args[i].slice(1)} = input()\n`
				return out;
			default:
				return `${this.name}(${this.args.join()})\n`;
		}
	}
}

class Assign {
	constructor(dict) {
		Object.assign(this, {dict});
	}
	toString() {
		return Object.entries(this.dict).map(([k, v], _) => `${k} = ${v}\n`).join('');
		//for (cost [name, val] of Object.entries(this.dict))
	//		return `${name} = ${this.dict[name]}\n`;
	}
}

class Comment {
	constructor(txt) {
		Object.assign(this, {txt});
	}
	toString() {
		if (this.txt.startsWith('//'))
			return `# ${this.txt.slice(this.txt.search(/[^\s\/]/))}\n`;
		else {
			return '#' + this.txt.slice(2, -2).replace(/\n\s*\*/g, '\n#');
		}	
	}
}

//TODO scoping stuff can be considered later, i dont wanna worry about storing variables
const keywords = [
	'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern',
	'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
	'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
];

const cTypes = [
	'void', 'char', 'signed char', 'unsigned char', 'short', 'short int', 'signed short', 'signed short int', 'unsigned short',
	'unsigned short int', 'int', 'signed', 'signed int', 'unsigned', 'unsigned int', 'long', 'long int', 'signed long',
	'signed long int', 'unsigned long', 'unsigned long int', 'long long', 'long long int', 'signed long long', 
	'signed long long int', 'unsigned long long', 'unsigned long long int', 'float', 'double', 'long ', 'size_t', 'ptrdiff_t'
];

//structs not handled (., ->, some others)
const cOps = [
	'+', '-', '*', '/', '%', '&', '^', '|', '>', '<', '=', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '^=',
	'|=', '>=', '<=', '==', '<<=', '>>=', '&&', '||', '++', '--', '!=', ',', '?', ':', '~', '(', ')'
];

const cAssOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '>=', '<=', '==', '<<=', '>>=']

//easily substituted C -> python operators
const pyOps = {
	' / ':' // ', ' ! ':' not ', ' && ':' and ', ' || ':' or ', ' ; ':'\n' 
};

const ignorable = [] //TODO this one is ignoreable functions like malloc

function convert() {
	return parse(lex(document.getElementById('input').value)).map(x => x.toString()).join('').replace(/\n    \n/g, '\n');		//TODO where are new lines coming from
}	

function toHTML() {
	// document.write('a<br>b');
	// document.write(document.getElementById('input').value);
	// document.write(parse(lex(document.getElementById('input').value)).join('').replace('/\n/g', '<br>'));
	document.getElementById('output').value = convert();
}

var input = document.getElementById('input');
addEventListener('input', onChange);

function onChange() {
	var duration = 1000;
	let timer = setTimeout(() => {
		update();
	}, duration);
	clearTimeout(timer);
}

function update(){
   console.log('Do something')
}




/* module.exports = {
	convert: function(str) {
		return parse(lex(str)).map(x => x.toString()).join('').replace(/\n    \n/g, '\n');		//TODO where are new lines coming from
	}	
};
*/