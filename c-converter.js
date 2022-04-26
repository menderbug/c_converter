//I'm working off the GNU C Reference Manual
//limited right now to a main function, no function definitions are possible

//TODO preprocessor directives (include can disappear) (maybe just use normal if?)

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
            matchBrackets(toks, '<');
        } else
            globals.push(outStmt(toks));
    return globals;
}

function optimize(tree) {
    mergeInput(tree);
}

function mergeInput(tree) {
    if (Array.isArray(tree)) {
        for (let i = 0; i < tree.length; i++) {
            if (tree[i] instanceof Print && i !== tree.length - 1 && tree[i + 1] instanceof Input) {
                tree[i + 1].setText(tree.splice(i, 1)[0].text)
                i--;
            } else
                mergeInput(tree[i]);

            // need to recursively call on other statements
            // return or side effects? probably side effects
        }
    } else if (typeof(tree) === 'object')
        Object.values(tree).forEach(x => mergeInput(x));   
    //third case should just be tree is a string
}

function parseStmt(toks) {
    let t = toks.shift();
    switch(t) {
        case 'if':          return parseIf(toks);
        case 'else':        return parseElse(toks);
        case 'switch':      return parseSwitch(toks);
        case 'while':       return parseWhile(toks);
        case 'do':          return parseDo(toks);
        case 'for':         return parseFor(toks);
        case '{':           toks.unshift(t);
                            return parseBlock(matchBrackets(toks, '{'));
        case ';':           return '';
        //case 'goto'       TODO somehow (this can be done by enclosing the entire program in a while loop with case/switch which would be really funny)
        case 'break':       return parseBreak(toks);
        case 'continue':    return parseContinue(toks);
        case 'return':      return parseReturn(toks);
        case 'typedef':     return parseTypedef(toks);
        case 'struct':      return parseStruct(toks);
        default:            toks.unshift(t);

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
    return new For(outStmt(header), outStmt(header), outStmt([...header, ';']), outStmt(toks));	//if someone tries to put curly braces in a for header i don't know what will happen
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
    else if (isComment(toks[0]))
        return toks[0];
    else
        return parseExpr(toks);
}

function parseType(toks) {
    // console.log(toks);
    if (toks.length === 0)
        return '';
    else if (toks[1] === ('('))
        return new Def(toks.shift(), matchBrackets(toks, '(').filter((x, i) => i % 3 === 1), outStmt(toks));		//note: this doesnt parse args and allows bracketless function definitions
    else if (toks[1] === ('='))                                                             //TODO this should be i % 3 and not x % 3 right?
        return parseAssign(toks);
    else if (toks.indexOf('=', 2) !== -1)
        return parseWord(toks.slice(2));
    else
        return '';
}

function parseWord(toks) {
    if (toks[1] === '(')
        return functionCall(toks.shift(), matchBrackets(toks, '(').join('').split(','));    // TODO does this work for func(func(a, b), b) comma detection?
    else if (toks[1] === '=')
        return parseAssign(toks);
    else if (toks[1] === ',')
        return parseWord(toks.slice(2));
    else 
        return parseExpr(toks);
}

function parseAssign(toks) {
    let dict = {};
    toks[toks.length - 1] = ',';		//preps the loop operation (brittle)
    let commas = [...Array(toks.length).keys()].filter(
        i => toks[i] === ',' && toks.slice(0, i).count('(') === toks.slice(0, i).count(')')
    );

    // LMAO have fun reading this one
    // ok it basically just zips so that (4, 7, 11) turns into ((0, 4), (5, 7), (8, 11))    
    for (let pair of commas.map((x, i) => [i == 0 ? 0 : commas[i - 1] + 1, x])) {
        let arg = toks.slice(pair[0], pair[1]);
        if (arg.includes('=')) {
            if (arg[3] == '{' && arg.endsWith('}'))
                dict[arg[0]] = parseArray(arg.slice(2));
            else
                dict[arg[0]] = parseExpr(arg.slice(2));
        }
    }

    return new Assign(dict);
}

// im gonna try leaving expressions as arrays?
function parseExpr(toks) {
    if (!Array.isArray(toks))
        return toks;		//TODO should not be necessary, should be single element array
    let arr = [];
    let t;

    //kind of crusty but it handles semicolons sneaking in there
    if (toks[toks.length - 1] === ';')
        return parseExpr(toks.slice(0, -1)) + '\n';

    //handles function call as expression
    if (/^[A-Za-z_]\w*/.test(toks[0]) && toks.includes('(') && toks.includes(')') && toks[1] === '(')
        return functionCall(toks.shift(), matchBrackets(toks, '(').join('').split(','));        

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
        if (!!(re = arr[i].match(/^(\+|-|~)$/)) && (i === 0 || cOps.includes(arr[i - 1]))) {	//instead of index out of bounds, returns undefined
            arr.splice(i, 1);
            if (re[1] !== '+')      //ignore unary +
                arr[i] = re[1] + arr[i];
        }

        //prefix/postfix increment/decrement handling       //TODO prefix handling
        if (!!(re = arr[i].match(/(\+|-){2}/))) {
            if (i === 0 || cOps.includes(arr[i - 1])) {
                arr.splice(i, 2, '(', '(', arr[i + 1], arr[i], ')', '-', '1', ')');
                i += 3;
            }
            arr.splice(i, 1, re[1] + '=', '1');
        }

        //mixed assignment operator handling
        if (cAssOps.includes(arr[i]) && i != 1) {
            let name = arr.splice(i - 1, 1);            //TODO chaining fails
            arr[i] = name + ' := ' + name + ' ' + arr[i - 1].slice(0, -1);
            i--;
        }
    }
    
    for (let i = 0; i < arr.length; i++)
        if (cOps.includes(arr[i]) && !['(', ')'].includes(arr[i]))
            arr[i] = ` ${arr[i]} `;	

    //synactical conversions
    arr = arr.map(x => x in pyOps ? pyOps[x] : x);		//TODO maybe need a type table?	
    return arr.join('');		//note: parseExpr returns a string instead of an object (maybe use a Expr wrapper?)
}

