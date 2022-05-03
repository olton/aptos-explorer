import {Aptos} from "@olton/aptos";

export const initAptos = () => {
    globalThis.aptos = new Aptos(config.aptos.api)
}

export const cacheLedger = async () => {
    cache.ledger = await aptos.getLedger()
    setTimeout(cacheLedger, 1000)
}