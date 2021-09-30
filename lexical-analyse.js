function isDigit(char) {
  const charCode = char.charCodeAt(0)
  return '0'.charCodeAt(0) <= charCode && charCode <= '9'.charCodeAt(0)
}

function isIdentChar(char) {
  const charCode = char.charCodeAt(0)
  return 'a'.charCodeAt(0) <= charCode && charCode <= 'z'.charCodeAt(0)
}

function countDigits(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (!isDigit(source[readPosition])) {
      return readPosition
    }
    readPosition += 1
  }
  return readPosition
}

function countChars(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (source[readPosition] === '"') {
      return readPosition
    }
    if (source[readPosition] === '\\') {
      readPosition += 1
    }
    readPosition += 1
  }
  return readPosition
}

function escapedString(string) {
  let res = ''
  for (let i = 0; i < string.length; i += 1) {
    if (string[i] !== '\\') {
      res += string[i]
      // eslint-disable-next-line no-continue
      continue
    }
    switch (string[i + 1]) {
      case 'n':
        res += '\n'
        break
      case 'b':
        res += '\b'
        break
      case 't':
        res += '\t'
        break
      case 'v':
        res += '\v'
        break
      case 'r':
        res += '\r'
        break
      case '\\':
        res += '\\\\'
        break
      case '"':
        res += '"'
        break
      case '\'':
        res += '\''
        break
      case '\0':
        res += '\0'
        break
      default:
        break
    }
    i += 1
  }
  return res
}

function countIdentChars(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (!isIdentChar(source[readPosition])) {
      return readPosition
    }
    readPosition += 1
  }
  return readPosition
}

module.exports.lexicalAnalyse = function (source) {
  const tokens = []
  let readPosition = 0
  while (readPosition < source.length) {
    switch (source[readPosition]) {
      case '=':
        tokens.push({ type: 'Equal' })
        readPosition += 1
        break
      case '+':
        tokens.push({ type: 'Plus' })
        readPosition += 1
        break
      case '-':
        tokens.push({ type: 'Minus' })
        readPosition += 1
        break
      case '*':
        tokens.push({ type: 'Mul' })
        readPosition += 1
        break
      case '/':
        tokens.push({ type: 'Div' })
        readPosition += 1
        break
      case '(':
        tokens.push({ type: 'LParen' })
        readPosition += 1
        break
      case ')':
        tokens.push({ type: 'RParen' })
        readPosition += 1
        break
      case '{':
        tokens.push({ type: 'LBrace' })
        readPosition += 1
        break
      case '}':
        tokens.push({ type: 'RBrace' })
        readPosition += 1
        break
      case ',':
        tokens.push({ type: 'Comma' })
        readPosition += 1
        break
      case ';':
        tokens.push({ type: 'Semicolon' })
        readPosition += 1
        break
      case '#':
        for (let i = readPosition; i < source.length; i += 1, readPosition += 1) {
          if (source[i] === '\n') {
            break
          }
        }
        break
      case '"':
        // eslint-disable-next-line no-case-declarations
        const cntChar = countChars(source.substring(readPosition + 1))
        tokens.push({
          type: 'StringLiteral',
          value: escapedString(source.substring(
            readPosition + 1,
            readPosition + cntChar + 1,
          )),
        })
        readPosition += cntChar + 2
        break
      case ' ':
      case '\t':
      case '\n':
        readPosition += 1
        break
      default:

        if (isDigit(source[readPosition])) {
          const digitsCount = countDigits(source.substring(readPosition))
          tokens.push({
            type: 'Int',
            value: parseInt(source.substring(readPosition, readPosition + digitsCount), 10),
          })
          readPosition += digitsCount
        } else if (isIdentChar(source[readPosition])) {
          const identCharsCount = countIdentChars(source.substring(readPosition))
          const name = source.substring(readPosition, readPosition + identCharsCount)
          switch (name) {
            case 'if':
              tokens.push({
                type: 'If',
              })
              break
            case 'def':
              tokens.push({
                type: 'Def',
              })
              break
            case 'true':
            case 'false':
              tokens.push({
                type: 'Bool',
                value: name === 'true',
              })
              break
            case 'null':
              tokens.push({
                type: 'Null',
              })
              break
            default:
              tokens.push({
                type: 'Ident',
                value: name,
              })
          }
          readPosition += identCharsCount
        } else {
          // 不明な文字
          tokens.push({
            type: 'UnknownCharacter',
            value: source[readPosition],
          })
          readPosition += 1
        }
    }
  }
  return tokens
}
