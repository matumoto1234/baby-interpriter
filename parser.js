function parseLiteral(tokens) {
  const head = tokens[0]
  switch (head?.type) {
    case 'Int':
      return {
        expression: {
          type: 'IntLiteral',
          value: head.value,
        },
        parsedTokensCount: 1,
      }
    default:
      return {
        expression: null,
      }
  }
}

function parseValue(tokens) {
  const head = tokens[0]
  if (head?.type === 'Ident') {
    return {
      expression: {
        type: 'Variable',
        name: head.value,
      },
      parsedTokensCount: 1,
    }
  }
  return parseLiteral(tokens)
}

function parseParenthesisExpression(tokens) {
  if (tokens[0]?.type === 'LParen') {
    // eslint-disable-next-line no-use-before-define
    const { expression, parsedTokensCount } = parseExpression(tokens.slice(1))
    if (tokens[parsedTokensCount + 1]?.type === 'RParen') {
      return { expression, parsedTokensCount: parsedTokensCount + 2 }
    }
  }
  return parseValue(tokens)
}

function parseFunctionCallArguments(tokens) {
  const {
    expression: firstExpression,
    parsedTokensCount: firstParsedTokensCount,
  // eslint-disable-next-line no-use-before-define
  } = parseExpression(tokens)
  if (firstExpression === null && tokens[0]?.type === 'RParen') {
    return {
      args: [],
      parsedTokensCount: 0,
    }
  }
  if (tokens[firstParsedTokensCount]?.type === 'RParen') {
    return {
      args: [firstExpression],
      parsedTokensCount: firstParsedTokensCount,
    }
  }
  const args = [firstExpression]
  let readPosition = firstParsedTokensCount
  while (tokens[readPosition]?.type === 'Comma') {
    readPosition += 1
    // eslint-disable-next-line no-use-before-define
    const { expression, parsedTokensCount } = parseExpression(tokens.slice(readPosition))
    if (expression === null) {
      break
    }
    args.push(expression)
    readPosition += parsedTokensCount
    if (tokens[readPosition]?.type === 'RParen') {
      return {
        args,
        parsedTokensCount: readPosition,
      }
    }
  }
  return null
}

function parseFunctionCallExpression(tokens) {
  const name = tokens[0]
  if (name?.type !== 'Ident' || tokens[1]?.type !== 'LParen') {
    return parseParenthesisExpression(tokens)
  }
  const argsAndParsedTokensCount = parseFunctionCallArguments(tokens.slice(2))
  if (argsAndParsedTokensCount === null) {
    return parseParenthesisExpression(tokens)
  }
  const { args, parsedTokensCount } = argsAndParsedTokensCount
  return {
    expression: {
      type: 'FuncCall',
      name: name.value,
      arguments: args,
    },
    parsedTokensCount: parsedTokensCount + 3,
  }
}

function parseAddSubExpression(tokens) {
  let { expression: left, parsedTokensCount: readPosition } = parseFunctionCallExpression(tokens)
  while (tokens[readPosition]?.type === 'Plus') {
    const {
      expression: right,
      parsedTokensCount: rightTokensCount,
    } = parseFunctionCallExpression(tokens.slice(readPosition + 1))
    if (right === null) {
      return { expression: null }
    }
    left = { type: 'Add', left, right }
    readPosition += rightTokensCount + 1
  }
  return { expression: left, parsedTokensCount: readPosition }
}

function parseExpression(tokens) {
  return parseAddSubExpression(tokens)
}

function parseAssignment(tokens) {
  if (tokens[0]?.type !== 'Ident' || tokens[1]?.type !== 'Equal') {
    return { result: null }
  }
  const { expression, parsedTokensCount } = parseExpression(tokens.slice(2))
  if (!expression) {
    return { result: null }
  }
  return {
    assignment: {
      type: 'Assignment',
      name: tokens[0].value,
      expression,
    },
    parsedTokensCount: parsedTokensCount + 2,
  }
}

function parseStatement(tokens) {
  const { expression, parsedTokensCount: parsedExpressionTokensCount } = parseExpression(tokens)
  if (expression && tokens[parsedExpressionTokensCount]?.type === 'Semicolon') {
    return {
      statement: expression,
      parsedTokensCount: parsedExpressionTokensCount + 1,
    }
  }
  const { assignment, parsedTokensCount: parsedAssignmentTokensCount } = parseAssignment(tokens)
  if (assignment) {
    return {
      statement: assignment,
      parsedTokensCount: parsedAssignmentTokensCount + 1,
    }
  }
  return { expression: null }
}

function parseSource(tokens) {
  const statements = []
  let readPosition = 0
  while (readPosition < tokens.length) {
    const {
      statement: stmt,
      parsedTokensCount: parsedExpressionTokensCount,
    } = parseStatement(tokens.slice(readPosition))
    if (stmt && stmt?.type !== 'SyntaxError') {
      statements.push(stmt)
      readPosition += parsedExpressionTokensCount
    } else if (stmt && stmt?.type === 'SyntaxError') {
      return stmt
    } else {
      return {
        type: 'SyntaxError',
        message: `予期しないトークン\`${tokens[readPosition]?.type}\`, \`${tokens[readPosition + 1]?.type}\`が渡されました`,
        hoge: tokens[readPosition],
      }
    }
  }
  return {
    type: 'Source',
    statements,
  }
}

module.exports.parse = parseSource
