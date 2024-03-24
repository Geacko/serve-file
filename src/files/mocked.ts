import {
    ServerFile, ServerReadableFile
} from '../types.ts'

const SIZE = 1024
const BLOB = new Uint8Array(SIZE).map(() => 0x41 + (26 * Math.random()))

export class MockedFile implements ServerFile {

    #lastModified

    constructor(lastModified: number) {
        this.#lastModified = lastModified
    }

    get size() : number {
        return SIZE
    }

    get lastModified() : number {
        return this.#lastModified
    }

    get etag() : string {
        return `W/"${this.lastModified.toString(36)}:${this.size.toString(36)}"`
    }

    get contentType() : string {
        return `text/plain; charset=UTF-8`
    }

    get additionalHeaders() : Headers | null {
        
        return new Headers([
            [ 'X-Test-Header-1' , '1-0' ],
            [ 'X-Test-Header-1' , '1-1' ],
            [ 'X-Test-Header-2' , '2-0' ],
            [ 'X-Test-Header-3' , '3-0' ],
        ])

    }

    open() : ServerReadableFile {

        let count = 0

        const readable = new ReadableStream({
            
            type: 'bytes',

            pull(e) {

                e.enqueue(BLOB.slice(
                    count , 
                    count = Math.min(count + 256, SIZE)
                ))

                count >= SIZE && 
                e.close()
            
            }

        })
        
        const seek = (
            x: number 
        ) => {

            return count = x

        }

        return {
            readable, seek
        }

    } 

}
