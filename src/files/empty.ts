// Copyright 2024 Grégoire Jacquot <gregoirejacquot@outlook.com>. All rights reserved. MIT license.

import {
    ServerFile, ServerReadableFile
} from '../types.ts'

export class EmptyFile implements ServerFile {

    get size() : number {
        return 0
    }

    get lastModified() : number {
        return 0
    }

    get etag() : string {
        return ``
    }

    get contentType() : string {
        return ``
    }

    get additionalHeaders() : Headers | null {
        return null
    }

    open() : ServerReadableFile {
        
        return {
            readable : ReadableStream.from([new Uint8Array(0)]),
            seek     : x => x
        }

    } 

}
