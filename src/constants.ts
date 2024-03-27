// Copyright 2024 Grégoire Jacquot <gregoirejacquot@outlook.com>. All rights reserved. MIT license.

export const enum Status {

    OK                    = 200,
    NO_CONTENT            = 204,
    PARTIAL_CONTENT       = 206,
    NOT_MODIFIED          = 304,
    BAD_REQUEST           = 400,
    NOT_FOUND             = 404,
    METHOD_NOT_ALLOWED    = 405,
    PRECONDITION_FAILED   = 412,
    RANGE_NOT_SATISFIABLE = 416,

}

export const enum Method {

    GET     = `GET`,
    OPTIONS = `OPTIONS`,
    HEAD    = `HEAD`,

}

export const enum HeaderName {

    ALLOW               = `Allow`,
    VARY                = `Vary`,
    CONTENT_TYPE        = `Content-Type`,
    CONTENT_LENGTH      = `Content-Length`,
    CONTENT_RANGE       = `Content-Range`,
    ACCEPT_RANGES       = `Accept-Ranges`,
    LAST_MODIFIED       = `Last-Modified`,
    RANGE               = `Range`,
    ETAG                = `ETag`,
    IF_MODIFIED_SINCE   = `If-Modified-Since`,
    IF_UNMODIFIED_SINCE = `If-Unmodified-Since`,
    IF_MATCH            = `If-Match`,
    IF_NONE_MATCH       = `If-None-Match`,
    IF_RANGE            = `If-Range`,

}

export const enum AcceptRangeUnit {

    NONE  = `none`  ,
    BYTES = `bytes` ,

}
