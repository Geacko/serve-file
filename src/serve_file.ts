import type { 
    ServeFileHandler, 
    Part 
} from "./types.ts"

import { 
    HeaderName,
    Method, 
    Status, 
    AcceptRangeUnit 
} from "./constants.ts"

import { 
    evaluatePreconds 
} from "./preconditions.ts"

import { 
    createSlicedStream, 
    createMultipartBytesStream 
} from "./streams.ts"

/** @see https://www.rfc-editor.org/rfc/rfc9110#name-range-specifiers */
function computeRangeHeader(
    headerValue: string, maxSizeBytes: number
) : Part[] {

    if (!headerValue.startsWith(AcceptRangeUnit.BYTES + `=`)) {
        return []
    }

    const o = [
        // ...
    ] as Part[]

    for (const r of headerValue.substring(6).split(`,`)) {

        // Note : do not support `other-range`
        if (!/^\s*\d*\-\d*\s*$/.test(r)) {
            return []
        }

        let [
            a,
            b,
        ] = r.split(`-`, 2).map((x) => parseInt(x))

        if (isNaN(a) && isNaN(b)) {
            return []
        } else if (isNaN(a)) {
            a = maxSizeBytes - b
            b = maxSizeBytes - 1
        } else if (isNaN(b)) {
            b = maxSizeBytes - 1
        }

        if (a < 0 || b < 0 || a > b || b > maxSizeBytes - 1) {
            return []
        }

        o.push({
            start : a,
            end   : b,
            count : b - a + 1,
        })

    }

    return o

}

function createBoundary(
    size = 20,
    base = 36,
) : string {

    let o = ``

    // Just in case
    if (base > 36 || base < 2) {
        base = 36
    }

    while (size-- > 0) {
        o += (base * Math.random() | 0).toString(base)
    }

    return o

}

const commonHeaders = [
    [HeaderName.ALLOW, `${Method.GET}, ${Method.OPTIONS}, ${Method.HEAD}`],
    [HeaderName.ACCEPT_RANGES, `${AcceptRangeUnit.BYTES}`],
]

/**
 *  HTTP Request handler.
 *  
 *  **Example**
 *  ```ts
 *  import {
 *      serveFile
 *  } from 'jsr:@geacko/serve-file'
 *  
 *  const headers = new Headers([
 *      // ...
 *  ])
 * 
 *  function serve(req: Request) {
 *  
 *      if (req.method == 'OPTIONS) {
 *          return new Response(void 0, { status: 204 , headers }) 
 *      }
 * 
 *      if (req.method != 'GET' && 
 *          req.method != 'HEAD') {
 *          return new Response(void 0, { status: 405 })
 *      }
 *  
 *      if (!URL.canBeParsed(req.url)) {
 *          return new Response(void 0, { status: 400 })
 *      }
 *      
 *      // We call some ServerFile Factory
 *      const file = createFile(req)
 *      
 *      if (file) {
 *          return serveFile(req, file)
 *      }    
 * 
 *      return new Response(void 0, { status: 404 })
 *  
 *  }
 *  ```
 */
export const serveFile: ServeFileHandler = async (
    req, file
) => {

    const headers = new Headers(commonHeaders)
    const {
        method,
    } = req

    const {
        size, 
        lastModified, 
        etag, 
        contentType,
        additionalHeaders
    } = file

    const time 
        = isFinite(lastModified) && lastModified >= 0 
        ? new Date(lastModified)
        : undefined

    if (etag) {
        headers.set(HeaderName.ETAG, etag)
        headers.set(HeaderName.VARY, HeaderName.ETAG)
    }

    if (time) {
        headers.set(HeaderName.LAST_MODIFIED, time.toUTCString())
    }

    const status = evaluatePreconds(req, etag, time)

    if (
        status != Status.OK &&
        status != Status.PARTIAL_CONTENT
    ) {

        // Note : MUST be `null` or `undefined`
        return new Response(void 0, {
            status, headers,
        })

    }

    // if `HEAD` or empty body -> send headers only & ignore the `Range` header
    if (method == Method.HEAD || size <= 0) {

        contentType &&
        headers.set(HeaderName.CONTENT_TYPE, `${contentType}`)
        headers.set(HeaderName.CONTENT_LENGTH, `${size}`)

        return new Response(void 0, {
            status: Status.OK, headers,
        })

    }

    if (status == Status.OK) {

        if (additionalHeaders) {

            for (const [ i , x ] of additionalHeaders) {

                if (i != HeaderName.ETAG && 
                    i != HeaderName.VARY && 
                    i != HeaderName.LAST_MODIFIED) {
                    headers.set( i , x )    
                }

            }
    
        }

        contentType &&
        headers.set(HeaderName.CONTENT_TYPE, `${contentType}`)
        headers.set(HeaderName.CONTENT_LENGTH, `${size}`)

        // send streamed 200 response
        return new Response((await file.open()).readable, {
            status, headers
        })

    }

    const computeds = computeRangeHeader(
        req.headers.get(HeaderName.RANGE)!, size,
    )

    // Note : `computeds` MUST be a non empty Array
    if (computeds.length == 0) {

        headers.set(HeaderName.CONTENT_RANGE,
            `${AcceptRangeUnit.BYTES} */${size}`
        )

        headers.delete(HeaderName.LAST_MODIFIED)
        headers.delete(HeaderName.VARY)
        headers.delete(HeaderName.ETAG)

        return new Response(void 0, {
            status: Status.RANGE_NOT_SATISFIABLE, headers,
        })

    }

    if (additionalHeaders) {

        for (const [ i , x ] of additionalHeaders) {

            if (i != HeaderName.ETAG && 
                i != HeaderName.VARY && 
                i != HeaderName.LAST_MODIFIED) {
                headers.set( i , x )    
            }

        }

    }

    // more than 1 range -> multipart/byteranges
    if (computeds.length > 1) {

        const boundary = createBoundary()
        const fobj     = await file.open()
        const init     = {
            status, headers
        }

        headers.set(HeaderName.CONTENT_TYPE,
            `multipart/byteranges boundary=${boundary}`
        )

        // Note : No need to precompute the `Content-Length`
        return new Response(
            fobj.readable.pipeThrough(
                createMultipartBytesStream(
                    fobj, 
                    size, 
                    contentType, 
                    computeds, 
                    boundary
                )
            ), 
            init
        )

    }

    const {
        start, end, count
    } = computeds[0]!

    contentType &&
    headers.set(HeaderName.CONTENT_TYPE, `${contentType}`)
    headers.set(HeaderName.CONTENT_LENGTH, `${count}`)
    headers.set(HeaderName.CONTENT_RANGE, `${AcceptRangeUnit.BYTES} ${start}-${end}/${size}`)

    const fobj = await file.open()
    const init = {
        status, headers
    }

    return new Response(
        fobj.readable.pipeThrough(
            createSlicedStream(fobj, start, count)
        ), 
        init
    )
    
}