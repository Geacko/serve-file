// Copyright 2024 Grégoire Jacquot. All rights reserved. MIT license.

export type ServeFileHandler = (
    req: Request, file: ServerFile
) => Response | Promise<Response>

export interface ServerFile {

    readonly size              : number
    readonly lastModified      : number
    readonly contentType       : string
    readonly additionalHeaders : Headers | null
    readonly etag              : string

    open() : ServerReadableFile | Promise<ServerReadableFile>

}

export interface Seekable {
    seek(x: number): number | Promise<number>
}

export interface ServerReadableFile extends Seekable {
    readable: ReadableStream<Uint8Array>
}

export type Nullable<T> = T | null | undefined

export type Part = {
    start : number
    end   : number
    count : number
}