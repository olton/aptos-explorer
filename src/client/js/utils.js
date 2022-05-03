export const updateCurrentTime = () => {
    $("#current-time").text(datetime().format(dateFormat.full))
    setTimeout(updateCurrentTime, 1000)
}

export const n2f = v => Number(v).format(0, null, " ", ".")

export const shorten = (v, l = 5) => `${v.substring(0, l) + '...' + v.substring(v.length - l)}`

export const parseJson = val => {
    try {
        return JSON.parse(val)
    } catch (e) {
        return val
    }
}

export const escapeStr = (v = "") => {
    return !v ? "" : v.replace(/'/g, '&apos;').replace(/"/g, '&quot;').trim()
}

export const toast = (msg, type = "info", timeout = 5000) => Metro.toast.create(msg, null, timeout, type)

export const withCtx = (ctx, inj) => {
    for(let x in inj) {
        ctx[x] = inj[x]
    }
}