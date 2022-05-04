import {updateCurrentTime, withCtx, toast, shorten} from "./utils.js";
// import {connect} from "./websocket.js";

updateCurrentTime()
// connect()

withCtx(globalThis, {
    toast
})

console.log(transaction)

const tran = transaction.tran
const user = transaction.user
const meta = transaction.meta

if (tran) {
    $("#tr_version").text(tran.version)
    $("#tr_timestamp").text(datetime(user ? user.timestamp : meta.timestamp).format(dateFormat.full))
}