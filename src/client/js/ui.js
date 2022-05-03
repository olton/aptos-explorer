import {n2f, shorten} from "./utils.js";

export const updateLedger = data => {
    const {chain_id, epoch, ledger_version, ledger_timestamp} = data.ledger
    $("#ledger-chain-id").text(n2f(chain_id))
    $("#ledger-epoch").text(n2f(epoch))
    $("#ledger-version").text(n2f(ledger_version))
    $("#ledger-timestamp").text(datetime(+ledger_timestamp / 1000).format(dateFormat.datetime))
}

export const updateGasUsage = data => {
    const container = $("#gas-usage").clear()

    for(let r of data.gas) {
        $("<tr>").html(`
            <td>${r.func.substr(5)}</td>
            <td class="text-right">${r.gas_min}</td>
            <td class="text-right">${r.gas_avg}</td>
            <td class="text-right">${r.gas_max}</td>            
        `).appendTo(container)
    }
}

export const updateOperationsCount = data => {
    const container = $("#operations-count").clear()

    for(let r of data.operations) {
        $("<tr>").html(`
            <td>${r.func.substr(5)}</td>
            <td class="text-right">${r.operations_count}</td>
        `).appendTo(container)
    }
}

export const updateTransactionsByType = data => {
    for (let r of data.transactions) {
        $("#"+r.type).text(n2f(r.count))
    }
}

export const updateLatestUserTransactions = data => {
    const container = $("#latest-user-transactions").clear()

    for (let t of data.transactions) {
        const {version, type, payload_type, payload_func, payload_args, hash, gas_used, success, vm_status, inserted_at, sender, sequence_number, gas_unit_price, expiration, timestamp, inserted_ut} = t
        const funcName = payload_func.split("::")[2]
        const args = JSON.parse( payload_args )
        let amount = 0

        if (['mint', 'transfer'].includes(funcName)) {
            amount = +args[1]
        }

        $("<tr>").html(`
            <td xmlns="http://www.w3.org/1999/html"><span class='${success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red'}'></span></td>
            <td class="text-center">${n2f(version)}</td>
            <td>
                ${shorten(hash, 12)}
                <span class="ml-2 c-pointer mif-copy copy-data-to-clipboard text-muted" data-value="${hash}" title="Click to copy hash to clipboard"></span>
            </td>
            <td>
                ${shorten(sender, 12)}
                <span class="ml-2 c-pointer mif-copy copy-data-to-clipboard text-muted" data-value="${sender}" title="Click to copy hash to clipboard"></span>
            </td>
            <td>${payload_func.substr(5)}</td>
            <td class="text-right">${n2f(amount)}</td>
            <td class="text-right">${n2f(gas_used * gas_unit_price)}</td>
            <td>
                <div>${datetime(inserted_at).format(dateFormat.log_am)}</div>
            </td>
        `).appendTo(container)
    }

    $("#latest-user-transactions-counter").text(n2f(data.transactions.length))
}