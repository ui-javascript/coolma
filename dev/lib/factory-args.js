/**
 * @typedef {import('micromark-util-types').Effects} Effects
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').Token} Token
 * @typedef {import('micromark-util-types').Code} Code
 */


import {ok as assert} from 'uvu/assert'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'

import {factorySpace} from 'micromark-factory-space'
// Import {factoryWhitespace} from 'micromark-factory-whitespace'
import {
  asciiAlphanumeric,
  markdownLineEnding,
  markdownLineEndingOrSpace,
  markdownSpace
} from 'micromark-util-character'

/**
 * Check whether a character code is a markdown line ending.
 *
 * A **markdown line ending** is the virtual characters M-0003 CARRIAGE RETURN
 * LINE FEED (CRLF), M-0004 LINE FEED (LF) and M-0005 CARRIAGE RETURN (CR).
 *
 * In micromark, the actual character U+000A LINE FEED (LF) and U+000D CARRIAGE
 * RETURN (CR) are replaced by these virtual characters depending on whether
 * they occurred together.
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownLineEndingOrComma(code) {
  return markdownLineEnding(code) || code === codes.comma
}

/**
 * Check whether a character code is a markdown line ending (see
 * `markdownLineEnding`) or markdown space (see `markdownSpace`).
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownLineEndingOrSpaceOrComma(code) {
  return markdownLineEndingOrSpace(code) || code === codes.comma
}

/**
 * @param {Effects} effects
 * @param {State} ok
 */
export function factoryWhitespaceOrComma(effects, ok) {
  /** @type {boolean} */
  let seen

  return start

  /** @type {State} */
  function start(code) {
    if (markdownLineEndingOrComma(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      seen = true
      return start
    }

    if (markdownSpace(code)) {
      return factorySpace(
        effects,
        start,
        seen ? types.linePrefix : types.lineSuffix
      )(code)
    }

    return ok(code)
  }
}

// This is a fork of:
// <https://github.com/micromark/micromark/tree/main/packages/micromark-factory-label>
// to allow empty labels, balanced brackets (such as for nested directives),
// text instead of strings, and optionally disallows EOLs.

/**
 * @param {Effects} effects
 * @param {State} ok
 * @param {State} nok
 * @param {string} argsType
 * @param {string} argsMarkerType
 * @param {string} argType
 * @param {string} argValueLiteralType
 * @param {string} argValueType
 * @param {string} argValueMarker
 * @param {string} argValueData
 * @param {boolean} [disallowEol=false]
 */
// eslint-disable-next-line max-params
export function factoryArgs(
  effects,
  ok,
  nok,

  argsType,
  argsMarkerType,
  argType,
  argValueLiteralType,
  argValueType,
  argValueMarker,
  argValueData,

  disallowEol
) {

  /** @type {Code|undefined} */
  let marker

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.leftParenthesis, 'expected `(`')
    effects.enter(argsType)
    effects.enter(argsMarkerType)
    effects.consume(code)
    effects.exit(argsMarkerType)
    return between
  }

  /** @type {State} */
  function between(code) {
   
    if (
      // code === codes.eof ||
      // code === codes.lessThan ||
      // code === codes.equalsTo ||
      // code === codes.colon ||
      // code === codes.greaterThan ||
      // code === codes.graveAccent ||
      // code === codes.rightParenthesis ||
      // (disallowEol && markdownLineEnding(code)) ||
      code === codes.quotationMark || 
      code === codes.apostrophe ||
      code === codes.dash ||
      code === codes.dot ||
      code === codes.atSign ||
      code === codes.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.enter(argType)
      return valueBefore(code)
    }


    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, between, types.whitespace)(code)
    }

    if (!disallowEol && markdownLineEndingOrSpaceOrComma(code)) {
      return factoryWhitespaceOrComma(effects, between)(code)
    }

    return end(code)
  }


  /** @type {State} */
  function valueBefore(code) {
    if (
      code === codes.eof ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.colon ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightParenthesis ||
      (disallowEol && markdownLineEnding(code))
    ) {
      return nok(code)
    }

    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.enter(argValueType)
      effects.enter(argValueLiteralType)
      effects.enter(argValueMarker)
      effects.consume(code)
      effects.exit(argValueMarker)
      marker = code
      effects.enter(argValueData)
      console.log("开启数据记录")
      return valueQuotedBetween
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, valueBefore, types.whitespace)(code)
    }

    if (!disallowEol && markdownLineEndingOrSpaceOrComma(code)) {
      return factoryWhitespaceOrComma(effects, valueBefore)(code)
    }

    effects.enter(argValueType)
    effects.enter(argValueData)
    effects.consume(code)
    marker = undefined
    return valueUnquoted
  }

  /** @type {State} */
  function valueUnquoted(code) {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.colon ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code)
    }

    if (
      code === codes.rightParenthesis ||
      markdownLineEndingOrSpaceOrComma(code)
    ) {
      effects.exit(argValueData)
      effects.exit(argValueType)
      effects.exit(argType)
      return between(code)
    }

    effects.consume(code)
    return valueUnquoted
  }

  /** @type {State} */
  function valueQuotedBetween(code) {
    if (code === marker) {
      effects.exit(argValueData)
      console.log("退出数据记录")
      effects.enter(argValueMarker)
      effects.consume(code)
      effects.exit(argValueMarker)
      effects.exit(argValueLiteralType)
      effects.exit(argValueType)
      effects.exit(argType)
      return valueQuotedAfter
    }

    if (code === codes.eof) {
      return nok(code)
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      return disallowEol
        ? nok(code)
        : factoryWhitespaceOrComma(effects, valueQuotedBetween)(code)
    }

    effects.consume(code)
    console.log("存入" + code)
    return valueQuotedBetween
  }

  /** @type {State} */
  function valueQuotedAfter(code) {
    return code === codes.rightParenthesis ||
      markdownLineEndingOrSpaceOrComma(code)
      ? between(code)
      : end(code)
  }

  /** @type {State} */
  function end(code) {
    if (code === codes.rightParenthesis) {
      effects.enter(argsMarkerType)
      effects.consume(code)
      effects.exit(argsMarkerType)
      effects.exit(argsType)
      return ok
    }

    return nok(code)
  }
}
