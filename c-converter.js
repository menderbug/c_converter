//I'm working off the GNU C Reference Manual
//limited right now to a main function, no function definitions are possible

//TODO preprocessor directives (include can disappear) (maybe just use normal if?)

function lex(str) {
	let match;
	let toks = [];
	while(str.length > 0 && (match = str.match(/\s*?(\w+\b|[^\w\s])/))['index'] === 0) {
		toks.push(match[1]);
		str = str.slice(match[0].length);
	}
	return toks;
}

//two type qualifiers: const and volatile as well as static functions
function parse(toks) {
	intermediate = [];
	let type;
	while (toks.length > 0) {
		if (toks[0] === '#') {		//assuming no directives are used except include
			toks.splice(0, 2)		//removes #include
			matchBrackets(toks, '<');	//these two should effectively clear out the entire include
			matchBrackets(toks, '"');
		} else
			return parseStmt(['{', ...toks, '}'])
	}
	return intermediate;
}

function parseStmt(toks) {
	let t = toks.shift();
	switch(t) {
		case 'if': 			return parseIf(toks);
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
		default:			toks.unshift(t);
							return parseEtc(toks);
	}		
}

function parseIf(toks) {
	const paren = check(toks, '(', 'while must be followed by an argument in parentheses');
	let other;
	if (toks[0] === 'else') {
		toks.shift();
		other = toks.outStmt();
	}
	return new If(matchBrackets(toks, paren), toks.outStmt(), other);
}

//TODO duplicate case handling
function parseSwitch(toks) {
	const paren = check(toks, '(', 'switch must be followed by an argument in parentheses');
	let header = matchBrackets(toks, paren);
	let arr = [];
	let cases = matchBrackets(toks, '{');
	while (cases.length > 0) {
		let val;
		let str = cases.shift();
		if (str === 'case')
			val = cases.shift();
		else if (str === 'default') {}
		else
			throw 'the case format is messed up';	
		if (cases.shift() !== ':')
			throw 'the case format is messed up';
		arr.push(new Case(val, cases.outStmt()))
	}
	return new Switch(cond, arr);
}

function parseWhile(toks) {
	const paren = check(toks, '(', 'while must be followed by an argument in parentheses');
	return new While(matchBrackets(toks, paren), toks.outStmt());
}

function parseDo(toks) {
	let stmt = toks.outStmt();
	const paren = check(toks, '(', 'while must be followed by an argument in parentheses');
	out = new Do(matchBrackets(toks, paren), stmt);
	if (toks.length === 0 || toks.shift() !== 'while')
		throw 'a do needs a while following it';
	return out;
}

function parseFor(toks) {
	const paren = check(toks, '(', 'for must be followed by an argument in parentheses');
	let header = matchBrackets(toks, paren);
	if (header.filter(x => x === ';').length !== 2)
		throw 'insufficient number of arguments in for header';
	return new For(header.outStmt(), header.outStmt(), header.outStmt(), toks.outStmt());	//if someone tries to put curly braces in a for header i don't know what will happen
}

function parseBlock(toks) {
	let stmts = [];
	while (toks.length > 0 && toks[0] !== '}')
		stmts.push(outStmt(toks));
	return stmts;
}

function parseBreak(toks) {
	if (toks.length !== 0)
		throw 'break does not take any arguments';
	return new Break();
} 

function parseContinue(toks) {
	if (toks.length !== 0)
		throw 'continue does not take any arguments';
	return new Continue();
} 

function parseReturn(toks) {
	return new Return(parseExpr(toks));
}

//TODO when doing types, consider how char = int = bool in c (how to handle)
function parseTypedef(toks) {
	if (toks.length !== 2)
		throw 'typedef needs two arguments';
	return new Typedef(toks.shift(), toks.shift());
}

// decl, ass, def, expr(call)
// type word
// type word = val
// TODO commas and chained assignment
// word = val
// 
function parseEtc(toks) {
	if (popType(toks) !== undefined)
		return parseType(toks);
	else if (/[A-Za-z_]\w*/.test(toks[0]))
		return parseWord(toks);	
	else
		return toks;
}

function parseType(toks) {
	toks = popType(toks);	//discarding type
	let name = toks.shift();
	switch (toks[0]) {
		case '(': 
			return new Def(matchBrackets(toks, '('), outStmt(toks));		//note: this doesnt parse args and allows bracketless function definitions
		case '=':
			return parseExpr(toks.unshift(name));
		case ';':
			return undefined;
		default: throw "something's wrong with that identifier";
	}
}

function parseWord(toks) {
	let name = toks.shift();
	switch (toks[0]) {
		case '(': 
			return new Call(matchBrackets(toks, '('));
		case '=':
			return parseExpr(toks.unshift(name));
		case ';':
			return undefined;
		default: throw "something's wrong with that identifier";
	}
}

