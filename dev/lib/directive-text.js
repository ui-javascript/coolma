/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').Previous} Previous
 * @typedef {import('micromark-util-types').State} State
 */

import {ok as assert} from 'uvu/assert'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'
import {factoryAttributes} from './factory-attributes.js'
import {factoryArgs} from './factory-args.js'
import {factoryName} from './factory-name.js'
import {factoryNamespace} from './factory-namespace.js'

/** @type {Construct} */
export const directiveText = {
  tokenize: tokenizeDirectiveText,
  previous
}

const namespace = {tokenize: tokenizeNamespace, partial: true}
const args = {tokenize: tokenizeArgs, partial: true}
const attributes = {tokenize: tokenizeAttributes, partial: true}

/** @type {Previous} */
function previous(code) {
  // If there is a previous code, there will always be a tail.
  return (
    code !== codes.atSign ||
    this.events[this.events.length - 1][1].type === types.characterEscape
  )
}

/** @type {Tokenizer} */
function tokenizeDirectiveText(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.atSign, 'expected `:`')
    assert(previous.call(self, self.previous), 'expected correct previous')
    effects.enter('directiveText')
    effects.enter('directiveTextMarker')
    effects.consume(code)
    effects.exit('directiveTextMarker')
    return factoryName.call(self, effects, afterName, nok, 'directiveTextName')
  }

  /** @type {State} */
  function afterName(code) {
    return code === codes.atSign
      ? nok(code)
      : code === codes.leftSquareBracket
      ? effects.attempt(namespace, afterNamespace, afterNamespace)(code)
      : afterNamespace(code)
  }

  /** @type {State} */
  function afterNamespace(code) {
    return code === codes.leftSquareBracket
      ? nok(code)
      : code === codes.leftParenthesis
      ? effects.attempt(args, afterArgs, afterArgs)(code)
      : afterArgs(code)
  }

  /** @type {State} */
  function afterArgs(code) {
    return code === codes.leftCurlyBrace
      ? effects.attempt(attributes, afterAttributes, afterAttributes)(code)
      : afterAttributes(code)
  }

  /** @type {State} */
  function afterAttributes(code) {
    effects.exit('directiveText')
    return ok(code)
  }
}

/** @type {Tokenizer} */
function tokenizeArgs(effects, ok, nok) {
  // Always a `[`
  return factoryArgs(
    effects,
    ok,
    nok,
    'directiveTextArgs',
    'directiveTextArgsMarker',
    'directiveTextArg',
    'directiveTextArgValueLiteral',
    'directiveTextArgValue',
    'directiveTextArgValueMarker',
    'directiveTextArgValueData'
  )
}

/** @type {Tokenizer} */
function tokenizeNamespace(effects, ok, nok) {
  // Always a `[`
  return factoryNamespace(
    effects,
    ok,
    nok,
    'directiveTextNamespace',
    'directiveTextNamespaceMarker',
    'directiveTextNamespaceString',
    // @todo 命名空间可以限制不能有换行等
    false
  )
}

/** @type {Tokenizer} */
function tokenizeAttributes(effects, ok, nok) {
  // Always a `{`
  return factoryAttributes(
    effects,
    ok,
    nok,
    'directiveTextAttributes',
    'directiveTextAttributesMarker',
    'directiveTextAttribute',
    'directiveTextAttributeId',
    'directiveTextAttributeClass',
    'directiveTextAttributeName',
    'directiveTextAttributeInitializerMarker',
    'directiveTextAttributeValueLiteral',
    'directiveTextAttributeValue',
    'directiveTextAttributeValueMarker',
    'directiveTextAttributeValueData'
  )
}
