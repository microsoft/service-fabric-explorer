export default class ExpressionParser {
    // !!!!!!!!!!!!!!!!!!!!!! delete error detection later
    private static readonly conditionals = ["==", "!=",">",">=","<","<="];
    private static readonly biStatements = ["&&","||"];
    private static readonly uniStatement = "!";
    // tables
    private static readonly  ipr = {
        ")" : 1,
        "(" : 6,
        "!" : 5,
        "&&" : 2,
        "||" : 2,
        "==" : 3,
        "!=" : 3,
        ">" : 3,
        ">=" : 3,
        "<" : 3,
        "<=" : 3,        
    };
    private static readonly  spr = {
        ")" : -1,
        "(" : 0,
        "!" : 4,
        "&&" : 2,
        "||" : 2,
        "==" : 3,
        "!=" : 3,
        ">" : 3,
        ">=" : 3,
        "<" : 3,
        "<=" : 3, 
    };
    // hepler functions
    private static  isLetterOrNumber = (letter:string) => (letter >= 'A' && letter <= 'Z') || (letter >= 'a' && letter <= 'z') || (letter >= '0' && letter <= '9');
    private static isNumber = (x:string) => {
        for(let i=0;i<x.length;i++){
            if (i==0 && x[i] == '-') continue;
            if (!(x[i] >= '0' && x[i] <= '9')) return false;
        }
        return true;
    }
    private static  isOperand = (x:string) => !(ExpressionParser.conditionals.indexOf(x) > -1 || ExpressionParser.biStatements.indexOf(x) > -1 || ExpressionParser.uniStatement.indexOf(x) > -1)

    private static  compare = (comparator:string,op2,op1,values:JSON) => {
    let a2 = op2;
    let a1 = op1;
    
    if (!ExpressionParser.isNumber(op2)) {
        if (values.hasOwnProperty(op2)) op2 = values[op2];
        if (op2 == "true" || op2 == "false") op2 = op2=="true"?true:false;
    }
    else if(typeof op2 === 'string') op2 = parseInt(op2);
    if (!ExpressionParser.isNumber(op1)) {
        if (values.hasOwnProperty(op1)) op1 = values[op1];
        if (op1 == "true" || op1 == "false") op1 = op1 =="true"?true:false;
    }
    else if(typeof op1 === 'string') op1 = parseInt(op1);
    //console.log("Comparing "+a1 + " " + a2 +" : "+op1+" " + comparator + " "+op2);
    
    switch (comparator) {
        case "==":
            return op1 == op2;
        case "!=":
                return op1 != op2;
        case "!=":
            return op1 != op2;
        case ">":
            return op1 > op2;
        case ">=":
            return op1 >= op2;
        case "<":
            return op1 < op2;
        case "<=":
            return op1 <= op2;
        case "&&":
            return op1 && op2;
        case "||":
            return op1 || op2;
        default:
            //console.log("default error" + comparator);
            return "Error";
    }

    }
    public static infixToPostfix = (infix : string) => {
        let stack = [];
        let start = 0;
        let end = infix.length;
        let postfix = [];
        let rank = 0; // for error checking
        let brackets = 0 ; // for brackets error checking
        while (start < end) {
            
            if (infix[start] == ' ') {
                ++start;
                continue;
            }
            else if (ExpressionParser.isLetterOrNumber(infix[start]) || infix[start] == '-') {
                let variable = infix[start++];
                while (ExpressionParser.isLetterOrNumber(infix[start]) || infix[start] == '-') {
                    variable += infix[start]
                    ++start;
                }
                rank += 1
                postfix.push(variable);
            }
            else {
                let s = infix[start++];
                if ((s == "!" || s == "<" || s == ">" || s == "=") && infix[start] == "=") s += infix[start++];
                else if (s == "&" || s == "|") s += infix[start++];
                if (!(ExpressionParser.conditionals.indexOf(s) > -1 || ExpressionParser.biStatements.indexOf(s) > -1 || s == ExpressionParser.uniStatement || s == "(" || s == ")")) {
                    return "Error";
                }
                if (s == '(') brackets += 1;
                else if (s == ')') brackets -= 1;
                while (stack.length > 0 && ExpressionParser.ipr[s] <= ExpressionParser.spr[stack[stack.length - 1]]) {
                    let x = stack.pop();
                    postfix.push(x);
                    if (ExpressionParser.conditionals.indexOf(x) > -1 || ExpressionParser.biStatements.indexOf(x) > -1 ) rank -= 1;
                }
                if (s != ")") stack.push(s);
                else stack.pop();
            }
        }
        while (stack.length > 0) {
            let x = stack.pop()
            postfix.push(x);
            if (ExpressionParser.conditionals.indexOf(x) > -1 || ExpressionParser.biStatements.indexOf(x) > -1) rank -= 1;
        }
        if (rank != 1) {
            return "Error"
        }
        if (brackets != 0) {
            return "Error"
        }
        return postfix;
    }   
    public static calcPostfix = (postfix,values) => {
        let stack = []
        let start = 0;
        let end = postfix.length;
        let fails = []
        //console.log(postfix);
        let lastOperation=undefined;
        while(start < end) {
            let x = postfix[start++];
            if (ExpressionParser.isOperand(x)) stack.push(x);
            else if ( x == ExpressionParser.uniStatement) {
                let operand = stack.pop();
                if (!ExpressionParser.isNumber(operand)) {
                    if (values.hasOwnProperty(operand)) operand = values[operand];
                    if (operand == "true" || operand == "false") operand = operand =="true"?true:false;
                }
                else if(typeof operand === 'string')  operand = parseInt(operand);
                if (lastOperation && lastOperation[0] != "!")  {
                    lastOperation =  "!(" + lastOperation + ")";
                    if (operand) fails.push(lastOperation)
                }
                else lastOperation = "!" + lastOperation
                stack.push(!operand);
                
            }
            else {
                let op2 = stack.pop();
                let op1 = stack.pop();
                let res = ExpressionParser.compare(x,op2,op1,values);
                if (res == "Error") return res;
                if (!res){
                    if ((typeof op1 === 'string' && ExpressionParser.isOperand(op1)) || (typeof op2 === 'string' && ExpressionParser.isOperand(op2))) fails.push(op1+" "+x+" "+op2);
                }
                lastOperation = op1+" "+x+" "+op2;
                stack.push(res);
            }
        }
        if (stack.length != 1) return "Error stack len";
        return {
            eval: stack.pop(),
            fails : fails
        }
    }
}