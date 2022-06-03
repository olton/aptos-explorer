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
        let {version, type, payload_type, payload_func, payload_args, hash, gas_used, success, vm_status, sender, sequence_number, gas_unit_price, timestamp} = t
        let funcName = payload_func ? payload_func.split("::")[2] : ""
        const args = JSON.parse( payload_args )
        let amount = 0

        if (['mint', 'transfer'].includes(funcName)) {
            amount = +args[1]
        }

        if (!sender) sender = ""

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
                <a class="link" href="/account/${sender}">${shorten(sender, 8)}</a>
                <span class="ml-2 c-pointer mif-copy copy-data-to-clipboard text-muted" data-value="${sender}" title="Click to copy hash to clipboard"></span>
            </td>
            <td>
                <div style="width: 200px; max-width: 200px;">
                    <div class="text-ellipsis">${type === 'user_transaction' ? (payload_func || 'USERDATA') : 'VOTES'}</div>
                </div>
            </td>
            <td class="text-right">${n2f(amount || 0)}</td>
            <td class="text-right">${n2f((gas_used || 0) * (gas_unit_price || 0))}</td>
            <td>
                <div>${datetime(timestamp).format(dateFormat.log_am)}</div>
            </td>
        `).appendTo(container)
        if (!success) {
            $("<tr>").append($("<td>").attr("colspan", 9).addClass("vm-status fail").html(`
                <div class="d-flex flex-row flex-align-start">
                    <span class="arrow-corner-up"></span>
                    <span class="d-inline-block ml-2">${vm_status}</span>
                </div>
            `)).appendTo(container)
        }
    }

    $("#latest-transactions-counter").text(n2f(data.transactions.length))
}

export const updateTransaction = transaction => {
    const tranType = {
        'genesis_transaction': 'GenesisTransaction',
        'user_transaction': 'UserTransaction',
        'block_metadata_transaction': 'BlockMetadata',
    }

    const tran = transaction.tran
    const user = transaction.user
    const meta = transaction.meta
    const events = transaction.events
    const changes = transaction.changes

    let icon

    if (tran) {

        switch (tran.type) {
            case 'user_transaction': icon = "mif-user fg-green"; break;
            case 'block_metadata_transaction': icon = "mif-server fg-cyan"; break;
            case 'genesis_transaction': icon = "mif-cake fg-orange"; break;
        }

        $("#tr_icon").addClass(icon)

        $("#transaction-hash").text(tran.hash)

        $("#tr_status").removeClassBy("mif-").addClass(tran.success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red')
        $("#tr_number").text(tran.version)
        $("#tr_version").text(tran.version)
        $("#tr_timestamp").text(user || meta ? datetime(user ? user.timestamp : meta.timestamp).format(dateFormat.full) : "And God created Aptos")
        $("#tr_type").text(tranType[tran.type])
        $("#tr_hash").text(tran.hash)
        $("#tr_state_hash").text(tran.state_root_hash)
        $("#tr_event_hash").text(tran.event_root_hash)
        $("#tr_accumulator_hash").text(tran.accumulator_root_hash)
        $("#tr_gas_used").text(n2f(tran.gas_used))
        $("#tr_vm_status").addClass(`${tran.success ? 'success' : 'fail'}`).text(tran.vm_status)

        if (!tran.payload) {
            setTimeout(()=>{
                $("#payload-wrapper").parent().hide()
            }, 100)
        } else {
            $("#payload").html(`
                <div class="scrollable-container">
                    <pre><code class="json">${JSON.stringify(tran.payload, null, 2)}</code></pre>
                </div>
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
                <ul class="decimal votes-list">
                    <li>${meta.previous_block_votes.join("</li><li class='border-top bd-system'>")}</li>
                </ul>
            `)
        }

        if (!events) {
            setTimeout(()=>{
                $("#events-wrapper").parent().hide()
            }, 100)
        } else {
            const target = $("#events-list").clear()
            for(let c of events) {
                $("<tr>").html(`
                    <td>TYPE</td>
                    <td><div class="value">${c.type}</div></td>
                `).appendTo(target)
                $("<tr>").html(`
                    <td>KEY</td>
                    <td><div class="value long-value">${c.key}</div></td>
                `).appendTo(target)
                $("<tr>").html(`
                    <td>SEQUENCE NUMBER</td>
                    <td><div class="value long-value">${c.sequence_number}</div></td>
                `).appendTo(target)
                $("<tr>").addClass(c.data ? '' : 'd-none').html(`
                    <td colspan="2">DATA</td>
                `).appendTo(target)
                $("<tr>").addClass(c.data ? '' : 'd-none').html(`
                    <td colspan="2">
                        <div class="scrollable-container">
                            <pre><code>${JSON.stringify(c.data, null, 2)}</code></pre>
                        </div>
                    </td>
                `).appendTo(target)
                $("<tr>").html(`
                    <td colspan="2" class="border-top bd-system border-2" style="line-height: 1px; height: 1px; padding: 0!important;"></td>
                `).appendTo(target)
            }
        }

        if (!changes) {
            setTimeout(()=>{
                $("#changes-wrapper").parent().hide()
            }, 100)
        } else {
            const target = $("#changes-list").clear()
            let table

            for(let c of changes) {
                target.append(
                    $("<table>").addClass("table striped info-table").append(
                        table = $("<tbody>")
                    )
                )

                $("<tr>").html(`
                    <td>TYPE</td>
                    <td><div class="value">${c.type}</divc></td>
                `).appendTo(table)
                $("<tr>").html(`
                    <td>ADDRESS</td>
                    <td><div class="value long-value">${c.address}</div></td>
                `).appendTo(table)
                $("<tr>").html(`
                    <td>HASH</td>
                    <td><div class="value long-value">${c.hash}</div></td>
                `).appendTo(table)

                if (c.data) {
                    target.append($("<div>").addClass("bd-system").css("border-top", "dotted 1px"))
                    target.append(
                        $("<div>").addClass("text-bold fg-system p-2 reduce-2").html("DATA")
                    )
                    target.append(
                        $("<div>").addClass("scrollable-container").html(`
                        <pre><code class="mb-4">${JSON.stringify(c.data, null, 2)}</code></pre>
                    `)
                    )
                    target.append($("<hr>"))
                }


                if (c.module) {
                    target.append($("<div>").addClass("bd-system").css("border-top", "dotted 1px"))
                    target.append(
                        $("<div>").addClass("text-bold fg-system p-2 reduce-2").html("MODULE")
                    )
                    target.append(
                        $("<div>").addClass("scrollable-container").html(`
                        <pre><code class="mb-4">${JSON.stringify(c.module, null, 2)}</code></pre>
                    `)
                    )
                    target.append($("<hr>"))
                }


                if (c.resource) {
                    target.append($("<div>").addClass("bd-system").css("border-top", "dotted 1px"))
                    target.append(
                        $("<div>").addClass("text-bold fg-system p-2 reduce-2").html("RESOURCE")
                    )
                    target.append(
                        $("<div>").addClass("scrollable-container").html(`
                        <pre><code class="mb-4">${JSON.stringify(c.resource, null, 2)}</code></pre>
                    `)
                    )

                    target.append($("<hr>"))
                }
            }
        }
    }
}

export const updateAccount = (data) => {
    const {address, account, resources, modules, transactions, metadata, events} = data
    let validator = false

    $("#address").text(address)
    $("#authentication_key").text(account.authentication_key)
    $("#sequence_number").text(account.sequence_number)

    for(let r of resources ) {
        if (r.type === '0x1::Stake::ValidatorConfig')
            validator = true
    }

    $("#user_icon").addClass(validator ? 'mif-user-secret' : 'mif-organization')
    $("#user-type").html(validator ? 'VALIDATOR' : 'SIMPLE USER')

    $("#user-events-count").text(n2f(events.length))
    $("#user-resources-count").text(n2f(resources.length))
    $("#user-transactions-count").text(n2f(transactions.length || metadata.length))
    $("#user-modules-count").text(n2f(modules.length))

    if (!resources) {

    } else {
        const target = $("#resources").clear()
        let index = 0, table

        for(let r of resources) {
            if (index) target.append($("<div>").addClass("bd-system").css("border-top", "dotted 1px"))

            target.append(
                $("<table>").addClass("table striped info-table").append(
                    table = $("<tbody>")
                )
            )

            $("<tr>").html(`
                <td colspan="2"><div class="value">${r.type}</divc></td>
            `).appendTo(table)
            $("<tr>").html(`
                <td colspan="2">DATA</td>
            `).appendTo(table)

            target.append(
                $("<div>").addClass("mt-2 scrollable-container").html(`
                    <pre><code class="mb-4">${JSON.stringify(r.data, null, 2)}</code></pre>
                `)
            )

            index++
        }
    }
}