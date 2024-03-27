// Copyright 2024 Grégoire Jacquot. All rights reserved. MIT license.

import { Method, HeaderName, Status } from "./constants.ts"
import { matchEtag } from "./etag.ts"
import { Nullable } from "./types.ts"

function testPreconditionFailed(
    headers : Headers, e : Nullable<string>, t : Nullable<number>
) : boolean {

    let s

    if (e && (s = headers.get(HeaderName.IF_MATCH))) {
        return !matchEtag(s, e)
    }
    
    // Note : if `s` is invalid -> `t <> Date.parse(s)` always return false
    if (t && (s = headers.get(HeaderName.IF_UNMODIFIED_SINCE))) {
        return t > Date.parse(s)
    }

    return !1

}

function testNotModified(
    headers: Headers, e : Nullable<string>, t : Nullable<number>
) : boolean {

    let s

    if (e && (s = headers.get(HeaderName.IF_NONE_MATCH))) {
        return matchEtag(s, e, true)
    }
    
    // Note : if `s` is invalid -> `t <> Date.parse(s)` always return false
    if (t && (s = headers.get(HeaderName.IF_MODIFIED_SINCE))) {
        return t <= Date.parse(s)
    }

    return !1

}

function testConditionalRange(
    headers: Headers, e : Nullable<string>, t : Nullable<number>
) : boolean {

    if (!headers.has(HeaderName.RANGE)) {
        return !1
    }

    const s = headers.get(HeaderName.IF_RANGE)

    if (!s) {
        return !0
    }

    // We assume it is a Date
    if (s.endsWith(` GMT`)) {
        return t ? t <= Date.parse(s) : !0
    }

    // otherwise -> it is an etag
    return e ? 
        !( s.startsWith(`W/`) 
        || e.startsWith(`W/`) 
        || e != s ) : !0

}

/** @see https://www.rfc-editor.org/rfc/rfc9110#name-precedence-of-preconditions */
export function evaluatePreconds(
    req: Request, etag : Nullable<string>, date : Nullable<Date>
) : | Status.OK
    | Status.PARTIAL_CONTENT
    | Status.NOT_MODIFIED
    | Status.PRECONDITION_FAILED {

    const {
        headers
    } = req

    if (!etag && !date) {

        return headers.has(HeaderName.RANGE) 
             ? Status.PARTIAL_CONTENT 
             : Status.OK
             
    }

    const time 
        = date 
        ? date.getTime() - date.getMilliseconds()
        : 0

    if (testPreconditionFailed(headers, etag, time)) {
        return Status.PRECONDITION_FAILED
    }

    if (testNotModified(headers, etag, time)) {
        return Status.NOT_MODIFIED
    }

    if (req.method == Method.GET && testConditionalRange(headers, etag, time)) {
        return Status.PARTIAL_CONTENT
    }

    return Status.OK

}
