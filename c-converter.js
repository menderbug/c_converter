//I'm working off the GNU C Reference Manual
//limited right now to a main function, no function definitions are possible

//TODO preprocessor directives (include can disappear) (maybe just use normal if?)

let c_code = '#include <stdio.h>\nint main() {\n   // printf() displays the string inside quotation\n   printf("Hello, World!");\n   return 0;\n}';
console.log(toPython(parse(lex(c_code))));

function lex(str) {
	let match, arr;
	while(str.length > 0 && (match = str.match(/\s*?([\w+\s+|[^\w\s])/))[index] === 0) {
		arr.push(str.match[1]);
		str = str.slice(match[0].length);
	}
	return arr;
}

//two type qualifiers: const and volatile+ as well as static functions
function parse(toks) {
	intermediate = [];
	let op;
	while (toks.length > 0) {
		if ((op = toks.popOp()) !== undefined) {

		} else if (toks[0] === '#') {
			//TODO directive handling
		} else if (toks[1]) {

		}
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
		case '{':			return parseBlock(toks);
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
	if (arr[0] === 'else') {
		arr.shift();
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
	while (toks.length > 0)
		stmts.push(outStmt(arr));
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
	if (toks[0].test(/[A-Za-z_]\w*/) && toks[0] === '(') {

	}
}

function parseType(toks) {
	toks.popType(toks);	//discarding type
	if (toks[0] === '(')

}

function parseWord(toks) {

}

function parseExpr(toks) {

}

//get symbol while checking for error
function check(arr, symb, error) {
	if (arr[0] !== symb)
		throw error;
}

//TODO does this function need to exist or can it be folded into outStmt?
function popStmt(arr) {
	if (arr.length === 0) return [];
	if (arr[0] === '{')
		return matchBrackets(arr, symb);
	else if (arr.indexOf(';') !== -1)
		return arr.splice(0, arr.indexOf(';')).splice(-1, 1);
	else
		throw 'I think a missing semicolon? I\'m not sure';
}

//syntactic sugar
function outStmt(arr) { return parseStmt(popStmt(arr)); }

//idk what to name this: splices array to give the type on the top, or undefined if not a type
function popOp(arr) {
	for (let i = 3; i >= 1; i--)
		if (arr.length >= i && cOps.indexOf(arr.slice(0, i).join()) != -1)
			return arr.splice(0, i);
}

function popType(arr) {
	for (let i = 4; i >= 1; i--)
		if (arr.length >= i && cTypes.indexOf(arr.slice(0, i).join(' ')) != -1)
			return arr.splice(0, i);
}

//TODO make sure side effects are working
function matchBrackets(arr, bracket) {
	const pairs = {'{':'}', '(':')', '[':']'}	//i dont think i need pointy brackets yet
	arr.shift();		//removes the open bracket	
	count = 1;	

	for (let i = 0; i < arr.length; i++) {
		if (arr[i] === bracket)
			count++;
		else if (arr[i] === pairs[bracket])
			count--;
		if (count === 0)
			return arr.splice(0, i).splice(-1, 1);
	}
	throw 'Mismatched brackets';
}

function toPython() {
	//TODO
}

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

class Expr {

}

//TODO scoping stuff can be considered late, i dont wanna worry about storing variables
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
const cOps = [
	'+', '-', '*', '/', '%', '&', '^', '|', '>', '<', '=', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '^=',
	'|=', '>=', '<=', '==', '<<=', '>>=', '&&', '||', '++', '--', '!=', ',', '?', ':'
]
const ignorable = [] //TODO this one is ignoreable functions like malloc


/*
function tabbed(str) {
	arr = str.split("\n");
	out = ""
	for (const line of arr)
		out += "\t" + line + "\n";
	return out;
}

class List {

	push(tok) {
		if (this.tok == null)
			return this.tok = tok;
		let temp = this.tok 
		while (temp.next != null)
			temp = temp.next;
		return temp.next = tok;
	}

	pop() {
		const temp = tok;
		this.tok = tok.next;
		return temp.str;
	}

	peek() { return this.tok == null ? null : this.tok.str; }
}

class Token {
	constructor(str, next) {
		this.str = str;
		this.next = next;
	}
}
*/