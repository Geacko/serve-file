// Copyright 2024 Grégoire Jacquot <gregoirejacquot@outlook.com>. All rights reserved. MIT license.

import { HeaderName, AcceptRangeUnit } from "./constants.ts"
import { Seekable } from "./types.ts"
import { Nullable, Part } from "./types.ts"

const EOL_ENCODED = new Uint8Array([0x0D, 0x0A])

export function createSlicedStream(
    cursor: Seekable, start: number, count: number
) : TransformStream<Uint8Array, Uint8Array> {

    function transform(
        chunk: Uint8Array, e: TransformStreamDefaultController<Uint8Array>,
    ) {

        const {
            byteLength: s,
        } = chunk

        count -= s

        if (count > 0) {
            return e.enqueue(chunk)
        }

        count += s
        count && e.enqueue(chunk.slice(0, count))

        return e.terminate()

    }

    return new TransformStream({
        transform, async start() { await cursor.seek(start) }
    })

}

/** @see https://www.rfc-editor.org/rfc/rfc9110#name-media-type-multipart-bytera */
export function createMultipartBytesStream(
    cursor: Seekable, size: number, contentType: Nullable<string>, parts: Part[], boundary: string
) : TransformStream<Uint8Array, Uint8Array> {

    const enc 
        = new TextEncoder()

    let start = 0
    let end   = 0
    let count = 0

    let head = `--${boundary}\r\n`

    if (contentType) {
        head += `${HeaderName.CONTENT_TYPE}: ${contentType}\r\n`
    }

    const HEAD_FRAG_ENCODED = enc.encode(
        `${head}${HeaderName.CONTENT_RANGE}: ${AcceptRangeUnit.BYTES} `,
    )

    function next(
        e: TransformStreamDefaultController<Uint8Array>,
    ) {

        const r = parts.shift()

        if (!r) {
            // End of response body
            e.enqueue(enc.encode(
                `--${boundary}--`,
            ))

            return e.terminate()
        }

        start = r.start
        end   = r.end
        count = r.count

        // Start entity body
        e.enqueue(HEAD_FRAG_ENCODED)

        // Content-Range: bytes `${start}-${end}/${size}`
        e.enqueue(enc.encode(
            `${start}-${end}/${size}`,
        ))

        e.enqueue(EOL_ENCODED)
        e.enqueue(EOL_ENCODED)

        const out = cursor.seek(start)

        if (out instanceof Promise) {
            return out.then(() => {})
        }

        return

    }

    function transform(
        chunk: Uint8Array, e: TransformStreamDefaultController<Uint8Array>,
    ) {

        const {
            byteLength: s,
        } = chunk

        count -= s

        if (count > 0) {
            return e.enqueue(chunk)
        }

        count += s
        count && e.enqueue(chunk.slice(0, count))

        // End of entity body
        e.enqueue(EOL_ENCODED)

        return next(e)

    }

    return new TransformStream({ start: next, transform })

}