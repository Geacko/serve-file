import {
    ServerFile
} from '../types.ts'

const id = <T>(x: T) => x

export class MockedFile implements ServerFile {

    get size() {
        return 0
    }

    get lastModified() {
        return 0
    }

    get etag() {
        return ``
    }

    get contentType() {
        return ``
    }

    get additionalHeaders() {
        return null
    }

    open() {
        
        return {
            readable : ReadableStream.from([new Uint8Array(0)]),
            seek     : id
        }

    } 

}
