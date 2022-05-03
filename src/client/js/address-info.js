import {updateCurrentTime, withCtx, toast} from "./utils.js";
// import {connect} from "./websocket.js";

updateCurrentTime()
// connect()

withCtx(globalThis, {
    toast
})