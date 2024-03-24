/** @see https://www.rfc-editor.org/rfc/rfc9110#name-comparison-2 */
export function matchEtag(
    reqHeader: string, etag: string, acceptWeakness = !1
) : boolean {

    if (etag.startsWith(`W/`)) {

        if (acceptWeakness) {
            etag = etag.substring(2)
        } else {
            return !1
        }

    }

    if (reqHeader == `*`) {
        return !0
    }

    for (let x of reqHeader.split(`,`)) {

        x = x.trim()

        if (x.startsWith(`W/`)) {

            if (acceptWeakness) {
                x = x.substring(2)
            } else {
                continue
            }

        }

        if (x == etag) {
            return !0
        }

    }

    return !1

}