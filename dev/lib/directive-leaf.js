/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').State} State
 */

import {ok as assert} from 'uvu/assert'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'
import {factoryAttributes} from './factory-attributes.js'
import {factoryArgs} from './factory-args.js'
import {factoryName} from './factory-name.js'
import {factoryNamespace} from './factory-namespace.js'

/** @type {Construct} */
export const directiveLeaf = {tokenize: tokenizeDirectiveLeaf}

const namespace = {tokenize: tokenizeNamespace, partial: true}
const args = {tokenize: tokenizeArgs, partial: true}
const attributes = {tokenize: tokenizeAttributes, partial: true}

/** @type {Tokenizer} */
function tokenizeDirectiveLeaf(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.atSign, 'expected `:`')
    effects.enter('directiveLeaf')
    effects.enter('directiveLeafSequence')
    effects.consume(code)
    return inStart
  }

  /** @type {State} */
  function inStart(code) {
    if (code === codes.atSign) {
      effects.consume(code)
      effects.exit('directiveLeafSequence')
      return factoryName.call(
        self,
        effects,
        afterName,
        nok,
        'directiveLeafName'
      )
    }

    return nok(code)
  }

  /** @type {State} */
  function afterName(code) {
    return code === codes.leftSquareBracket
      ? effects.attempt(namespace, afterNamespace, afterNamespace)(code)
      : afterNamespace(code)
  }

  /** @type {State} */
  function afterNamespace(code) {
    return code === codes.leftParenthesis
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
    return factorySpace(effects, end, types.whitespace)(code)
  }

  /** @type {State} */
  function end(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('directiveLeaf')
      return ok(code)
    }

    return nok(code)
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
    'directiveTextArgValueData',
    true
  )
}

/** @type {Tokenizer} */
function tokenizeNamespace(effects, ok, nok) {
  // Always a `[`
  return factoryNamespace(
    effects,
    ok,
    nok,
    'directiveLeafNamespace',
    'directiveLeafNamespaceMarker',
    'directiveLeafNamespaceString',
    true
  )
}

/** @type {Tokenizer} */
function tokenizeAttributes(effects, ok, nok) {
  // Always a `{`
  return factoryAttributes(
    effects,
    ok,
    nok,
    'directiveLeafAttributes',
    'directiveLeafAttributesMarker',
    'directiveLeafAttribute',
    'directiveLeafAttributeId',
    'directiveLeafAttributeClass',
    'directiveLeafAttributeName',
    'directiveLeafAttributeInitializerMarker',
    'directiveLeafAttributeValueLiteral',
    'directiveLeafAttributeValue',
    'directiveLeafAttributeValueMarker',
    'directiveLeafAttributeValueData',
    true
  )
}
