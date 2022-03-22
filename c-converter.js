//I'm working off the GNU C Reference Manual
//limited right now to a main function, no function definitions are possible

//TODO preprocessor directives (include can disappear) (maybe just use normal if?)

console.log(toPython(parse(lex(c_code))));

function lex(str) {
	let match, arr;
	//TODO fix non-whitespace-separated as well as multi-char operators
	while(str.length > 0 && (match = str.match(/\s*?(\S+)\s+/))[index] === 0) {
		arr.push(str.match[1]);
		str = str.slice(match[0].length);
	}
	return arr;
}

//two type qualifiers: const and volatile+ as well as static functions
function parse(toks) {
	intermediate = [];
	while (toks.length > 0) {
		if (toks[0] === '#') {
			//TODO directive handling
		} else if ()
	}
	return intermediate;
}

//idk what to name this: splices array to give the type on the top, or undefined if not a type
function toksType(arr) {

}

function parseStmt(toks) {
	switch(toks.shift()) {
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
		default: {}			//TODO function handling and expression statements
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
	return new Do(matchBrackets(toks, paren), stmt);
	if (toks.length === 0 || toks.shift() !== 'while')
		throw 'a do needs a while following it';
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

class Expr {

}

//TODO scoping stuff can be considered late, i dont wanna worry about storing variables
const keywords = [
	'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern',
	'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
	'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
] 
const ctypes = []
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