// currently returns a string object because it cant really have other stuff in it
function parseArray(toks) {

}

function functionCall(name, args) {
    if (name in ignorable) return '';
    switch (name) {
        case 'printf':  return new Print(args);
        case 'scanf':   return new Input(args);
        case 'strlen':  return `len(${args[0]})`;
        case 'strlwr':  return args[0] + '.lower()';
        case 'strupr':  return args[0] + '.upper()';
        case 'strcat':  return `${args[0]} + ${args[1]}`;
        case 'strncat': return `${args[0]} + ${args[1]}[:${args[2]}]`;
        case 'strcpy':  return `${args[0]} = ${args[1]}`;
        case 'strncpy': return `${args[0]} = ${args[1]}[:${args[2]}] + ${args[0]}[${args[2]}:]`;
        // TODO strcmp, strncmp, strcmpi, stricmp, strnicmp
        case 'strdup':  return args[0];
        case 'strndup': return `${args[0]}[:${args[1]}]`;
        case 'strchr':
        case 'strstr':  return `${args[0]}.find(${args[1]})`;
        case 'strrchr': return `${args[0]}.rfind(${args[1]})`;
        case 'strset':  return `${args[0]} = ${args[1]} * len(${args[0]})`;
        case 'strnset': return `${args[0]} = (${args[1]} * ${args[2]}) + ${args[0]}[:${args[2]}]`;
        case 'strrev':  return `${args[0]}[::-1]`;

        default:        return new Call(name, args);
    }
}

function popStmt(toks) {
    const hacky = [...toks, '{', ';']
    let start = toks[0] === 'for' ? hacky.indexOf(')') : 0;
    let i = Math.min(hacky.indexOf(';', start), hacky.indexOf('{', start));
    if (hacky.indexOf(';', start) < hacky.indexOf('{', start))
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
    if (toks[0] === 'const') toks.shift();		//just removing any const
    for (let i = 4; i >= 1; i--)
        if (toks.length >= i && cTypes.includes(toks.slice(0, i).join(' ')))
            return toks.splice(0, i);
}