// im gonna try leaving expressions as arrays?
function parseExpr(toks) {
	let arr = [];
	let t;
	while (toks.length > 0) {
		if ((t = popOp(toks)) !== undefined)
			arr.push(t);
		else						//ok i couldnt resist let me live my life
			arr.push(pOps[t = toks.shift()] !== undefined ? pOps[t] : t);
	}

	if (arr.includes('?') && arr.includes(':')) {
		let cond = arr.splice(0, arr.indexOf('?') + 1).slice(0, -1);
		let yes = arr.splice(0, arr.indexOf(':') + 1).slice(0, -1);
		return [...parseExpr(yes), 'if', ...parseExpr(cond), 'else', ...parseExpr(arr)];
	}

	let before = [], after = []

	for (let i = 0; i < arr.length; i++) {
		if (cAssOps.includes(arr[i]) && i != 1) 
			
	}

	


	return arr;
}

//get symbol while checking for error
function check(toks, symb, error) {
	if (toks[0] !== symb)
		throw error;
}

//TODO does this function need to exist or can it be folded into outStmt?
function popStmt(toks) {
	if (toks.length === 0) return [];
	if (toks[0] === '{')
		return matchBrackets(toks, symb);
	else if (toks.includes(';'))
		return toks.splice(0, toks.indexOf(';') + 1).slice(0, -1);
	else
		throw 'I think a missing semicolon? I\'m not sure';
}

//syntactic sugar
function outStmt(toks) { return parseStmt(popStmt(toks)); }

//idk what to name this: splices array to give the type on the top, or undefined if not a type
function popOp(toks) {
	for (let i = 3; i >= 1; i--)
		if (toks.length >= i && cOps.includes(toks.slice(0, i).join()))
			return toks.splice(0, i);
}

function popType(toks) {
	for (let i = 4; i >= 1; i--)
		if (toks.length >= i && cTypes.includes(toks.slice(0, i).join(' ')))
			return toks.splice(0, i);
}

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

//this checks if not an identifier, i know the naming is unclear
function op(str) { return !/\w+/.test(str); }

class Stmt {}

class If extends Stmt {
	constructor(cond, stmt, other) {
		Object.assign(this, {cond, stmt, other});
	}
}

class Switch extends Stmt {
	constructor(x, cases) {
		Object.assign(this, {x, cases});
	}
}

class Case extends Stmt {
	constructor(val, stmt) {
		Object.assign(this, {val, stmt});
	}
} 

class While extends Stmt {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
}

class Do extends Stmt {
	constructor(cond, stmt) {
		Object.assign(this, {cond, stmt});
	}
}

class For extends Stmt {
	constructor(init, cond, iter, stmt) {
		Object.assign(this, {init, cond, iter, stmt});
	}
}

class Goto extends Stmt {}	//TODO

class Break extends Stmt {}
class Continue extends Stmt {}

class Return extends Stmt {
	constructor(val) {
		Object.assign(this, {val});
	}	
}

class Typedef extends Stmt {
	constructor(old, name) {
		Object.assign(this, {old, name});
	}	
}

//unidentified args are not handled
class Def extends Stmt {
	constructor(args, stmt) {
		Object.assign(this, {args, stmt});
	}
}

class Call extends Stmt {
	constructor(args) {
		Object.assign(this, {args});
	}
}

class Expr {

}

//TODO scoping stuff can be considered later, i dont wanna worry about storing variables
const keywords = [
	'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern',
	'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
	'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
] 
const cTypes = [
	'char', 'signed char', 'unsigned char', 'short', 'short int', 'signed short', 'signed short int', 'unsigned short',
	'unsigned short int', 'int', 'signed', 'signed int', 'unsigned', 'unsigned int', 'long', 'long int', 'signed long',
	'signed long int', 'unsigned long', 'unsigned long int', 'long long', 'long long int', 'signed long long', 
	'signed long long int', 'unsigned long long', 'unsigned long long int', 'float', 'double', 'long ', 'size_t', 'ptrdiff_t'
]

//structs not handled (., ->, some others)
const cOps = [
	'+', '-', '*', '/', '%', '&', '^', '|', '>', '<', '=', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '^=',
	'|=', '>=', '<=', '==', '<<=', '>>=', '&&', '||', '++', '--', '!=', ',', '?', ':', '~'
]

const cAssOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '>=', '<=', '==', '<<=', '>>=']

//easily substituted C -> python operators
const pOps = {
	'/':'//', '!':'not', '&&':'and', '||':'or' 
}

const ignorable = [] //TODO this one is ignoreable functions like malloc

function tabbed(str) {
	toks = str.split("\n");
	out = ""
	for (const line of toks) 
		out += "\t" + line + "\n";
	return out;
}

let c_code = '#include <stdio.h>\nint main() {\n   // printf() displays the string inside quotation\n   printf("Hello, World!");\n   return 0;\n}';
// console.log(toPython(parse(lex(c_code))));
console.log(parse(lex(c_code)));
