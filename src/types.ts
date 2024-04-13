/** 
 *  Represents the Request Handler 
 */
export type ServeFileHandler = (
    req: Request, file: ServerFile
) => Response | Promise<Response>

/** 
 *  Represents informations about the file 
 *  to be served 
 */
export interface ServerFile {

    readonly size              : number
    readonly lastModified      : number
    readonly contentType       : string
    readonly additionalHeaders : Headers | null
    readonly etag              : string

    /** 
     *  create a readable resource 
     */
    open() : ServerReadableFile | Promise<ServerReadableFile>

}

/** 
 *  Seekable interface for readable resource.
 *  Used in the case of a “Ranged” HTTP request
 */
export interface Seekable {
    seek(x: number): number | Promise<number>
}

/** 
 *  Represents the readable resource returned by 
 *  the server 
 */
export interface ServerReadableFile extends Seekable {
    readable: ReadableStream<Uint8Array>
}

/** @internal */
export type Nullable<T> 
    = T 
    | undefined 
    | void
    | null

/** @internal */
export type Part = {
    start : number
    end   : number
    count : number
}