function tabbed(objs) {
    if (!Array.isArray(objs)) return tabbed([objs]);    // lmao
    let tabbedStr = '    ' + objs.filter(x => x !== '').map(s => s.toString()).join('').replace(/\n/g, '\n    ');
    return tabbedStr.endsWith('    ') ? tabbedStr.slice(0, -4) : tabbedStr;     //handling end tab case (crusty)
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
        return `if ${this.cond}:\n${tabbed(this.stmt)}`;
    }
}

class Else {
    constructor(cond, stmt) {
        Object.assign(this, {cond, stmt});
    }
    toString() {
        if (this.cond)
            return `elif ${this.cond}:\n${tabbed(this.stmt)}`;
        else
            return `else: \n${tabbed(this.stmt)}`;
    }
}

class Switch {
    constructor(x, cases) {
        Object.assign(this, {x, cases});
    }
    toString() {
        return `match ${this.x.trim()}:\n${tabbed(this.cases.map(c => c.toString()))}`
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
        if (typeof(this.cond) === 'string') this.cond = this.cond.trim();
        if (typeof(this.iter) === 'string') this.iter = this.iter.trim();
    }
    toString() {
        return `${this.init}while ${this.cond}:\n${tabbed([this.stmt , this.iter])}\n`;
    }
}

class Goto {}	//TODO

class Break { toString() { return 'break'; } }
class Continue { toString() { return 'continue';} }

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
        return `${this.name}(${this.args.join(', ')})`;     //not necessarily a line break
    }
}

class Print {
    constructor(args) {
        const re = /%(-|\+| |#|\.[0-9]+|\.\*){0,6}[hlL]?[cdieEfgGosuxXp]/;
        for (let i = 1; i < args.length; i++)
            args[0] = args[0].replace(re, `{${args[i]}}`);
        this.text = (args.length > 1 ? 'f' : '') + args[0];
    }
    toString() { return `print(${this.text})\n`; }
}

class Input {
    constructor(args) {
        Object.assign(this, {args});
    }

    setText(str) {this.text = str;}

    toString() {
        let text = this.hasOwnProperty('text') ? this.text : '';
        let out = this.args.slice(1).map(x => x.slice(1)).join(', ');
        out += ` = input(${text})${this.args.length > 2 ? '.split()' : ''}\n`;
        return out;
    }  
}

class Assign {
    constructor(dict) {
        Object.assign(this, {dict});
    }
    toString() {
        return Object.entries(this.dict).map(([k, v], _) => `${k} = ${v}`).join(', ') + '\n';
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
            return '# ' + this.txt.slice(2, -2).replace(/\n\s*\*?\/?/g, '\n# ');
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

const ignorable = ['malloc', 'calloc', 'free', 'realloc']

// if testing, comment out convert through update
// function convert() {
//     return parse(lex(document.getElementById('input').value)).map(x => x.toString()).join('').replace(/\n    \n/g, '\n').replace(/;/g, '');
// }	

// var input = document.getElementById('input');
// addEventListener('input', onChange);

// function onChange() {
//     let duration = 1000;
//     let timer;
//     clearTimeout(timer);
//     timer = setTimeout(() => {
//         update();
//     }, duration);
// }

// function update(){
//     document.getElementById('output').value = convert();
// }	

Object.defineProperties(Array.prototype, {
    count: {
        value: function(query) {
            var count = 0;
            for(let i = 0; i < this.length; i++)
                if (this[i] == query)
                    count++;
            return count;
        }
    }
});



// uncomment if you're testing
module.exports = {       
    convert: function(str) {
        let tree = parse(lex(str));
        optimize(tree);
        return tree.map(x => x.toString()).join('').replace(/\n    \n/g, '\n');		//TODO where are new lines coming from
    }	
};
