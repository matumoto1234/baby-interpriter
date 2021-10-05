const { intValue, nullValue, boolValue } = require('./value')

function evaluaterError(ast, environment) {
  return {
    result: {
      type: 'EvaluatorError',
      isError: true,
      message: `無効なast'${ast.type}'が渡されました`,
      ast,
    },
    environment,
  }
}

function typeError(type, environment) {
  return {
    result: {
      type: 'TypeError',
      isError: true,
      message: `無効な型'${type}'が渡されました`,
    },
    environment,
  }
}

function evaluateStatements(statements, environment) {
  let result = nullValue
  let env = environment
  // forEachではreturnを使って値を返せないので書きづらく、
  // またreduceでは条件分岐が複雑になり書きづらいので、for文を使って処理しています
  // eslint-disable-next-line no-restricted-syntax
  for (const stmt of statements) {
    // eslint-disable-next-line no-use-before-define
    const { result: evaluatedResult, environment: evaluatedEnvironment } = evaluate(stmt, env)
    if (evaluatedResult.isError) {
      return { result: evaluatedResult, environment: evaluatedEnvironment }
    }
    result = evaluatedResult
    env = evaluatedEnvironment
  }
  return { result, environment: env }
}

function evaluateIfStatement(ast, initialEnvironment) {
  const { condition, statements, elseStatement: elseStatements } = ast
  // eslint-disable-next-line no-use-before-define
  const { result, environment: halfwayEnvironment } = evaluate(condition, initialEnvironment)
  if (result.isError) {
    return {
      result,
      environment: halfwayEnvironment,
    }
  }
  if ((result.type === 'BoolValue' && result.value === false) || result.type === 'NullValue') {
    if (!elseStatements) {
      return {
        result: nullValue,
        environment: halfwayEnvironment,
      }
    }

    return evaluateStatements(elseStatements.statements, halfwayEnvironment)
  }
  // eslint-disable-next-line no-use-before-define
  return evaluateStatements(statements, halfwayEnvironment)
}

function evaluateAddSub(ast, environment) {
  console.log(ast)
  const {
    result: leftResult,
    environment: leftEnvironment,
    // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.left, environment)
  if (leftResult.isError) {
    return { result: leftResult, environment: leftEnvironment }
  }
  if (leftResult.type !== 'IntValue') {
    return typeError(leftResult.type)
  }
  const {
    result: rightResult,
    environment: rightEnvironment,
  // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.right, leftEnvironment)
  if (rightResult.isError) {
    return { result: rightResult, environment: rightEnvironment }
  }
  if (rightResult.type !== 'IntValue') {
    return typeError(rightResult.type)
  }

  if (ast.type === 'Add') {
    return {
      result: intValue(leftResult.value + rightResult.value),
      environment: rightEnvironment,
    }
  // eslint-disable-next-line no-else-return
  } else if (ast.type === 'Sub') {
    return {
      result: intValue(leftResult.value - rightResult.value),
      environment: rightEnvironment,
    }
  }
  return {
    result: null,
    environment: null,
  }
}

function evaluateUnaryOperator(ast, environment) {
  const {
    result: rightResult,
    environment: rightEnvironment,
    // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.right, environment)

  if (rightResult.type !== 'IntValue') {
    return {
      result: {
        type: 'EvaluatorError',
        isError: true,
        message: `無効なast\`${rightResult.type}\`が渡されました`,
      },
      environment,
    }
  }

  if (ast.type === 'UnaryMinus') {
    return {
      result: intValue(-rightResult.value),
      environemt: rightEnvironment,
    }
  }
  return {
    result: intValue(rightResult.value),
    environment: rightEnvironment,
  }
}

function unwrapObject(obj) {
  switch (obj.type) {
    case 'IntValue':
    case 'BoolValue':
      return obj.value
    case 'NullValue':
      return null
    default:
      return null
  }
}

function wrapObject(obj) {
  const toStr = Object.prototype.toString
  switch (toStr.call(obj)) {
    case '[object Number]':
      return intValue(obj)
    case '[object Boolean]':
      return boolValue(obj)
    default:
      return nullValue
  }
}

function evaluateFunctionCalling(calling, environment) {
  const func = environment.functions.get(calling.name)
  if (func === undefined) {
    return {
      result: {
        type: 'UndefinedFunctionError',
        isError: true,
        message: `関数'${calling.name}'は存在しません`,
      },
    }
  }
  const args = calling.arguments
  if (func.argumentsCount !== args.length) {
    return {
      result: {
        type: 'ArgumentsCountError',
        isError: true,
        message: `関数'${calling.name}'は${func.argumentsCount}個の引数を取りますが、渡されたのは${calling.arguments.length}個です`,
      },
    }
  }
  const evaluatedArguments = []
  let argumentsEvaluatedEnvironment = environment
  // eslint-disable-next-line no-restricted-syntax
  for (const stmt of args) {
    const {
      result: argResult, environment: argEnvironment,
    // eslint-disable-next-line no-use-before-define
    } = evaluate(stmt, argumentsEvaluatedEnvironment)
    if (argResult.isError) {
      return {
        result: argResult,
        environment: argEnvironment,
      }
    }
    evaluatedArguments.push(argResult)
    argumentsEvaluatedEnvironment = argEnvironment
  }
  const result = (() => {
    switch (func.type) {
      case 'EmbededFunction':
        return wrapObject(func.function(...evaluatedArguments.map(unwrapObject)))
      case 'DefinedFunction':
        return evaluateStatements(func.statements, {
          variables: new Map(
            [...Array(func.argumentsCount).keys()]
              .map((i) => [func.arguments[i], evaluatedArguments[i]]),
          ),
          functions: argumentsEvaluatedEnvironment.functions,
        }).result
      default:
        return {
          type: 'FunctionTypeError',
          isError: true,
          message: `関数'${calling.name}'の型が無効な型'${func.type}'です`,
        }
    }
  })()
  return {
    result,
    environment: argumentsEvaluatedEnvironment,
  }
}

function evaluateFunctionDefinition(ast, environment) {
  return {
    result: nullValue,
    environment: {
      variables: environment.variables,
      functions: new Map(environment.functions).set(
        ast.name,
        {
          type: 'DefinedFunction',
          argumentsCount: ast.arguments.length,
          arguments: ast.arguments,
          statements: ast.statements,
        },
      ),
    },
  }
}

function evaluate(ast, environment) {
  switch (ast.type) {
    case 'Source':
      return evaluateStatements(ast.statements, environment)
    case 'FuncDef':
      return evaluateFunctionDefinition(ast, environment)
    case 'Assignment':
      return {
        result: nullValue,
        environment: {
          variables: new Map(environment.variables).set(
            ast.name,
            evaluate(ast.expression, environment).result,
          ),
          functions: environment.functions,
        },
      }
    case 'If':
      return evaluateIfStatement(ast, environment)
    case 'Add':
    case 'Sub':
      return evaluateAddSub(ast, environment)
    case 'UnaryPlus':
    case 'UnaryMinus':
      return evaluateUnaryOperator(ast, environment)
    case 'Variable':
      return {
        result: environment.variables.get(ast.name) || nullValue,
        environment,
      }
    case 'FuncCall':
      return evaluateFunctionCalling(ast, environment)
    case 'IntLiteral':
      return {
        result: intValue(ast.value),
        environment,
      }
    case 'BoolLiteral':
      return {
        result: boolValue(ast.value),
        environment,
      }
    case 'NullLiteral':
      return {
        result: nullValue,
        environment,
      }
    default:
      return evaluaterError(ast, environment)
  }
}

exports.evaluate = evaluate
