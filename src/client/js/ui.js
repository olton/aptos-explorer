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

export const updateLatestTransactions = data => {
    const container = $("#latest-transactions").clear()

    for (let t of data.transactions) {
        const {version, type, payload_type, payload_func, payload_args, hash, gas_used, success, vm_status, sender, sequence_number, gas_unit_price, timestamp} = t
        const funcName = payload_func ? payload_func.split("::")[2] : ""
        const args = JSON.parse( payload_args )
        let amount = 0

        if (['mint', 'transfer'].includes(funcName)) {
            amount = +args[1]
        }

        $("<tr>").html(`
            <td><span class='${success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red'}'></span></td>
            <td><span class='${type === 'user_transaction' ? 'mif-user fg-green' : 'mif-server fg-cyan'}'></span></td>
            <td class="text-center">
                <a class="link" href="/transaction/${hash}">${n2f(version)}</a>                
            </td>
            <td>
                <a class="link" href="/transaction/${hash}">${shorten(hash, 8)}</a>
                <span class="ml-2 c-pointer mif-copy copy-data-to-clipboard text-muted" data-value="${hash}" title="Click to copy hash to clipboard"></span>
            </td>
            <td>
                <a class="link" href="/address/${sender}">${shorten(sender, 8)}</a>
                <span class="ml-2 c-pointer mif-copy copy-data-to-clipboard text-muted" data-value="${sender}" title="Click to copy hash to clipboard"></span>
            </td>
            <td>${payload_func ? payload_func.substr(5) : 'METADATA'}</td>
            <td class="text-right">${n2f(amount || 0)}</td>
            <td class="text-right">${n2f((gas_used || 0) * (gas_unit_price || 0))}</td>
            <td>
                <div>${datetime(timestamp).format(dateFormat.log_am)}</div>
            </td>
        `).appendTo(container)
        if (!success) {
            $("<tr>").append($("<td>").attr("colspan", 9).addClass("vm-status").text(`${vm_status}`)).appendTo(container)
        }
    }

    $("#latest-transactions-counter").text(n2f(data.transactions.length))
}

export const updateTransaction = transaction => {
    const tranType = {
        'user_transaction': 'UserTransaction',
        'block_metadata_transaction': 'BlockMetadata',
    }

    const tran = transaction.tran
    const user = transaction.user
    const meta = transaction.meta

    if (tran) {
        $("#transaction-hash").text(tran.hash)

        $("#tr_status").removeClassBy("mif-").addClass(tran.success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red')
        $("#tr_number").text(tran.version)
        $("#tr_version").text(tran.version)
        $("#tr_timestamp").text(datetime(user ? user.timestamp : meta.timestamp).format(dateFormat.full))
        $("#tr_type").text(tranType[tran.type])
        $("#tr_hash").text(tran.hash)
        $("#tr_state_hash").text(tran.state_root_hash)
        $("#tr_event_hash").text(tran.event_root_hash)
        $("#tr_accumulator_hash").text(tran.accumulator_root_hash)
        $("#tr_gas_used").text(n2f(tran.gas_used))
        $("#tr_vm_status").addClass(`${tran.success ? '' : 'fg-red'}`).text(tran.vm_status)

        if (!tran.payload) {
            setTimeout(()=>{
                $("#payload-wrapper").parent().hide()
            }, 100)
        } else {
            $("#payload_type").text(tran.payload.type)
            $("#payload_function").text(tran.payload.function)
            $("#payload_arguments").html(`
                <ol class="decimal votes-list">
                    <li>${tran.payload.arguments.join("</li><li>")}</li>
                </ol>
            `)
            $("#payload").html(`
                <pre class="json"><code>${JSON.stringify(tran.payload, null, 2)}</code></pre>
            `)
        }

        if (!user) {
            setTimeout(()=>{
                $("#userdata-wrapper").parent().hide()
            }, 100)
        } else {
            $("#user_sequence_number").text(user.sequence_number)
            $("#user_sender").text(user.sender)
            $("#user_max_gas_amount").text(user.max_gas_amount)
            $("#user_gas_unit_price").text(user.gas_unit_price)
            $("#user_gas_trans_price").text(user.gas_unit_price * tran.gas_used)
            $("#user_signature_public_key").text(user.signature.public_key)
            $("#user_signature_value").text(shorten(user.signature.signature, 32))
            $("#user_signature_type").text(user.signature.type)
            $("#user_expiration_timestamp").text(datetime(user.expiration_timestamp_secs).format(dateFormat.full))
        }

        if (!meta) {
            setTimeout(()=>{
                $("#metadata-wrapper").parent().hide()
            }, 100)
        } else {
            $("#meta_id").text(meta.id)
            $("#meta_round").text(meta.round)
            $("#meta_proposer").text(meta.proposer)
            $("#meta_timestamp").text(datetime(meta.timestamp).format(dateFormat.full))
            $("#meta_votes").html(`
                <ol class="decimal votes-list">
                    <li>${meta.previous_block_votes.join("</li><li>")}</li>
                </ol>
            `)
        }
    }
}

export const updateAddress = address => {
    $("#address").text(shorten(address, 12))
}