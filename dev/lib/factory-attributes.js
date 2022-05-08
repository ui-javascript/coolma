/**
 * @typedef {import('micromark-util-types').Effects} Effects
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').Code} Code
 */

import {ok as assert} from 'uvu/assert'
// import {factorySpace} from 'micromark-factory-space'
// import {factoryWhitespace} from 'micromark-factory-whitespace'
import {
  asciiAlpha,
  asciiAlphanumeric,
  // markdownLineEnding,
  // markdownLineEndingOrSpace,
  // markdownSpace
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'


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
 export function markdownLineEnding(code) {
  return code !== null && code < codes.horizontalTab
}

/**
 * Check whether a character code is a markdown line ending (see
 * `markdownLineEnding`) or markdown space (see `markdownSpace`).
 *
 * @param {Code} code
 * @returns {code is number}
 */
 export function markdownLineEndingOrSpace(code) {
  return code !== null && (code < codes.nul || code === codes.space)
}

/**
 * Check whether a character code is a markdown space.
 *
 * A **markdown space** is the concrete character U+0020 SPACE (SP) and the
 * virtual characters M-0001 VIRTUAL SPACE (VS) and M-0002 HORIZONTAL TAB (HT).
 *
 * In micromark, the actual character U+0009 CHARACTER TABULATION (HT) is
 * replaced by one M-0002 HORIZONTAL TAB (HT) and between 0 and 3 M-0001 VIRTUAL
 * SPACE (VS) characters, depending on the column at which the tab occurred.
 *
 * @param {Code} code
 * @returns {code is number}
 */
export function markdownSpace(code) {
  return (
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space 
  )
}


/**
 * @param {Effects} effects
 * @param {State} ok
 */
 export function factoryWhitespace(effects, ok) {
  /** @type {boolean} */
  let seen

  return start

  /** @type {State} */
  function start(code) {
    if (markdownLineEnding(code) || code === codes.comma) {
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

/**
 * @param {Effects} effects
 * @param {State} ok
 * @param {string} type
 * @param {number} [max=Infinity]
 * @returns {State}
 */
 export function factorySpace(effects, ok, type, max) {
  const limit = max ? max - 1 : Number.POSITIVE_INFINITY
  let size = 0

  return start

  /** @type {State} */
  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(type)
      return prefix(code)
    }

    return ok(code)
  }

  /** @type {State} */
  function prefix(code) {
    if (markdownSpace(code) && size++ < limit) {
      effects.consume(code)
      return prefix
    }

    effects.exit(type)
    return ok(code)
  }
}

/**
 * @param {Effects} effects
 * @param {State} ok
 * @param {State} nok
 * @param {string} attributesType
 * @param {string} attributesMarkerType
 * @param {string} attributeType
 * @param {string} attributeIdType
 * @param {string} attributeClassType
 * @param {string} attributeNameType
 * @param {string} attributeInitializerType
 * @param {string} attributeValueLiteralType
 * @param {string} attributeValueType
 * @param {string} attributeValueMarker
 * @param {string} attributeValueData
 * @param {boolean} [disallowEol=false]
 */
/* eslint-disable-next-line max-params */
export function factoryAttributes(
  effects,
  ok,
  nok,
  attributesType,
  attributesMarkerType,
  attributeType,
  attributeIdType,
  attributeClassType,
  attributeNameType,
  attributeInitializerType,
  attributeValueLiteralType,
  attributeValueType,
  attributeValueMarker,
  attributeValueData,
  disallowEol
) {
  /** @type {string} */
  let type
  /** @type {Code|undefined} */
  let marker

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.leftCurlyBrace, 'expected `{`')
    effects.enter(attributesType)
    effects.enter(attributesMarkerType)
    effects.consume(code)
    effects.exit(attributesMarkerType)
    return between
  }

  /** @type {State} */
  function between(code) {
    if (code === codes.numberSign) {
      type = attributeIdType
      return shortcutStart(code)
    }

    if (code === codes.dot) {
      type = attributeClassType
      return shortcutStart(code)
    }

    if (
      code === codes.atSign ||
      code === codes.underscore ||
      asciiAlpha(code)
    ) {
      effects.enter(attributeType)
      effects.enter(attributeNameType)
      effects.consume(code)
      return name
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, between, types.whitespace)(code)
    }

    if (!disallowEol && (markdownLineEndingOrSpace(code) || code === codes.comma)) {
      return factoryWhitespace(effects, between)(code)
    }

    return end(code)
  }

  /** @type {State} */
  function shortcutStart(code) {
    effects.enter(attributeType)
    effects.enter(type)
    effects.enter(type + 'Marker')
    effects.consume(code)
    effects.exit(type + 'Marker')
    return shortcutStartAfter
  }

  /** @type {State} */
  function shortcutStartAfter(code) {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.numberSign ||
      code === codes.apostrophe ||
      code === codes.dot ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.colon ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
    ) {
      return nok(code)
    }

    effects.enter(type + 'Value')
    effects.consume(code)
    return shortcut
  }

  /** @type {State} */
  function shortcut(code) {
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
      code === codes.numberSign ||
      code === codes.dot ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
      || code === codes.comma
    ) {
      effects.exit(type + 'Value')
      effects.exit(type)
      effects.exit(attributeType)
      return between(code)
    }

    effects.consume(code)
    return shortcut
  }

  /** @type {State} */
  function name(code) {
    if (
      code === codes.dash ||
      code === codes.dot ||
      code === codes.atSign ||
      code === codes.underscore ||
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      return name
    }

    effects.exit(attributeNameType)

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, nameAfter, types.whitespace)(code)
    }

    if (!disallowEol && (markdownLineEndingOrSpace(code) || code === codes.comma)) {
      return factoryWhitespace(effects, nameAfter)(code)
    }

    return nameAfter(code)
  }

  /** @type {State} */
  function nameAfter(code) {
    if (code === codes.colon || code === codes.equalsTo) {
      effects.enter(attributeInitializerType)
      effects.consume(code)
      effects.exit(attributeInitializerType)
      return valueBefore
    }

    // Attribute w/o value.
    effects.exit(attributeType)
    return between(code)
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
      code === codes.rightCurlyBrace ||
      (disallowEol && markdownLineEnding(code))
    ) {
      return nok(code)
    }

    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.enter(attributeValueLiteralType)
      effects.enter(attributeValueMarker)
      effects.consume(code)
      effects.exit(attributeValueMarker)
      marker = code
      return valueQuotedStart
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, valueBefore, types.whitespace)(code)
    }

    if (!disallowEol && (markdownLineEndingOrSpace(code) || code === codes.comma)) {
      return factoryWhitespace(effects, valueBefore)(code)
    }

    effects.enter(attributeValueType)
    effects.enter(attributeValueData)
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

    if (code === codes.rightCurlyBrace || (markdownLineEndingOrSpace(code) || code === codes.comma)) {
      effects.exit(attributeValueData)
      effects.exit(attributeValueType)
      effects.exit(attributeType)
      return between(code)
    }

    effects.consume(code)
    return valueUnquoted
  }

  /** @type {State} */
  function valueQuotedStart(code) {
    if (code === marker) {
      effects.enter(attributeValueMarker)
      effects.consume(code)
      effects.exit(attributeValueMarker)
      effects.exit(attributeValueLiteralType)
      effects.exit(attributeType)
      return valueQuotedAfter
    }

    effects.enter(attributeValueType)
    return valueQuotedBetween(code)
  }

  /** @type {State} */
  function valueQuotedBetween(code) {
    if (code === marker) {
      effects.exit(attributeValueType)
      return valueQuotedStart(code)
    }

    if (code === codes.eof) {
      return nok(code)
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      return disallowEol
        ? nok(code)
        : factoryWhitespace(effects, valueQuotedBetween)(code)
    }

    effects.enter(attributeValueData)
    effects.consume(code)
    return valueQuoted
  }

  /** @type {State} */
  function valueQuoted(code) {
    if (code === marker || code === codes.eof || (markdownLineEnding(code) || code === codes.comma)) {
      effects.exit(attributeValueData)
      return valueQuotedBetween(code)
    }

    effects.consume(code)
    return valueQuoted
  }

  /** @type {State} */
  function valueQuotedAfter(code) {
    return code === codes.rightCurlyBrace || (markdownLineEndingOrSpace(code) || code === codes.comma)
      ? between(code)
      : end(code)
  }

  /** @type {State} */
  function end(code) {
    if (code === codes.rightCurlyBrace) {
      effects.enter(attributesMarkerType)
      effects.consume(code)
      effects.exit(attributesMarkerType)
      effects.exit(attributesType)
      return ok
    }

    return nok(code)
  }
}
