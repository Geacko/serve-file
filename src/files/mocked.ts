import {
    ServerFile, ServerReadableFile
} from '../types.ts'

const id = <T>(x: T) => x

export class MockedFile implements ServerFile {

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
            seek     : id
        }

    } 

}
